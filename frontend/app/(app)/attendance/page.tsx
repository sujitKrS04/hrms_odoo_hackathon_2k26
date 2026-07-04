'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../components/AuthContext';
import { PageHeader, Card, DataTable } from '../../components/Primitives';
import { StatusDot } from '../../components/StatusDot';
import { apiRequest, ResponseError } from '../../utils/api';
import {
  Clock,
  ArrowRightLeft,
  Calendar,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';

export default function AttendancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters for HR/Admin
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Personal status clocking
  const [personalToday, setPersonalToday] = useState<any>(null);
  const [loadingToday, setLoadingToday] = useState(true);
  const [clockLoading, setClockLoading] = useState(false);
  const [clockError, setClockError] = useState<string | null>(null);

  const isStaff = user?.role === 'employee';

  const fetchAttendanceLogs = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // Build query string
      const params = new URLSearchParams();
      if (!isStaff) {
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);
      }
      params.append('limit', '100');

      const res = await apiRequest(`/attendance?${params.toString()}`);
      setRecords(res.data || []);
    } catch (e) {
      setErrorMsg('Failed to retrieve attendance logs.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayStatus = async () => {
    if (!user) return;
    try {
      setLoadingToday(true);
      const data = await apiRequest(`/employees/${user.id}/status`);
      setPersonalToday(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingToday(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAttendanceLogs();
      fetchTodayStatus();
    }
  }, [user, dateFrom, dateTo]);

  const handleCheckIn = async () => {
    setClockError(null);
    setClockLoading(true);
    try {
      const res = await apiRequest('/attendance/check-in', { method: 'POST' });
      setPersonalToday({
        status: 'present',
        checkIn: res.record?.checkIn || new Date().toISOString(),
        checkOut: null,
        note: null,
      });
      // Refresh list logs
      fetchAttendanceLogs();
    } catch (err: any) {
      if (err instanceof ResponseError) {
        setClockError(err.errorData.message);
      } else {
        setClockError('An unexpected error occurred during check in.');
      }
    } finally {
      setClockLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setClockError(null);
    setClockLoading(true);
    try {
      const res = await apiRequest('/attendance/check-out', { method: 'POST' });
      setPersonalToday({
        status: 'present',
        checkIn: personalToday?.checkIn,
        checkOut: res.record?.checkOut || new Date().toISOString(),
        note: null,
      });
      fetchAttendanceLogs();
    } catch (err: any) {
      if (err instanceof ResponseError) {
        setClockError(err.errorData.message);
      } else {
        setClockError('An unexpected error occurred during check out.');
      }
    } finally {
      setClockLoading(false);
    }
  };

  // Compute metrics for personal log view
  const computeMetrics = () => {
    if (!isStaff) return { present: 0, leaves: 0, absent: 0 };
    let present = 0;
    let leaves = 0;
    let absent = 0;

    records.forEach((r) => {
      if (r.status === 'present' || r.status === 'work_from_home' || r.status === 'half_day') {
        present++;
      } else if (r.status === 'on_leave') {
        leaves++;
      } else if (r.status === 'absent') {
        absent++;
      }
    });

    return { present, leaves, absent };
  };

  const metrics = computeMetrics();

  // Search logic for HR/Admin list
  const filteredRecords = records.filter((rec) => {
    if (isStaff) return true; // Already filtered server-side
    const empName = `${rec.user?.firstName || ''} ${rec.user?.lastName || ''}`.toLowerCase();
    const loginId = (rec.user?.loginId || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return empName.includes(query) || loginId.includes(query);
  });

  const columns = [
    ...(!isStaff
      ? [
          {
            header: 'Employee',
            accessor: (row: any) => (
              <div className="font-semibold text-text">
                {row.user?.firstName} {row.user?.lastName}
                <span className="text-[10px] text-text-muted font-mono ml-2">({row.user?.loginId})</span>
              </div>
            ),
          },
        ]
      : []),
    {
      header: 'Date',
      accessor: (row: any) => (
        <span className="font-semibold">{new Date(row.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          <StatusDot status={row.status === 'on_leave' ? 'leave' : row.status === 'work_from_home' ? 'present' : row.status} size="sm" />
          <span className="capitalize text-xs font-semibold text-text">
            {row.status.replace(/_/g, ' ')}
          </span>
        </div>
      ),
    },
    {
      header: 'Check In',
      accessor: (row: any) => (
        <span className="font-mono text-xs text-text">
          {row.checkIn ? new Date(row.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
        </span>
      ),
    },
    {
      header: 'Check Out',
      accessor: (row: any) => (
        <span className="font-mono text-xs text-text">
          {row.checkOut ? new Date(row.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
        </span>
      ),
    },
    {
      header: 'Work Hours',
      accessor: (row: any) => {
        if (!row.checkIn || !row.checkOut) return <span className="text-text-muted">—</span>;
        const diffMs = new Date(row.checkOut).getTime() - new Date(row.checkIn).getTime();
        const hrs = (diffMs / 3_600_000).toFixed(2);
        return <span className="font-mono text-xs font-bold text-accent">{hrs} hrs</span>;
      },
    },
    {
      header: 'Note',
      accessor: (row: any) => <span className="text-xs text-text-muted italic">{row.note || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-8 font-sans">
      <PageHeader
        title="Attendance Management"
        description="Clock working hours, review work-from-home periods, and analyze company presence logs."
      />

      {/* Clocking Module (Shown at top for all users for their own logging convenience) */}
      <Card title="Time Clock" subtitle="Log your check-in or check-out times for today.">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-2">
          <div className="flex items-center gap-4">
            <Clock className="h-7 w-7 text-accent" />
            <div>
              <p className="text-sm font-semibold text-text">
                Your current clocking status:{' '}
                <span className="capitalize font-bold text-accent">
                  {loadingToday ? 'Checking...' : personalToday?.status === 'on_leave' ? 'On Leave' : personalToday?.status || 'absent'}
                </span>
              </p>
              {personalToday?.checkIn && (
                <p className="text-xs text-text-muted mt-1 font-mono">
                  Checked-in at:{' '}
                  {new Date(personalToday.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={handleCheckIn}
              disabled={clockLoading || loadingToday || !!personalToday?.checkIn}
              className="flex-1 md:flex-initial px-5 py-2.5 bg-status-present text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              Check In
            </button>
            <button
              onClick={handleCheckOut}
              disabled={
                clockLoading ||
                loadingToday ||
                !personalToday?.checkIn ||
                !!personalToday?.checkOut
              }
              className="flex-1 md:flex-initial px-5 py-2.5 bg-status-absent text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              Check Out
            </button>
          </div>
        </div>

        {clockError && (
          <div className="p-3 bg-status-absent/15 text-status-absent border border-status-absent/30 rounded-lg text-xs font-semibold mt-4">
            {clockError}
          </div>
        )}
      </Card>

      {/* Summary chips for Employee */}
      {isStaff && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface border border-border p-5 rounded-xl flex justify-between items-center">
            <div>
              <span className="text-xs text-text-muted font-semibold block uppercase">Present Days</span>
              <span className="text-2xl font-bold font-mono text-status-present mt-1 block">
                {loading ? '—' : metrics.present}
              </span>
            </div>
            <div className="h-10 w-10 bg-status-present/10 rounded-full flex items-center justify-center text-status-present">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-surface border border-border p-5 rounded-xl flex justify-between items-center">
            <div>
              <span className="text-xs text-text-muted font-semibold block uppercase">Leaves Taken</span>
              <span className="text-2xl font-bold font-mono text-status-leave mt-1 block">
                {loading ? '—' : metrics.leaves}
              </span>
            </div>
            <div className="h-10 w-10 bg-status-leave/10 rounded-full flex items-center justify-center text-status-leave">
              <Calendar className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-surface border border-border p-5 rounded-xl flex justify-between items-center">
            <div>
              <span className="text-xs text-text-muted font-semibold block uppercase">Absent Days</span>
              <span className="text-2xl font-bold font-mono text-status-absent mt-1 block">
                {loading ? '—' : metrics.absent}
              </span>
            </div>
            <div className="h-10 w-10 bg-status-absent/10 rounded-full flex items-center justify-center text-status-absent">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
        </div>
      )}

      {/* Search filters for HR/Admin */}
      {!isStaff && (
        <Card title="Query Search Filters">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1">
                <Search className="h-3.5 w-3.5" /> Search Name
              </label>
              <input
                type="text"
                placeholder="Search employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Log list table */}
      <Card title="Attendance Logs">
        <DataTable
          columns={columns}
          data={filteredRecords}
          isLoading={loading}
          emptyMessage="No attendance recorded for this date criteria."
        />
      </Card>
    </div>
  );
}
