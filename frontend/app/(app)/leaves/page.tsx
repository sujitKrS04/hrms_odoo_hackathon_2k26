'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../components/AuthContext';
import { PageHeader, Card, FormField, DataTable } from '../../components/Primitives';
import { apiRequest, ResponseError } from '../../utils/api';
import {
  CalendarDays,
  Plus,
  CheckCircle,
  XCircle,
  FileText,
  Paperclip,
  Check,
  X
} from 'lucide-react';

export default function LeavesPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Application Modal States
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [daysCount, setDaysCount] = useState(0);
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);

  // Review (Approval) States
  const [reviewingItem, setReviewingItem] = useState<any>(null);
  const [reviewerNote, setReviewerNote] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const isStaff = user?.role === 'employee';

  const fetchLeavesData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // Fetch requests
      const reqRes = await apiRequest('/leave-requests');
      setRequests(reqRes.data || []);

      // Fetch allocations for current user
      const allocRes = await apiRequest('/leave-requests/allocations');
      setAllocations(allocRes || []);

      // Fetch types
      const typesRes = await apiRequest('/leave-requests/types');
      setLeaveTypes(typesRes || []);
    } catch (e) {
      setErrorMsg('Failed to load leave logs and allocations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLeavesData();
    }
  }, [user]);

  // Compute days count when start or end date changes
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end >= start) {
        // Calculate standard calendar day difference
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setDaysCount(diffDays);
      } else {
        setDaysCount(0);
      }
    } else {
      setDaysCount(0);
    }
  }, [startDate, endDate]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError(null);
    setApplyLoading(true);

    try {
      if (!selectedType) throw new Error('Please select a leave type.');
      if (daysCount <= 0) throw new Error('Please verify your date range is valid.');

      await apiRequest('/leave-requests', {
        method: 'POST',
        body: JSON.stringify({
          leaveTypeId: selectedType,
          startDate,
          endDate,
          daysCount,
          reason: reason || undefined,
        }),
      });

      setShowApplyModal(false);
      resetApplyForm();
      fetchLeavesData();
    } catch (err: any) {
      if (err instanceof ResponseError) {
        setApplyError(err.errorData.message);
      } else {
        setApplyError(err.message || 'Failed to submit request.');
      }
    } finally {
      setApplyLoading(false);
    }
  };

  const resetApplyForm = () => {
    setSelectedType('');
    setStartDate('');
    setEndDate('');
    setDaysCount(0);
    setReason('');
    setAttachment(null);
    setApplyError(null);
  };

  const handleReviewAction = async (decision: 'approved' | 'rejected') => {
    if (!reviewingItem) return;
    setReviewLoading(true);

    try {
      await apiRequest(`/leave-requests/${reviewingItem.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          decision,
          reviewerNote: reviewerNote || undefined,
        }),
      });

      setReviewingItem(null);
      setReviewerNote('');
      fetchLeavesData();
    } catch (err: any) {
      alert(err instanceof ResponseError ? err.errorData.message : 'Action failed.');
    } finally {
      setReviewLoading(false);
    }
  };

  // Helper to match leave type name to short tag
  const getSelectedTypeName = () => {
    return leaveTypes.find((t) => t.id === selectedType)?.name || '';
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const processedRequests = requests.filter((r) => r.status !== 'pending');

  const requestColumns = [
    ...(!isStaff
      ? [
          {
            header: 'Requester',
            accessor: (row: any) => (
              <div className="font-semibold text-text">
                {row.user?.firstName} {row.user?.lastName}
                <span className="text-[10px] text-text-muted font-mono block">{row.user?.loginId}</span>
              </div>
            ),
          },
        ]
      : []),
    { header: 'Type', accessor: (row: any) => row.leaveType?.name || 'Leave' },
    {
      header: 'Period',
      accessor: (row: any) => (
        <span className="text-xs">
          {new Date(row.startDate).toLocaleDateString()} to {new Date(row.endDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Days',
      accessor: (row: any) => <span className="font-mono text-xs font-semibold">{row.daysCount} d</span>,
    },
    { header: 'Reason', accessor: 'reason', className: 'max-w-xs truncate' },
    {
      header: 'Status',
      accessor: (row: any) => (
        <span className={`px-2 py-0.5 rounded text-xs font-bold capitalize ${
          row.status === 'approved' ? 'bg-status-present/15 text-status-present' :
          row.status === 'rejected' ? 'bg-status-absent/15 text-status-absent' : 'bg-status-leave/15 text-status-leave'
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Reviewer Note',
      accessor: (row: any) => (
        <div className="text-xs text-text-muted">
          {row.reviewerNote ? (
            <span>
              "{row.reviewerNote}" <span className="text-[10px] block mt-0.5">by {row.reviewedBy?.firstName}</span>
            </span>
          ) : (
            <span className="italic">—</span>
          )}
        </div>
      ),
    },
    ...(!isStaff
      ? [
          {
            header: 'Actions',
            accessor: (row: any) => {
              if (row.status !== 'pending') return <span className="text-text-muted text-xs">Reviewed</span>;
              return (
                <button
                  onClick={() => setReviewingItem(row)}
                  className="px-3 py-1 bg-accent text-background text-xs font-semibold rounded hover:opacity-95 transition-all"
                >
                  Review
                </button>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Time Off Planner"
          description="Submit leave requests, audit allocation balances, and review pending team request queues."
        />

        {isStaff && (
          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent text-background font-semibold rounded-lg hover:opacity-90 transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" /> Apply for Leave
          </button>
        )}
      </div>

      {/* Leave Allocations Grid (Employees see their remaining days) */}
      {isStaff && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {allocations.map((alloc) => (
            <div key={alloc.id} className="bg-surface border border-border p-6 rounded-xl flex justify-between items-center relative overflow-hidden">
              <div>
                <span className="text-xs text-text-muted font-semibold block uppercase">
                  {alloc.leaveType?.name}
                </span>
                <span className="text-2xl font-bold font-mono text-accent mt-2 block">
                  {alloc.totalDays - alloc.usedDays} Days
                </span>
                <span className="text-[10px] text-text-muted block mt-1">
                  Used: {alloc.usedDays} / {alloc.totalDays} days allocated
                </span>
              </div>
              <div className="h-10 w-10 bg-status-leave/10 rounded-full flex items-center justify-center text-status-leave">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Queue (HR/Admin only) */}
      {!isStaff && (
        <div className="space-y-6">
          <Card title="Pending Requests Approval Queue" subtitle={`There are ${pendingRequests.length} pending review items.`}>
            <DataTable
              columns={requestColumns}
              data={pendingRequests}
              isLoading={loading}
              emptyMessage="No pending leave requests found."
            />
          </Card>
        </div>
      )}

      {/* Processed/All Logs Table */}
      <Card title={isStaff ? 'My Leave History' : 'Processed Logs History'}>
        <DataTable
          columns={requestColumns}
          data={isStaff ? requests : processedRequests}
          isLoading={loading}
          emptyMessage="No leave history recorded."
        />
      </Card>

      {/* Submit Leave Application Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-semibold text-text font-display">Apply for Time Off</h3>
              <button onClick={() => setShowApplyModal(false)} className="text-text-muted hover:text-text">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="p-6 space-y-4">
              {applyError && (
                <div className="p-3 bg-status-absent/15 text-status-absent border border-status-absent/30 rounded-lg text-xs font-semibold">
                  {applyError}
                </div>
              )}

              {/* Leave Type Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider">Leave Category</label>
                <select
                  required
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  <option value="">Select leave type...</option>
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Start Date"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <FormField
                  label="End Date"
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setTemplateDate(e, setEndDate)}
                />
              </div>

              {daysCount > 0 && (
                <div className="p-3 bg-background border border-border rounded-lg text-xs font-semibold flex justify-between items-center">
                  <span>Computed Period:</span>
                  <span className="font-mono text-accent text-sm font-bold">{daysCount} calendar days</span>
                </div>
              )}

              {/* Reason */}
              <FormField
                label="Reason for leave"
                placeholder="Describe why you need time off..."
                textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />

              {/* File Upload for Sick Leave */}
              {getSelectedTypeName().toLowerCase().includes('sick') && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5" /> Medical Certificate
                  </label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-accent transition-colors">
                    {attachment ? (
                      <div className="flex items-center justify-between text-xs text-text bg-background p-2 rounded">
                        <span className="truncate">{attachment.name}</span>
                        <button type="button" onClick={() => setAttachment(null)} className="text-status-absent">
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <span className="text-xs text-accent font-semibold block">Click to upload doc</span>
                        <span className="text-[10px] text-text-muted mt-1 block">PDF, PNG, JPG (Max 5MB)</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-2.5 bg-background border border-border text-text font-semibold rounded-lg hover:bg-surface active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applyLoading || daysCount <= 0}
                  className="flex-1 py-2.5 bg-accent text-background font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {applyLoading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reviewer Action Modal */}
      {reviewingItem && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <h3 className="text-base font-semibold text-text">Review Time Off Request</h3>
              <button onClick={() => setReviewingItem(null)}>
                <X className="h-4.5 w-4.5 text-text-muted hover:text-text" />
              </button>
            </div>

            <div className="text-xs space-y-2 bg-background p-3.5 border border-border rounded-lg font-sans">
              <p>
                <strong className="text-text">Employee:</strong> {reviewingItem.user?.firstName} {reviewingItem.user?.lastName}
              </p>
              <p>
                <strong className="text-text">Leave category:</strong> {reviewingItem.leaveType?.name}
              </p>
              <p>
                <strong className="text-text">Requested range:</strong> {new Date(reviewingItem.startDate).toLocaleDateString()} to {new Date(reviewingItem.endDate).toLocaleDateString()} ({reviewingItem.daysCount} days)
              </p>
              {reviewingItem.reason && (
                <p>
                  <strong className="text-text">Reason:</strong> "{reviewingItem.reason}"
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider">Reviewer Comment / Notes</label>
              <textarea
                value={reviewerNote}
                onChange={(e) => setReviewerNote(e.target.value)}
                placeholder="Optional explanation for decision..."
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent resize-none h-20"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <button
                onClick={() => handleReviewAction('rejected')}
                disabled={reviewLoading}
                className="flex-1 py-2 bg-status-absent hover:opacity-90 text-white font-semibold rounded-lg flex items-center justify-center gap-1 text-sm disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" /> Reject
              </button>
              <button
                onClick={() => handleReviewAction('approved')}
                disabled={reviewLoading}
                className="flex-1 py-2 bg-status-present hover:opacity-90 text-white font-semibold rounded-lg flex items-center justify-center gap-1 text-sm disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" /> Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple wrapper helper for dates input updates
function setTemplateDate(e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) {
  setter(e.target.value);
}
