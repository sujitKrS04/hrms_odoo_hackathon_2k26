'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '../../components/AuthContext';
import { PageHeader, Card } from '../../components/Primitives';
import { StatusDot } from '../../components/StatusDot';
import { apiRequest, ResponseError } from '../../utils/api';
import {
  CalendarCheck,
  CalendarDays,
  User as UserIcon,
  Search,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

function EmployeeLiveCard({ employee }: { employee: any }) {
  const [statusInfo, setStatusInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const data = await apiRequest(`/employees/${employee.id}/status`);
        setStatusInfo(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, [employee.id]);

  return (
    <motion.div variants={itemVariants} className="h-full">
      <Link href={`/employees/${employee.id}`} className="block h-full">
        <div className="bg-surface border border-border rounded-xl p-5 relative hover:shadow-md transition-all duration-200 cursor-pointer flex gap-4 items-center h-full">
          {/* Status Dot Top Right */}
          <div className="absolute top-4 right-4">
            {loading ? (
              <span className="h-2.5 w-2.5 rounded-full bg-border animate-pulse block" />
            ) : (
              <StatusDot status={statusInfo?.status || 'neutral'} size="sm" />
            )}
          </div>

          {/* Initials Avatar */}
          <div className="h-11 w-11 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center text-accent font-semibold text-base font-display">
            {employee.firstName[0]}
            {employee.lastName[0]}
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-text truncate">
              {employee.firstName} {employee.lastName}
            </h4>
            <p className="text-xs text-text-muted truncate mt-0.5">
              {employee.jobPosition?.title || 'Team Member'}
            </p>
            <p className="text-[10px] text-text-muted/80 font-mono mt-1 uppercase tracking-wider">
              {employee.department?.name || 'No Dept'}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [personalStatus, setPersonalStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isStaff = user?.role === 'employee';

  // Fetch employees list (HR/Admin only)
  useEffect(() => {
    if (isStaff) return;

    async function fetchEmployees() {
      try {
        setLoadingEmployees(true);
        const res = await apiRequest('/employees?limit=100');
        setEmployees(res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingEmployees(false);
      }
    }
    fetchEmployees();
  }, [isStaff]);

  // Fetch personal status (for employee dashboard check-in/out context)
  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    async function fetchPersonalStatus() {
      try {
        setLoadingStatus(true);
        const status = await apiRequest(`/employees/${userId}/status`);
        setPersonalStatus(status);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingStatus(false);
      }
    }
    fetchPersonalStatus();
  }, [user]);

  const handleCheckIn = async () => {
    setActionError(null);
    setActionLoading(true);
    try {
      const res = await apiRequest('/attendance/check-in', { method: 'POST' });
      // Optimistic status dot update
      setPersonalStatus({
        status: 'present',
        checkIn: res.record?.checkIn || new Date().toISOString(),
        checkOut: null,
        note: null,
      });
    } catch (err: any) {
      if (err instanceof ResponseError) {
        setActionError(err.errorData.message);
      } else {
        setActionError('Failed to check in.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionError(null);
    setActionLoading(true);
    try {
      const res = await apiRequest('/attendance/check-out', { method: 'POST' });
      setPersonalStatus({
        status: 'present',
        checkIn: personalStatus?.checkIn,
        checkOut: res.record?.checkOut || new Date().toISOString(),
        note: null,
      });
    } catch (err: any) {
      if (err instanceof ResponseError) {
        setActionError(err.errorData.message);
      } else {
        setActionError('Failed to check out.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const loginMatch = emp.loginId.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || loginMatch.includes(query);
  });

  if (isStaff) {
    // -------------------------------------------------------------
    // EMPLOYEE ROLE DASHBOARD
    // -------------------------------------------------------------
    return (
      <div className="space-y-8 font-sans">
        <PageHeader
          title={`Hello, ${user?.firstName}`}
          description="Welcome back to your workspace. Here is your status for today."
        />

        {/* Action errors alert */}
        {actionError && (
          <div className="p-3 bg-status-absent/15 text-status-absent border border-status-absent/30 rounded-lg text-sm font-semibold">
            {actionError}
          </div>
        )}

        {/* Large Personal Status Card */}
        <Card title="Today's Time Clock" subtitle="Check-in or check-out to align your working hours.">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4">
            <div className="flex items-center gap-4">
              {loadingStatus ? (
                <div className="h-10 w-10 rounded-full bg-border animate-pulse" />
              ) : (
                <StatusDot status={personalStatus?.status || 'absent'} size="lg" />
              )}
              <div>
                <p className="text-sm font-semibold text-text">
                  Status:{' '}
                  <span className="capitalize font-bold text-accent">
                    {loadingStatus ? 'Loading...' : personalStatus?.status === 'on_leave' ? 'On Leave' : personalStatus?.status}
                  </span>
                </p>
                {personalStatus?.checkIn && (
                  <p className="text-xs text-text-muted mt-1 font-mono">
                    Check-in: {new Date(personalStatus.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
                {personalStatus?.checkOut && (
                  <p className="text-xs text-text-muted mt-0.5 font-mono">
                    Check-out: {new Date(personalStatus.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>

            {/* Attendance Buttons */}
            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={handleCheckIn}
                disabled={actionLoading || loadingStatus || !!personalStatus?.checkIn}
                className="flex-1 md:flex-initial px-5 py-2.5 bg-status-present text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4.5 w-4.5" />
                Check In
              </button>
              <button
                onClick={handleCheckOut}
                disabled={
                  actionLoading ||
                  loadingStatus ||
                  !personalStatus?.checkIn ||
                  !!personalStatus?.checkOut
                }
                className="flex-1 md:flex-initial px-5 py-2.5 bg-status-absent text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <XCircle className="h-4.5 w-4.5" />
                Check Out
              </button>
            </div>
          </div>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/attendance">
            <div className="bg-surface border border-border p-6 rounded-xl hover:shadow-md hover:border-accent/40 transition-all duration-200 cursor-pointer space-y-4">
              <div className="h-10 w-10 rounded-lg bg-status-present/10 flex items-center justify-center text-status-present">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-text">Attendance Log</h4>
                <p className="text-xs text-text-muted mt-1">Review check-in history and working hours details.</p>
              </div>
            </div>
          </Link>

          <Link href="/leaves">
            <div className="bg-surface border border-border p-6 rounded-xl hover:shadow-md hover:border-accent/40 transition-all duration-200 cursor-pointer space-y-4">
              <div className="h-10 w-10 rounded-lg bg-status-leave/10 flex items-center justify-center text-status-leave">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-text">Time Off</h4>
                <p className="text-xs text-text-muted mt-1">Apply for leave, verify allocations, and status tracking.</p>
              </div>
            </div>
          </Link>

          <Link href={`/employees/${user?.id}`}>
            <div className="bg-surface border border-border p-6 rounded-xl hover:shadow-md hover:border-accent/40 transition-all duration-200 cursor-pointer space-y-4">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-text">My Profile</h4>
                <p className="text-xs text-text-muted mt-1">View qualifications, skills, banking info, and salary breakdown.</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ADMIN & HR ROLE DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Team Directory"
          description="Monitor active team members, view departments, and inspect live attendance statuses."
        />

        {/* Search bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name or Login ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          />
        </div>
      </div>

      {loadingEmployees ? (
        // Skeleton grid loader
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-5 flex gap-4 items-center animate-pulse">
              <div className="h-11 w-11 rounded-full bg-border" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-border rounded w-3/4" />
                <div className="h-3 bg-border rounded w-1/2" />
                <div className="h-2 bg-border rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEmployees.length === 0 ? (
        // Empty state
        <div className="bg-surface border border-border rounded-xl p-12 text-center text-text-muted max-w-md mx-auto">
          <Search className="h-8 w-8 text-text-muted/60 mx-auto mb-3" />
          <p className="font-semibold text-text">No employees found</p>
          <p className="text-xs mt-1">Try adjusting your search criteria or add a new team member.</p>
        </div>
      ) : (
        // Animated card directory
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredEmployees.map((emp) => (
            <EmployeeLiveCard key={emp.id} employee={emp} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
