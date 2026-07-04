/**
 * backend/src/services/leave.service.ts
 * Block 6 — leave requests: list, create, approve/reject
 *
 * ══════════════════════════════════════════════════════════════════════════════
 *  CRITICAL ROUTING RULE — READ BEFORE EDITING
 * ══════════════════════════════════════════════════════════════════════════════
 *  An HR user's OWN leave request must appear ONLY in the ADMIN queue.
 *  HR users must NEVER see other HR users' leave requests.
 *
 *  Implementation:
 *    - listLeaveRequests as HR  → filter WHERE user.role = 'employee'
 *    - listLeaveRequests as Admin → no role filter (sees everyone)
 *    - reviewLeaveRequest as HR → reject if requester.role ≠ 'employee'
 *
 *  UNIT TEST SCENARIO (verify manually after seeding):
 *    1. Log in as HR user (ACprir2024002)
 *    2. GET /api/leave-requests  → must NOT see Kiran Das's leave request
 *       (Kiran is also HR, ACkias2024003)
 *    3. Log in as Admin (ACarma2024001)
 *    4. GET /api/leave-requests  → MUST see Kiran Das's leave request
 *    5. HR tries PATCH /api/leave-requests/<kiran-request-id>  → 403
 * ══════════════════════════════════════════════════════════════════════════════
 */
import { prisma } from '../config/prisma';
import { canManage } from '../utils/permissions';
import { ApiError } from '../utils/ApiError';
import type { LeaveStatus, UserRole } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/leave-requests
// ─────────────────────────────────────────────────────────────────────────────

export interface ListLeaveQuery {
  status?:  LeaveStatus;
  userId?:  string;
  year?:    number;
  page?:    number;
  limit?:   number;
}

export async function listLeaveRequests(
  actor: { id: string; role: UserRole; companyId: string },
  query: ListLeaveQuery,
) {
  const page  = Math.max(1, query.page  ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 20));
  const skip  = (page - 1) * limit;

  let userWhere: Record<string, unknown>;

  if (actor.role === 'employee') {
    // Employees see only their own requests
    userWhere = { id: actor.id };
  } else if (actor.role === 'hr') {
    // ── ROUTING RULE: HR sees ONLY employee leave requests ──
    // HR leave requests go to the ADMIN queue exclusively.
    userWhere = { companyId: actor.companyId, role: 'employee' };
  } else {
    // Admin sees everyone in the company
    userWhere = { companyId: actor.companyId };
    if (query.userId) {
      userWhere = { id: query.userId, companyId: actor.companyId };
    }
  }

  const statusFilter = query.status ? { status: query.status } : {};

  const where = {
    user: userWhere,
    ...statusFilter,
  };

  const [total, requests] = await prisma.$transaction([
    prisma.leaveRequest.count({ where }),
    prisma.leaveRequest.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user:      { select: { id: true, loginId: true, firstName: true, lastName: true, role: true } },
        leaveType: { select: { id: true, name: true, isPaid: true } },
        reviewedBy:{ select: { id: true, firstName: true, lastName: true } },
      },
    }),
  ]);

  return {
    data: requests,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/leave-requests
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateLeaveInput {
  leaveTypeId: string;
  startDate:   string;
  endDate:     string;
  daysCount:   number;
  reason?:     string;
}

export async function createLeaveRequest(
  actor: { id: string; companyId: string },
  input: CreateLeaveInput,
) {
  const start = new Date(input.startDate);
  const end   = new Date(input.endDate);
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(0, 0, 0, 0);

  if (end < start) {
    throw new ApiError(400, 'End date cannot be before start date.', 'endDate');
  }

  // Verify leave type exists
  const leaveType = await prisma.leaveType.findUnique({ where: { id: input.leaveTypeId } });
  if (!leaveType) throw new ApiError(404, 'Leave type not found.', 'leaveTypeId');

  const year = start.getFullYear();

  // Check allocation
  const allocation = await prisma.leaveAllocation.findUnique({
    where: {
      userId_leaveTypeId_year: {
        userId:      actor.id,
        leaveTypeId: input.leaveTypeId,
        year,
      },
    },
  });
  if (!allocation) {
    throw new ApiError(400, `No ${leaveType.name} allocation for year ${year}.`);
  }
  const remaining = allocation.totalDays - allocation.usedDays;
  if (input.daysCount > remaining) {
    throw new ApiError(
      400,
      `Insufficient leave balance. You have ${remaining} day(s) remaining for ${leaveType.name}.`,
    );
  }

  // Guard: overlapping pending/approved requests
  const overlap = await prisma.leaveRequest.findFirst({
    where: {
      userId:    actor.id,
      status:    { in: ['pending', 'approved'] },
      startDate: { lte: end },
      endDate:   { gte: start },
    },
  });
  if (overlap) {
    throw new ApiError(
      409,
      'You already have a pending or approved leave request overlapping those dates.',
    );
  }

  return prisma.leaveRequest.create({
    data: {
      userId:      actor.id,
      leaveTypeId: input.leaveTypeId,
      startDate:   start,
      endDate:     end,
      daysCount:   input.daysCount,
      reason:      input.reason,
      status:      'pending',
    },
    include: {
      leaveType: { select: { name: true, isPaid: true } },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/leave-requests/:id  (approve | reject)
// ─────────────────────────────────────────────────────────────────────────────

export async function reviewLeaveRequest(
  actor: { id: string; role: UserRole; companyId: string },
  requestId: string,
  decision: 'approved' | 'rejected',
  reviewerNote?: string,
) {
  if (actor.role === 'employee') {
    throw new ApiError(403, 'Employees cannot review leave requests.');
  }

  const leaveRequest = await prisma.leaveRequest.findFirst({
    where: {
      id:   requestId,
      user: { companyId: actor.companyId },
    },
    include: {
      user: { select: { id: true, role: true, firstName: true, lastName: true } },
    },
  });

  if (!leaveRequest) throw new ApiError(404, 'Leave request not found.');
  if (leaveRequest.status !== 'pending') {
    throw new ApiError(400, `This request has already been ${leaveRequest.status} and cannot be changed.`);
  }

  // ── ROUTING RULE: HR can ONLY review EMPLOYEE leave requests ──────────────
  // HR leave requests must go to the Admin queue.
  if (actor.role === 'hr' && leaveRequest.user.role !== 'employee') {
    throw new ApiError(
      403,
      "HR can only review employee leave requests. " +
      "Leave requests from HR users must be reviewed by an admin.",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.leaveRequest.update({
      where: { id: requestId },
      data: {
        status:       decision,
        reviewedById: actor.id,
        reviewedAt:   new Date(),
        reviewerNote: reviewerNote ?? null,
      },
    });

    // On approval: increment usedDays in the allocation
    if (decision === 'approved') {
      const year = leaveRequest.startDate.getFullYear();
      await tx.leaveAllocation.updateMany({
        where: {
          userId:      leaveRequest.userId,
          leaveTypeId: leaveRequest.leaveTypeId,
          year,
        },
        data: { usedDays: { increment: leaveRequest.daysCount } },
      });
    }
  });

  return prisma.leaveRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: {
      user:       { select: { id: true, loginId: true, firstName: true, lastName: true } },
      leaveType:  { select: { name: true } },
      reviewedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}
