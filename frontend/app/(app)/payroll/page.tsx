'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../components/AuthContext';
import { PageHeader, Card, FormField } from '../../components/Primitives';
import { apiRequest, ResponseError } from '../../utils/api';
import {
  CreditCard,
  DollarSign,
  ChevronRight,
  ShieldAlert,
  Calendar,
  Check,
  Search,
  FileText
} from 'lucide-react';

export default function PayrollPage() {
  const { user: currentUser } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Employee Details
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [payroll, setPayroll] = useState<any>(null);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [payrollError, setPayrollError] = useState<string | null>(null);

  // Edit State
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);

  // Formula States
  const [salaryForm, setSalaryForm] = useState({
    ctc: 0,
    effectiveFrom: '',
    basicPct: 40,
    hraPct: 40,
    conveyanceFixed: 1600,
    medicalFixed: 1250,
    pfPct: 12,
    professionalTax: 200,
    incomeTax: 0,
  });

  const isStaff = currentUser?.role === 'employee';

  const fetchEmployeesList = async () => {
    try {
      setLoadingList(true);
      const res = await apiRequest('/employees?limit=200');
      setEmployees(res.data || []);
    } catch (e) {
      console.error('Failed to load employee list for payroll:', e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchEmployeesList();
    }
  }, [currentUser]);

  const handleSelectEmployee = async (emp: any) => {
    setSelectedEmp(emp);
    setEditMode(false);
    setPayroll(null);
    setPayrollError(null);
    setLoadingPayroll(true);

    try {
      const data = await apiRequest(`/payroll/${emp.id}`);
      setPayroll(data);

      setSalaryForm({
        ctc: data.annualCTC || 0,
        effectiveFrom: data.structure?.effectiveFrom
          ? new Date(data.structure.effectiveFrom).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        basicPct: 40,
        hraPct: 40,
        conveyanceFixed: 1600,
        medicalFixed: 1250,
        pfPct: 12,
        professionalTax: 200,
        incomeTax: data.components?.find((c: any) => c.name === 'income_tax')?.amount
          ? Number(data.components.find((c: any) => c.name === 'income_tax').amount)
          : 0,
      });
    } catch (err: any) {
      if (err instanceof ResponseError) {
        setPayrollError(err.errorData.message);
      } else {
        setPayrollError('No salary structure found or fail to load.');
      }
    } finally {
      setLoadingPayroll(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    setSaving(true);

    try {
      const res = await apiRequest(`/payroll/${selectedEmp.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ctc: Number(salaryForm.ctc),
          effectiveFrom: salaryForm.effectiveFrom,
          basicPct: Number(salaryForm.basicPct),
          hraPct: Number(salaryForm.hraPct),
          conveyanceFixed: Number(salaryForm.conveyanceFixed),
          medicalFixed: Number(salaryForm.medicalFixed),
          pfPct: Number(salaryForm.pfPct),
          professionalTax: Number(salaryForm.professionalTax),
          incomeTax: Number(salaryForm.incomeTax),
        }),
      });

      setPayroll(res);
      setEditMode(false);
      setSavedSuccessMsg(true);
      setTimeout(() => setSavedSuccessMsg(false), 3000);

      // Refresh directory values
      fetchEmployeesList();
    } catch (err: any) {
      alert(err instanceof ResponseError ? err.errorData.message : 'Failed to save salary structure.');
    } finally {
      setSaving(false);
    }
  };

  const canEditSelected =
    currentUser?.role === 'admin' ||
    (currentUser?.role === 'hr' && selectedEmp?.role === 'employee');

  // Preview Formulas (Indian Payroll Standards)
  const previewGross = +(salaryForm.ctc / 12).toFixed(2);
  const previewBasic = +(previewGross * salaryForm.basicPct / 100).toFixed(2);
  const previewHra = +(previewBasic * salaryForm.hraPct / 100).toFixed(2);
  const previewSpecial = +(
    previewGross -
    previewBasic -
    previewHra -
    salaryForm.conveyanceFixed -
    salaryForm.medicalFixed
  ).toFixed(2);
  const previewPf = +(previewBasic * salaryForm.pfPct / 100).toFixed(2);
  const previewNet = +(
    previewGross -
    previewPf -
    salaryForm.professionalTax -
    salaryForm.incomeTax
  ).toFixed(2);

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const login = emp.loginId.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || login.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-8 font-sans">
      <PageHeader
        title="Compensation Portal"
        description="Configure employee salary structures, calculate component allowances, and audit monthly take-home values."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: List of Employees */}
        <div className="lg:col-span-5 space-y-4">
          <Card title="Workspace Directory">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Filter by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:border-accent"
              />
            </div>

            {loadingList ? (
              <div className="space-y-3 animate-pulse py-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 bg-border/40 rounded w-full"></div>
                ))}
              </div>
            ) : filteredEmployees.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-6">No employees found.</p>
            ) : (
              <div className="divide-y divide-border/40 max-h-[60vh] overflow-y-auto pr-1">
                {filteredEmployees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => handleSelectEmployee(emp)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-lg text-left transition-colors ${
                      selectedEmp?.id === emp.id
                        ? 'bg-accent/10 border-l-4 border-accent'
                        : 'hover:bg-background/40 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-text truncate">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">{emp.jobPosition?.title || 'Team Member'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-text-muted" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: Details & Edit Screen */}
        <div className="lg:col-span-7">
          {!selectedEmp ? (
            <div className="bg-surface border border-border border-dashed rounded-xl p-12 text-center text-text-muted font-sans">
              <CreditCard className="h-10 w-10 text-text-muted/60 mx-auto mb-4" />
              <p className="font-semibold text-text">Select an employee</p>
              <p className="text-xs mt-1">Select an employee from the workspace directory to manage salary structures.</p>
            </div>
          ) : loadingPayroll ? (
            <div className="bg-surface border border-border rounded-xl p-8 flex flex-col items-center justify-center h-80">
              <svg className="animate-spin h-7 w-7 text-accent mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-xs text-text-muted">Loading salary records...</span>
            </div>
          ) : payrollError ? (
            /* Selected user has no structure */
            <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <h4 className="font-semibold text-text font-display">
                  Payroll: {selectedEmp.firstName} {selectedEmp.lastName}
                </h4>
              </div>
              <div className="text-center py-6 text-text-muted">
                <p className="font-medium text-text">No Salary Structure Registered</p>
                <p className="text-xs mt-1">This user doesn't have an active salary structure assigned yet.</p>
                {canEditSelected && (
                  <button
                    onClick={() => {
                      setPayrollError(null);
                      setEditMode(true);
                      setSalaryForm({
                        ctc: 600000,
                        effectiveFrom: new Date().toISOString().split('T')[0],
                        basicPct: 40,
                        hraPct: 40,
                        conveyanceFixed: 1600,
                        medicalFixed: 1250,
                        pfPct: 12,
                        professionalTax: 200,
                        incomeTax: 0,
                      });
                    }}
                    className="mt-4 px-4 py-2 bg-accent text-background rounded-lg text-xs font-semibold hover:opacity-90"
                  >
                    Configure Initial Structure
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Active Salary Record view/edit panel */
            <div className="space-y-6">
              {editMode ? (
                /* FORM EDITOR */
                <form onSubmit={handleFormSubmit} className="bg-surface border border-border rounded-xl p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-border pb-4">
                    <div>
                      <h4 className="font-semibold text-text font-display">Configure Salary structure</h4>
                      <p className="text-xs text-text-muted mt-0.5">
                        {selectedEmp.firstName} {selectedEmp.lastName} ({selectedEmp.loginId})
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="px-3.5 py-1.5 border border-border hover:bg-background rounded-lg font-semibold text-xs transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-3.5 py-1.5 bg-accent text-background rounded-lg font-semibold text-xs transition-all disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Structure'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Inputs panel */}
                    <div className="space-y-4">
                      <FormField
                        label="Annual CTC (INR)"
                        type="number"
                        required
                        value={salaryForm.ctc}
                        onChange={(e) => setSalaryForm({ ...salaryForm, ctc: Number(e.target.value) })}
                      />
                      <FormField
                        label="Effective From"
                        type="date"
                        required
                        value={salaryForm.effectiveFrom}
                        onChange={(e) => setSalaryForm({ ...salaryForm, effectiveFrom: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          label="Basic % of Gross"
                          type="number"
                          value={salaryForm.basicPct}
                          onChange={(e) => setSalaryForm({ ...salaryForm, basicPct: Number(e.target.value) })}
                        />
                        <FormField
                          label="HRA % of Basic"
                          type="number"
                          value={salaryForm.hraPct}
                          onChange={(e) => setSalaryForm({ ...salaryForm, hraPct: Number(e.target.value) })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          label="Monthly Conveyance"
                          type="number"
                          value={salaryForm.conveyanceFixed}
                          onChange={(e) => setSalaryForm({ ...salaryForm, conveyanceFixed: Number(e.target.value) })}
                        />
                        <FormField
                          label="Monthly Medical"
                          type="number"
                          value={salaryForm.medicalFixed}
                          onChange={(e) => setSalaryForm({ ...salaryForm, medicalFixed: Number(e.target.value) })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          label="PF %"
                          type="number"
                          value={salaryForm.pfPct}
                          onChange={(e) => setSalaryForm({ ...salaryForm, pfPct: Number(e.target.value) })}
                        />
                        <FormField
                          label="Prof. Tax (PT)"
                          type="number"
                          value={salaryForm.professionalTax}
                          onChange={(e) => setSalaryForm({ ...salaryForm, professionalTax: Number(e.target.value) })}
                        />
                      </div>
                      <FormField
                        label="TDS Income Tax"
                        type="number"
                        value={salaryForm.incomeTax}
                        onChange={(e) => setSalaryForm({ ...salaryForm, incomeTax: Number(e.target.value) })}
                      />
                    </div>

                    {/* Dynamic preview sidepanel */}
                    <div className="bg-background border border-border p-4 rounded-lg space-y-4">
                      <h5 className="font-semibold text-xs text-text-muted uppercase tracking-wider">Formula Preview</h5>
                      <div className="space-y-3 font-sans text-xs">
                        <div className="flex justify-between border-b border-border pb-2">
                          <span className="font-semibold">Gross Wage:</span>
                          <span className="font-mono text-accent font-bold">₹{previewGross.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-border pb-2">
                          <span className="font-semibold">Basic pay:</span>
                          <span className="font-mono">₹{previewBasic.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-border pb-2">
                          <span className="font-semibold">HRA:</span>
                          <span className="font-mono">₹{previewHra.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-border pb-2">
                          <span className="font-semibold">Special Allowance:</span>
                          <span className="font-mono">₹{previewSpecial.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-border pb-2">
                          <span className="font-semibold">PF Deduction:</span>
                          <span className="font-mono text-status-absent">₹{previewPf.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-sm text-status-present pt-2">
                          <span>Net Take-home:</span>
                          <span className="font-mono">₹{previewNet.toLocaleString()}</span>
                        </div>
                      </div>
                      {previewSpecial < 0 && (
                        <div className="p-2.5 bg-status-absent/15 text-status-absent text-[10px] rounded border border-status-absent/30 leading-normal flex items-start gap-1.5">
                          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                          Special allowance is negative. Please adjust formula percentages or fixed sums.
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              ) : (
                /* READ ONLY DISPLAY CARD */
                <Card
                  title={`Payroll structure: ${selectedEmp.firstName} ${selectedEmp.lastName}`}
                  subtitle={`Login: ${selectedEmp.loginId}`}
                  action={
                    canEditSelected ? (
                      <div className="flex items-center gap-2">
                        {savedSuccessMsg && (
                          <span className="text-xs text-status-present font-semibold flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" /> Saved!
                          </span>
                        )}
                        <button
                          onClick={() => setEditMode(true)}
                          className="px-3 py-1.5 border border-border bg-surface hover:bg-background rounded-lg font-semibold text-xs transition-all shadow-sm"
                        >
                          Edit Payroll
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-status-absent font-semibold flex items-center gap-1">
                        <ShieldAlert className="h-3.5 w-3.5" /> View Only
                      </span>
                    )
                  }
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left stats */}
                    <div className="md:col-span-1 space-y-4 bg-background p-4 border border-border rounded-lg">
                      <div>
                        <span className="text-[10px] text-text-muted font-semibold uppercase block">Annual CTC</span>
                        <span className="text-lg font-mono font-bold text-accent">
                          ₹{(payroll.annualCTC || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="h-px bg-border/60" />
                      <div>
                        <span className="text-[10px] text-text-muted font-semibold uppercase block">Monthly Gross</span>
                        <span className="text-base font-mono font-bold text-text">
                          ₹{(payroll.monthlyGross || 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-muted font-semibold uppercase block">Net Take-Home Pay</span>
                        <span className="text-base font-mono font-bold text-status-present">
                          ₹{(payroll.monthlyNet || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Right breakdown */}
                    <div className="md:col-span-2">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-border text-text-muted font-bold">
                              <th className="py-2">Component</th>
                              <th className="py-2">Category</th>
                              <th className="py-2 text-right">Monthly amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/30 font-mono text-[11px]">
                            {payroll.components?.map((comp: any) => (
                              <tr key={comp.id} className="hover:bg-background/25">
                                <td className="py-2.5 capitalize text-text font-sans font-medium">
                                  {comp.name.replace(/_/g, ' ')}
                                </td>
                                <td className="py-2.5 capitalize">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    comp.type === 'earning' ? 'bg-status-present/10 text-status-present' : 'bg-status-absent/10 text-status-absent'
                                  }`}>
                                    {comp.type}
                                  </span>
                                </td>
                                <td className="py-2.5 text-right font-bold text-text">
                                  ₹{Number(comp.amount).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {payroll.structure?.effectiveFrom && (
                    <p className="text-[9px] text-text-muted mt-6 text-right font-mono">
                      Structure active since: {new Date(payroll.structure.effectiveFrom).toLocaleDateString()}
                    </p>
                  )}
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
