/**
 * backend/src/controllers/leave.controller.ts
 * Block 6
 */
import type { Request, Response, NextFunction } from 'express';
import * as svc from '../services/leave.service';
import type { LeaveStatus } from '@prisma/client';

export async function listLeaveRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await svc.listLeaveRequests(req.user!, {
      status: req.query.status as LeaveStatus | undefined,
      userId: req.query.userId as string | undefined,
      page:   req.query.page  ? Number(req.query.page)  : undefined,
      limit:  req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json(result);
  } catch (err) { next(err); }
}

export async function createLeaveRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await svc.createLeaveRequest(req.user!, req.body);
    res.status(201).json({ message: 'Leave request submitted successfully.', data: result });
  } catch (err) { next(err); }
}

export async function reviewLeaveRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { decision, reviewerNote } = req.body as { decision: 'approved' | 'rejected'; reviewerNote?: string };
    const result = await svc.reviewLeaveRequest(req.user!, req.params.id, decision, reviewerNote);
    res.json({ message: `Leave request ${decision}.`, data: result });
  } catch (err) { next(err); }
}
