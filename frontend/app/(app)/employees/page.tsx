'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { PageHeader, Card, FormField, DataTable } from '../../components/Primitives';
import { useAuth } from '../../components/AuthContext';
import { apiRequest, ResponseError } from '../../utils/api';
import { Plus, Search, ShieldAlert, Key, Clipboard, Check } from 'lucide-react';

const employeeFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['hr', 'employee']),
  phone: z.string().optional(),
  departmentId: z.string().optional().or(z.literal('')),
  jobPositionId: z.string().optional().or(z.literal('')),
  managerId: z.string().optional().or(z.literal('')),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export default function EmployeesPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [creationResult, setCreationResult] = useState<{ loginId: string; pass: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Dynamic dropdown lists derived from loaded directory data
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [positions, setPositions] = useState<{ id: string; title: string }[]>([]);
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      role: 'employee',
      phone: '',
      departmentId: '',
      jobPositionId: '',
      managerId: '',
    },
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/employees?limit=200');
      const data = res.data || [];
      setEmployees(data);

      // Extract unique departments, job positions, and possible managers
      const uniqueDepts: Record<string, string> = {};
      const uniquePos: Record<string, string> = {};
      const potentialManagers: { id: string; name: string }[] = [];

      data.forEach((emp: any) => {
        if (emp.department) {
          uniqueDepts[emp.department.id] = emp.department.name;
        }
        if (emp.jobPosition) {
          uniquePos[emp.jobPosition.id] = emp.jobPosition.title;
        }
        // Managers can be admins, HRs, or manager role holders
        if (emp.role === 'admin' || emp.role === 'hr' || emp.jobPosition?.title?.toLowerCase().includes('manager')) {
          potentialManagers.push({
            id: emp.id,
            name: `${emp.firstName} ${emp.lastName} (${emp.jobPosition?.title || emp.role.toUpperCase()})`,
          });
        }
      });

      setDepartments(Object.entries(uniqueDepts).map(([id, name]) => ({ id, name })));
      setPositions(Object.entries(uniquePos).map(([id, title]) => ({ id, title })));
      setManagers(potentialManagers);
    } catch (e) {
      console.error('Failed to load employees list:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEmployees();
    }
  }, [user]);

  const handleCopyCredentials = () => {
    if (creationResult) {
      const text = `Login ID: ${creationResult.loginId}\nTemporary Password: ${creationResult.pass}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const onSubmit = async (values: EmployeeFormValues) => {
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const body = {
        ...values,
        departmentId: values.departmentId || undefined,
        jobPositionId: values.jobPositionId || undefined,
        managerId: values.managerId || undefined,
      };

      const res = await apiRequest('/auth/users', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      setCreationResult({
        loginId: res.user?.loginId || '',
        pass: res.generatedPassword || '',
      });

      // Reset form
      reset();
      // Reload lists
      fetchEmployees();
    } catch (err: any) {
      if (err instanceof ResponseError) {
        if (err.errorData.field) {
          setFieldErrors({ [err.errorData.field]: err.errorData.message });
        } else if (err.errorData.fields) {
          setFieldErrors(err.errorData.fields);
        } else {
          setFormError(err.errorData.message);
        }
      } else {
        setFormError('Failed to create user. Verify network availability.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setCreationResult(null);
    setFormError(null);
    setFieldErrors({});
  };

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const loginId = emp.loginId.toLowerCase();
    const email = emp.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || loginId.includes(query) || email.includes(query);
  });

  const columns = [
    {
      header: 'Employee Name',
      accessor: (row: any) => (
        <Link href={`/employees/${row.id}`} className="hover:text-accent font-semibold flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold">
            {row.firstName[0]}
            {row.lastName[0]}
          </div>
          <span>
            {row.firstName} {row.lastName}
          </span>
        </Link>
      ),
    },
    { header: 'Login ID', accessor: 'loginId', className: 'font-mono' },
    { header: 'Email Address', accessor: 'email' },
    { header: 'Department', accessor: (row: any) => row.department?.name || 'Unassigned' },
    { header: 'Job Title', accessor: (row: any) => row.jobPosition?.title || 'Team Member' },
    {
      header: 'Role',
      accessor: (row: any) => (
        <span className={`px-2 py-0.5 rounded text-xs font-bold capitalize ${
          row.role === 'admin' ? 'bg-accent/15 text-accent' :
          row.role === 'hr' ? 'bg-status-leave/15 text-status-leave' : 'bg-status-neutral/15 text-status-neutral'
        }`}>
          {row.role}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: any) => (
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
          row.isActive ? 'bg-status-present/15 text-status-present' : 'bg-status-absent/15 text-status-absent'
        }`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Employee Directory"
          description="Manage profiles, track roles, and register new company personnel."
        />

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search directory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
          </div>

          {/* Add Employee Button (HR/Admin only) */}
          {user?.role !== 'employee' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent text-background font-semibold rounded-lg hover:opacity-90 transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </button>
          )}
        </div>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={filteredEmployees}
          isLoading={loading}
          emptyMessage="No employees found matching the search criteria."
        />
      </Card>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-xl font-semibold text-text font-display">Add New Employee</h3>
              <button
                onClick={handleCloseModal}
                className="text-text-muted hover:text-text text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <div className="p-6 flex-1">
              {creationResult ? (
                /* Success screen with credentials copy option */
                <div className="space-y-6">
                  <div className="p-4 bg-status-present/10 border border-status-present/30 rounded-lg flex items-start gap-3">
                    <Check className="h-5 w-5 text-status-present shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-status-present text-sm">Account Seeded Successfully</h4>
                      <p className="text-xs text-text-muted mt-1">
                        The employee has been registered. Below are their login credentials. Share these details securely.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 bg-background border border-border rounded-lg space-y-4 font-mono text-sm relative">
                    <div className="flex justify-between items-center text-xs text-text-muted border-b border-border/60 pb-2">
                      <span className="flex items-center gap-1.5">
                        <Key className="h-3.5 w-3.5" /> Credentials Token
                      </span>
                      <button
                        onClick={handleCopyCredentials}
                        className="text-accent hover:underline flex items-center gap-1 font-sans font-semibold"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3 w-3" /> Copied!
                          </>
                        ) : (
                          <>
                            <Clipboard className="h-3 w-3" /> Copy
                          </>
                        )}
                      </button>
                    </div>

                    <div className="space-y-2">
                      <p className="flex justify-between">
                        <span className="text-text-muted">LOGIN ID:</span>
                        <span className="text-text font-bold select-all">{creationResult.loginId}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-text-muted">TEMPORARY PASSWORD:</span>
                        <span className="text-accent font-bold select-all">{creationResult.pass}</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-status-leave/10 border border-status-leave/30 rounded-lg flex items-center gap-2 text-xs text-status-leave font-semibold leading-relaxed">
                    <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                    WARNING: This password is shown ONLY ONCE. Do not navigate away before copying it.
                  </div>

                  <button
                    onClick={handleCloseModal}
                    className="w-full py-2.5 bg-accent text-background font-semibold rounded-lg hover:opacity-90 transition-all text-center"
                  >
                    Done
                  </button>
                </div>
              ) : (
                /* Form layout */
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {formError && (
                    <div className="p-3.5 bg-status-absent/10 border border-status-absent/30 rounded-lg text-sm text-status-absent font-semibold">
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="First Name"
                      placeholder="e.g. Sujit"
                      error={errors.firstName?.message || fieldErrors.firstName}
                      required
                      {...register('firstName')}
                    />
                    <FormField
                      label="Last Name"
                      placeholder="e.g. Kumar"
                      error={errors.lastName?.message || fieldErrors.lastName}
                      required
                      {...register('lastName')}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Email Address"
                      type="email"
                      placeholder="e.g. sujit@acme.com"
                      error={errors.email?.message || fieldErrors.email}
                      required
                      {...register('email')}
                    />
                    <FormField
                      label="Phone Number"
                      placeholder="e.g. +91 9876543210"
                      error={errors.phone?.message || fieldErrors.phone}
                      {...register('phone')}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Role selector (HR can only create Employee) */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-text uppercase tracking-wider">
                        Workspace Role <span className="text-status-absent">*</span>
                      </label>
                      <select
                        {...register('role')}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                      >
                        <option value="employee">Employee</option>
                        {user?.role === 'admin' && <option value="hr">HR Specialist</option>}
                      </select>
                      {errors.role && (
                        <span className="text-xs text-status-absent font-semibold mt-0.5">{errors.role.message}</span>
                      )}
                    </div>

                    {/* Manager selector */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-text uppercase tracking-wider">
                        Reporting Manager
                      </label>
                      <select
                        {...register('managerId')}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                      >
                        <option value="">Select Manager...</option>
                        {managers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Department selector */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-text uppercase tracking-wider">
                        Department
                      </label>
                      <select
                        {...register('departmentId')}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                      >
                        <option value="">Select Department...</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Job Position selector */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-text uppercase tracking-wider">
                        Job Position
                      </label>
                      <select
                        {...register('jobPositionId')}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                      >
                        <option value="">Select Job Position...</option>
                        {positions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-border mt-6">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 py-2.5 bg-background border border-border text-text font-semibold rounded-lg hover:bg-surface active:scale-[0.98] transition-all text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 bg-accent text-background font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Registering...' : 'Register Employee'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
