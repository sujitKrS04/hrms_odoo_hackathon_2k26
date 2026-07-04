/**
 * backend/src/services/attendance.service.ts
 * Blocks 4 & 5 — check-in, check-out, list attendance
 */
import { prisma } from '../config/prisma';
import { canManage } from '../utils/permissions';
import { ApiError } from '../utils/ApiError';
import type { UserRole } from '@prisma/client';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayUtc(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
}

// ─────────────────────────────────────────────────────────────────────────────
// Block 4 — POST /api/attendance/check-in  &  /check-out
// userId is ALWAYS taken from req.user — never from the request body.
// ─────────────────────────────────────────────────────────────────────────────

export async function checkIn(userId: string) {
  const today = todayUtc();

  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  if (existing) {
    throw new ApiError(
      409,
      existing.checkIn
        ? 'You have already checked in today.'
        : 'An attendance record for today already exists.',
    );
  }

  const record = await prisma.attendance.create({
    data: {
      userId,
      date:    today,
      checkIn: new Date(),
      status:  'present',
    },
  });

  return record;
}

export async function checkOut(userId: string) {
  const today = todayUtc();

  const existing = await prisma.attendance.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  if (!existing || !existing.checkIn) {
    throw new ApiError(400, 'You have not checked in today. Please check in first.');
  }
  if (existing.checkOut) {
    throw new ApiError(409, 'You have already checked out today.');
  }

  const record = await prisma.attendance.update({
    where: { userId_date: { userId, date: today } },
    data:  { checkOut: new Date() },
  });

  // Derive hours worked for convenience
  const msWorked = record.checkOut!.getTime() - record.checkIn!.getTime();
  const hoursWorked = +(msWorked / 3_600_000).toFixed(2);

  return { ...record, hoursWorked };
}

// ─────────────────────────────────────────────────────────────────────────────
// Block 5 — GET /api/attendance  (role-scoped)
// admin/hr → full company (filterable by userId, dateFrom, dateTo)
// employee → own records only
// ─────────────────────────────────────────────────────────────────────────────

export interface ListAttendanceQuery {
  userId?:    string;
  dateFrom?:  string;   // ISO date string
  dateTo?:    string;
  page?:      number;
  limit?:     number;
}

export async function listAttendance(
  actor: { id: string; role: UserRole; companyId: string },
  query: ListAttendanceQuery,
) {
  const page  = Math.max(1, query.page  ?? 1);
  const limit = Math.min(200, Math.max(1, query.limit ?? 31));
  const skip  = (page - 1) * limit;

  // Base user scope
  let userWhere: Record<string, unknown>;

  if (actor.role === 'employee') {
    // Employee can only see their own records — ignore any userId in query
    userWhere = { id: actor.id };
  } else {
    // Admin / HR — may optionally filter to a single user
    if (query.userId) {
      // Verify target user belongs to actor's company
      const target = await prisma.user.findFirst({
        where: { id: query.userId, companyId: actor.companyId },
        select: { id: true, role: true },
      });
      if (!target) throw new ApiError(404, 'User not found in your company.');

      // HR cannot query admin attendance
      if (actor.role === 'hr' && !canManage('hr', target.role as UserRole)) {
        throw new ApiError(403, 'HR can only view employee attendance.');
      }

      userWhere = { id: query.userId };
    } else {
      // All users in company visible to this actor
      const roleIn: UserRole[] =
        actor.role === 'admin' ? ['admin', 'hr', 'employee'] : ['employee'];
      userWhere = { companyId: actor.companyId, role: { in: roleIn } };
    }
  }

  const dateWhere: Record<string, unknown> = {};
  if (query.dateFrom) dateWhere['gte'] = new Date(query.dateFrom);
  if (query.dateTo)   dateWhere['lte'] = new Date(query.dateTo!);

  const where = {
    user: userWhere,
    ...(Object.keys(dateWhere).length > 0 && { date: dateWhere }),
  };

  const [total, records] = await prisma.$transaction([
    prisma.attendance.count({ where }),
    prisma.attendance.findMany({
      where,
      skip,
      take:    limit,
      orderBy: [{ date: 'desc' }, { checkIn: 'desc' }],
      include: {
        user: {
          select: { id: true, loginId: true, firstName: true, lastName: true, role: true },
        },
      },
    }),
  ]);

  return {
    data: records,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}
