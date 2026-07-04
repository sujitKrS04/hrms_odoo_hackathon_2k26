'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ADMIN_ID = 'admin@odoo2026';
const ADMIN_PASSWORD = 'adminodoo789';

export default function AdminSignInPage() {
  const router = useRouter();
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Simulate network delay for realism
    await new Promise((r) => setTimeout(r, 700));

    if (adminId === ADMIN_ID && password === ADMIN_PASSWORD) {
      // Store admin session
      localStorage.setItem('auth_token', 'admin-token-' + Date.now());
      localStorage.setItem(
        'auth_user',
        JSON.stringify({
          id: 'admin-001',
          loginId: ADMIN_ID,
          email: 'admin@odoo2026.system',
          role: 'admin',
          firstName: 'System',
          lastName: 'Admin',
          companyId: 'odoo2026',
        })
      );
      router.push('/dashboard');
    } else {
      triggerShake();
      setError('Invalid Admin ID or password. Please try again.');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex font-sans bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex w-[42%] bg-surface border-r border-border flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-80 h-80 rounded-full opacity-5" style={{ background: '#6366f1', filter: 'blur(80px)', transform: 'translate(-40%, -40%)' }} />
          <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-5" style={{ background: '#6366f1', filter: 'blur(80px)', transform: 'translate(40%, 40%)' }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center text-background font-bold text-xl font-display shadow-sm">
            H
          </div>
          <span className="text-lg font-display font-semibold text-text tracking-tight">HRMS Core</span>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#6366f115' }}>
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 01.04 14.625a11.95 11.95 0 0110.22 7.323A11.96 11.96 0 0123.95 14.625a11.955 11.955 0 01-3.596-6A11.95 11.95 0 0012 2.964z" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-display font-semibold text-text tracking-tight">
              Admin Portal
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">
              Exclusive access for system administrators. Full platform control with complete audit logging.
            </p>
          </div>

          <div className="space-y-3">
            {[
              'Full employee & HR management',
              'System configuration & settings',
              'Audit logs & security controls',
              'Company-wide reporting & analytics',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-text-muted">
                <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-text-muted">
          Every workday, perfectly aligned.
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to role selection
          </Link>

          {/* Header */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold mb-3" style={{ backgroundColor: '#6366f115', color: '#6366f1' }}>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Admin Access Only
            </div>
            <h1 className="text-2xl font-display font-semibold text-text tracking-tight">
              Administrator Sign In
            </h1>
            <p className="text-sm text-text-muted">
              Enter your administrator credentials to continue.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className={`p-3.5 rounded-xl border text-sm font-medium flex items-start gap-2.5 ${shake ? 'animate-shake' : ''}`}
              style={{ backgroundColor: '#D65F5F12', borderColor: '#D65F5F40', color: '#D65F5F' }}>
              <svg className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Admin ID */}
            <div className="space-y-1.5">
              <label htmlFor="admin-id" className="block text-sm font-medium text-text">
                Admin ID <span className="text-status-absent">*</span>
              </label>
              <input
                id="admin-id"
                type="text"
                autoComplete="username"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="Enter your admin ID"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-text text-sm placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': '#6366f160' } as React.CSSProperties}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="block text-sm font-medium text-text">
                Password <span className="text-status-absent">*</span>
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-border bg-background text-text text-sm placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ '--tw-ring-color': '#6366f160' } as React.CSSProperties}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="admin-signin-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: '#6366f1', boxShadow: '0 4px 20px -4px #6366f140' }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Authenticating...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Sign In as Admin
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-text-muted/60 pt-2">
            Authorized personnel only. All access is logged & monitored.
          </p>
        </div>
      </div>
    </div>
  );
}
