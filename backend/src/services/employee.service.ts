/**
 * backend/src/services/employee.service.ts
 * Blocks 1, 2, 3 — list, profile get/patch, live status
 */
import { prisma } from '../config/prisma';
import { canManage } from '../utils/permissions';
import { ApiError } from '../utils/ApiError';
import type { UserRole } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// Block 1 — GET /api/employees
// admin → all non-admin (hr + employee). hr → employee only. employee → 403.
// ─────────────────────────────────────────────────────────────────────────────

export interface ListEmployeesQuery {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  role?: UserRole;
  isActive?: boolean;
}

export async function listEmployees(
  actor: { id: string; role: UserRole; companyId: string },
  query: ListEmployeesQuery,
) {
  if (actor.role === 'employee') {
    throw new ApiError(403, 'Employees are not permitted to list other users.');
  }

  const page  = Math.max(1, query.page  ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 20));
  const skip  = (page - 1) * limit;

  // Scope the visible roles by the actor's role
  const visibleRoles: UserRole[] =
    actor.role === 'admin' ? ['hr', 'employee'] : ['employee'];

  // If admin requests a specific role filter, honour it — but never let them
  // request 'admin' (keeps admin accounts invisible from the list UI)
  const roleFilter =
    query.role && visibleRoles.includes(query.role)
      ? [query.role]
      : visibleRoles;

  const where = {
    companyId: actor.companyId,
    role:      { in: roleFilter },
    ...(query.departmentId !== undefined && { departmentId: query.departmentId }),
    ...(query.isActive     !== undefined && { isActive:     query.isActive }),
    ...(query.search && {
      OR: [
        { firstName: { contains: query.search, mode: 'insensitive' as const } },
        { lastName:  { contains: query.search, mode: 'insensitive' as const } },
        { email:     { contains: query.search, mode: 'insensitive' as const } },
        { loginId:   { contains: query.search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      select: {
        id:                 true,
        loginId:            true,
        email:              true,
        role:               true,
        firstName:          true,
        lastName:           true,
        phone:              true,
        hireDate:           true,
        isActive:           true,
        mustChangePassword: true,
        department:  { select: { id: true, name: true } },
        jobPosition: { select: { id: true, title: true, level: true } },
        manager:     { select: { id: true, firstName: true, lastName: true } },
        createdAt:   true,
      },
    }),
  ]);

  return {
    data: users,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Block 2 — GET/PATCH /api/employees/:id/profile
// ─────────────────────────────────────────────────────────────────────────────

async function resolveTargetUser(targetUserId: string, actorCompanyId: string) {
  const user = await prisma.user.findFirst({
    where: { id: targetUserId, companyId: actorCompanyId },
    select: { id: true, role: true },
  });
  if (!user) throw new ApiError(404, 'Employee not found.');
  return user;
}

export async function getEmployeeProfile(
  actor: { id: string; role: UserRole; companyId: string },
  targetUserId: string,
) {
  const target = await resolveTargetUser(targetUserId, actor.companyId);

  // Employee can only view their own profile
  if (actor.role === 'employee' && actor.id !== targetUserId) {
    throw new ApiError(403, 'Employees can only view their own profile.');
  }
  // HR cannot view admin/other-hr profiles
  if (actor.role === 'hr' && !canManage('hr', target.role)) {
    throw new ApiError(403, 'HR can only view employee profiles.');
  }

  return prisma.user.findUniqueOrThrow({
    where: { id: targetUserId },
    select: {
      id: true, loginId: true, email: true, role: true,
      firstName: true, lastName: true, phone: true,
      hireDate: true, isActive: true,
      department:     { select: { id: true, name: true } },
      jobPosition:    { select: { id: true, title: true } },
      manager:        { select: { id: true, firstName: true, lastName: true } },
      profile:        true,
      bankDetail: {
        select: {
          bankName: true, accountType: true,
          ifscCode: true, accountNumber: true,
        },
      },
      skills:         true,
      certifications: true,
    },
  });
}

export interface UpdateProfileInput {
  phone?:                 string;
  address?:               string;
  city?:                  string;
  state?:                 string;
  pincode?:               string;
  nationality?:           string;
  maritalStatus?:         string;
  avatarUrl?:             string;
  emergencyContactName?:  string;
  emergencyContactPhone?: string;
  dateOfBirth?:           string;   // ISO string, parsed server-side
  gender?:                string;
}

export async function updateEmployeeProfile(
  actor: { id: string; role: UserRole; companyId: string },
  targetUserId: string,
  input: UpdateProfileInput,
) {
  const target = await resolveTargetUser(targetUserId, actor.companyId);
  const isSelf = actor.id === targetUserId;

  // Employees may only update their own record
  if (actor.role === 'employee' && !isSelf) {
    throw new ApiError(403, 'Employees can only update their own profile.');
  }
  // Cross-user update — apply canManage role hierarchy
  if (!isSelf && !canManage(actor.role, target.role)) {
    throw new ApiError(403, 'You do not have permission to update this user\'s profile.');
  }

  // For employee self-update: restrict to only the 3 permitted fields
  const data: UpdateProfileInput = actor.role === 'employee'
    ? {
        phone:     input.phone,
        address:   input.address,
        city:      input.city,
        pincode:   input.pincode,
        avatarUrl: input.avatarUrl,
      }
    : input;

  await prisma.$transaction(async (tx) => {
    if (data.phone !== undefined) {
      await tx.user.update({ where: { id: targetUserId }, data: { phone: data.phone } });
    }

    const profileFields: Record<string, unknown> = {};
    const mapField = (k: keyof typeof profileFields, v: unknown) => {
      if (v !== undefined) profileFields[k] = v;
    };
    mapField('address',               data.address);
    mapField('city',                  data.city);
    mapField('state',                 data.state);
    mapField('pincode',               data.pincode);
    mapField('nationality',           data.nationality);
    mapField('maritalStatus',         data.maritalStatus);
    mapField('avatarUrl',             data.avatarUrl);
    mapField('emergencyContactName',  data.emergencyContactName);
    mapField('emergencyContactPhone', data.emergencyContactPhone);
    mapField('gender',                data.gender);
    if (data.dateOfBirth !== undefined) {
      profileFields['dateOfBirth'] = new Date(data.dateOfBirth);
    }

    if (Object.keys(profileFields).length > 0) {
      await tx.employeeProfile.upsert({
        where:  { userId: targetUserId },
        create: { userId: targetUserId, ...profileFields },
        update: profileFields,
      });
    }
  });

  return prisma.user.findUniqueOrThrow({
    where: { id: targetUserId },
    select: {
      id: true, loginId: true, email: true, role: true,
      firstName: true, lastName: true, phone: true,
      profile: true,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Block 3 — GET /api/employees/:id/status  (computed live, no stored column)
//
// Priority: 1) today's attendance row  2) approved leave covering today
//           3) default 'absent'
// ─────────────────────────────────────────────────────────────────────────────

export async function getEmployeeStatus(
  actor: { id: string; role: UserRole; companyId: string },
  targetUserId: string,
) {
  const target = await resolveTargetUser(targetUserId, actor.companyId);

  if (actor.role === 'employee' && actor.id !== targetUserId) {
    throw new ApiError(403, 'Employees can only view their own status.');
  }
  if (actor.role === 'hr' && !canManage('hr', target.role)) {
    throw new ApiError(403, 'HR can only view employee status.');
  }

  // Midnight today in UTC (Prisma stores @db.Date as UTC midnight)
  const now  = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  // 1. Today's attendance row
  const attendance = await prisma.attendance.findUnique({
    where:  { userId_date: { userId: targetUserId, date: today } },
    select: { status: true, checkIn: true, checkOut: true, note: true },
  });

  if (attendance) {
    return {
      status:   attendance.status,
      checkIn:  attendance.checkIn,
      checkOut: attendance.checkOut,
      note:     attendance.note,
      source:   'attendance' as const,
      date:     today,
    };
  }

  // 2. Approved leave covering today
  const approvedLeave = await prisma.leaveRequest.findFirst({
    where: {
      userId:    targetUserId,
      status:    'approved',
      startDate: { lte: today },
      endDate:   { gte: today },
    },
    select: {
      id: true, startDate: true, endDate: true, daysCount: true,
      leaveType: { select: { name: true, isPaid: true } },
    },
  });

  if (approvedLeave) {
    return {
      status:   'on_leave' as const,
      checkIn:  null,
      checkOut: null,
      note:     `On ${approvedLeave.leaveType.name}`,
      leave:    approvedLeave,
      source:   'leave' as const,
      date:     today,
    };
  }

  // 3. Default
  return {
    status:   'absent' as const,
    checkIn:  null,
    checkOut: null,
    note:     null,
    source:   'default' as const,
    date:     today,
  };
}
