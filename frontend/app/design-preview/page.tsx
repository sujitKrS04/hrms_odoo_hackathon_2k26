'use client';

import React, { useState } from 'react';
import { PageHeader, Card, FormField, DataTable, Column } from '../components/Primitives';
import { StatusDot } from '../components/StatusDot';
import { useTheme } from '../components/ThemeProvider';
import { Sun, Moon, Monitor } from 'lucide-react';

export default function DesignPreview() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [formErrors, setFormErrors] = useState({ name: '', email: '' });

  const handleTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = { name: '', email: '' };
    if (!formData.name) errors.name = 'Name is required';
    if (!formData.email) errors.email = 'Email must be a valid email address';
    setFormErrors(errors);
  };

  const sampleColumns: Column<any>[] = [
    { header: 'Employee', accessor: (row: any) => <strong>{row.name}</strong> },
    { header: 'Status', accessor: (row: any) => <div className="flex items-center gap-2"><StatusDot status={row.status} size="sm" /> <span className="capitalize">{row.status}</span></div> },
    { header: 'Login ID', accessor: (row: any) => row.loginId, className: 'font-mono' },
    { header: 'Base pay', accessor: (row: any) => <span className="font-mono">{row.pay}</span> },
  ];

  const sampleData = [
    { id: '1', name: 'John Doe', status: 'present', loginId: 'COJD001', pay: '$5,000' },
    { id: '2', name: 'Jane Smith', status: 'leave', loginId: 'COJS002', pay: '$6,200' },
    { id: '3', name: 'Bob Johnson', status: 'absent', loginId: 'COBJ003', pay: '$4,800' },
    { id: '4', name: 'Alice Williams', status: 'neutral', loginId: 'COAW004', pay: '$5,500' },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12">
      {/* Header section with inline controls */}
      <div className="flex justify-between items-center border-b border-border pb-6">
        <div>
          <h1 className="text-4xl font-display font-semibold tracking-tight text-text">Design Token System Preview</h1>
          <p className="text-text-muted mt-1">Inspecting color palette, typography and component micro-animations</p>
        </div>

        {/* Local Theme Toggle control */}
        <div className="flex items-center gap-2 bg-surface p-1.5 border border-border rounded-lg shadow-sm">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-all duration-150 flex items-center gap-1.5 ${
                theme === t
                  ? 'bg-accent text-background shadow-sm'
                  : 'text-text-muted hover:text-text hover:bg-background'
              }`}
            >
              {t === 'light' && <Sun className="h-3.5 w-3.5" />}
              {t === 'dark' && <Moon className="h-3.5 w-3.5" />}
              {t === 'system' && <Monitor className="h-3.5 w-3.5" />}
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Typography Preview */}
      <section className="space-y-4">
        <h2 className="text-xl font-display font-medium text-text-muted border-b border-border pb-2">Typography & Alignment</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface p-6 border border-border rounded-xl">
            <span className="text-xs uppercase tracking-wider text-text-muted font-bold block mb-2">Display Font (Fraunces)</span>
            <p className="font-display text-2xl font-medium text-text">Every workday, perfectly aligned.</p>
          </div>
          <div className="bg-surface p-6 border border-border rounded-xl">
            <span className="text-xs uppercase tracking-wider text-text-muted font-bold block mb-2">UI Sans Font (Inter)</span>
            <p className="font-sans text-sm text-text leading-relaxed">
              We leverage clean lines, soft glassmorphism, responsive grids, and accessible color roles to maximize interface premium feeling.
            </p>
          </div>
          <div className="bg-surface p-6 border border-border rounded-xl">
            <span className="text-xs uppercase tracking-wider text-text-muted font-bold block mb-2">Data Font (IBM Plex Mono)</span>
            <p className="font-mono text-sm text-accent">
              COMP_ID: ACC_2026_0991<br />
              WAGE: $12,450.00 / mo<br />
              CHECK_IN: 09:12:44 AM
            </p>
          </div>
        </div>
      </section>

      {/* Status Dot Micro-animations */}
      <section className="space-y-4">
        <h2 className="text-xl font-display font-medium text-text-muted border-b border-border pb-2">Signature StatusDot Animation</h2>
        <div className="bg-surface p-6 border border-border rounded-xl flex flex-wrap gap-12 items-center">
          <div className="flex items-center gap-3">
            <StatusDot status="present" size="lg" />
            <div className="text-sm">
              <p className="font-semibold text-text">Present</p>
              <p className="text-xs text-text-muted">Color: #3FA66B</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusDot status="leave" size="lg" />
            <div className="text-sm">
              <p className="font-semibold text-text">On Leave</p>
              <p className="text-xs text-text-muted">Color: #E2A33D</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusDot status="absent" size="lg" />
            <div className="text-sm">
              <p className="font-semibold text-text">Absent</p>
              <p className="text-xs text-text-muted">Color: #D65F5F</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusDot status="neutral" size="lg" />
            <div className="text-sm">
              <p className="font-semibold text-text">Neutral / Out of Office</p>
              <p className="text-xs text-text-muted">Color: #8B929C</p>
            </div>
          </div>
        </div>
      </section>

      {/* Card & Form Inputs with Shake validation */}
      <section className="space-y-4">
        <h2 className="text-xl font-display font-medium text-text-muted border-b border-border pb-2">Forms and Action Containers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card title="Sample Form Component" subtitle="Enter credentials to test validation animations.">
            <form onSubmit={handleTestSubmit} className="space-y-4">
              <FormField
                label="Full name"
                placeholder="e.g. Sujit Kumar"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={formErrors.name}
                required
              />
              <FormField
                label="Email address"
                placeholder="e.g. sujit@hrms.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={formErrors.email}
                required
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-accent text-background font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Validate Form
              </button>
            </form>
          </Card>

          <Card title="Data table preview" subtitle="Employee details summary representation">
            <DataTable columns={sampleColumns} data={sampleData} />
          </Card>
        </div>
      </section>
    </div>
  );
}
