'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusDot } from './components/StatusDot';

const STATIC_DOTS = [
  { id: 1, top: '8%', left: '12%', status: 'present' as const, opacity: 0.25 },
  { id: 2, top: '15%', left: '78%', status: 'leave' as const, opacity: 0.2 },
  { id: 3, top: '28%', left: '22%', status: 'absent' as const, opacity: 0.3 },
  { id: 4, top: '42%', left: '85%', status: 'present' as const, opacity: 0.18 },
  { id: 5, top: '65%', left: '18%', status: 'neutral' as const, opacity: 0.28 },
  { id: 6, top: '80%', left: '72%', status: 'leave' as const, opacity: 0.22 },
  { id: 7, top: '22%', left: '52%', status: 'present' as const, opacity: 0.35 },
  { id: 8, top: '55%', left: '40%', status: 'absent' as const, opacity: 0.25 },
  { id: 9, top: '88%', left: '30%', status: 'neutral' as const, opacity: 0.3 },
  { id: 10, top: '38%', left: '8%', status: 'present' as const, opacity: 0.22 },
  { id: 11, top: '72%', left: '60%', status: 'leave' as const, opacity: 0.28 },
  { id: 12, top: '18%', left: '92%', status: 'present' as const, opacity: 0.18 },
  { id: 13, top: '48%', left: '28%', status: 'neutral' as const, opacity: 0.32 },
  { id: 14, top: '60%', left: '90%', status: 'absent' as const, opacity: 0.22 },
  { id: 15, top: '92%', left: '55%', status: 'present' as const, opacity: 0.35 },
  { id: 16, top: '5%', left: '42%', status: 'leave' as const, opacity: 0.24 },
  { id: 17, top: '35%', left: '68%', status: 'present' as const, opacity: 0.3 },
  { id: 18, top: '78%', left: '95%', status: 'absent' as const, opacity: 0.26 },
];

const roles = [
  {
    id: 'admin',
    label: 'Admin',
    description: 'System administration & full platform control',
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 01.04 14.625a11.95 11.95 0 0110.22 7.323A11.96 11.96 0 0123.95 14.625a11.955 11.955 0 01-3.596-6A11.95 11.95 0 0012 2.964z" />
      </svg>
    ),
    href: '/admin/signin',
    color: '#6366f1',
    badge: 'Secure Access',
  },
  {
    id: 'hr',
    label: 'HR',
    description: 'Human resources management & team oversight',
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    href: '/hr/signin',
    color: '#E2A33D',
    badge: 'OTP Verified',
  },
  {
    id: 'employee',
    label: 'Employee',
    description: 'Access your workspace, leaves & payslips',
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    href: '/employee/signin',
    color: '#3FA66B',
    badge: 'OTP Verified',
  },
];

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Clear any stale auth on landing page visit
    // (Don't auto-redirect — let users pick their role)
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col font-sans">
      {/* Ambient background dots */}
      {mounted && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          {STATIC_DOTS.map((dot) => (
            <div
              key={dot.id}
              className="absolute"
              style={{ top: dot.top, left: dot.left, opacity: dot.opacity }}
            >
              <StatusDot status={dot.status} size="sm" />
            </div>
          ))}
        </div>
      )}

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(var(--border-rgb, 200,204,210), 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--border-rgb, 200,204,210), 0.07) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center text-background font-bold text-lg font-display shadow-sm">
            H
          </div>
          <span className="text-lg font-display font-semibold text-text tracking-tight">
            HRMS Core
          </span>
        </div>
        <span className="text-xs text-text-muted font-medium hidden sm:block">
          Every workday, perfectly aligned.
        </span>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* Hero */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-surface/60 backdrop-blur-sm text-xs text-text-muted font-medium mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-status-present inline-block animate-pulseDot" />
            Secure Role-Based Access
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-semibold text-text tracking-tight leading-tight">
            Welcome to{' '}
            <span style={{ color: 'var(--accent)' }}>HRMS Core</span>
          </h1>
          <p className="text-base md:text-lg text-text-muted max-w-md mx-auto leading-relaxed">
            Select your role to continue to the appropriate authentication portal.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
          {roles.map((role) => (
            <button
              key={role.id}
              id={`role-btn-${role.id}`}
              onClick={() => router.push(role.href)}
              onMouseEnter={() => setHoveredRole(role.id)}
              onMouseLeave={() => setHoveredRole(null)}
              className="group relative flex flex-col items-start p-7 bg-surface rounded-2xl border border-border/60 text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 overflow-hidden"
              style={
                hoveredRole === role.id
                  ? {
                      boxShadow: `0 20px 60px -10px ${role.color}30`,
                      borderColor: `${role.color}40`,
                    }
                  : {}
              }
            >
              {/* Glow blob on hover */}
              <div
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none"
                style={{ backgroundColor: role.color }}
              />

              {/* Icon */}
              <div
                className="mb-5 p-3 rounded-xl transition-colors duration-300"
                style={{
                  backgroundColor: `${role.color}15`,
                  color: role.color,
                }}
              >
                {role.icon}
              </div>

              {/* Badge */}
              <span
                className="text-[10px] font-bold uppercase tracking-widest mb-2 px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${role.color}15`, color: role.color }}
              >
                {role.badge}
              </span>

              {/* Label */}
              <h2 className="text-xl font-display font-semibold text-text mb-1.5">
                {role.label}
              </h2>

              {/* Description */}
              <p className="text-sm text-text-muted leading-relaxed mb-6">
                {role.description}
              </p>

              {/* CTA */}
              <div className="flex items-center gap-2 text-sm font-semibold mt-auto transition-colors duration-200" style={{ color: role.color }}>
                Continue
                <svg
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-12 text-xs text-text-muted/60 text-center">
          Protected by industry-standard encryption &bull; All sessions are audited
        </p>
      </main>
    </div>
  );
}
