'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface RoleSignUpConfig {
  role: 'hr' | 'employee';
  label: string;
  color: string;
  icon: React.ReactNode;
  dashboardPath: string;
}

interface RoleSignUpProps {
  config: RoleSignUpConfig;
}

interface FormData {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  yearOfJoining: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  [key: string]: string;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

export function RoleSignUp({ config }: RoleSignUpProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    yearOfJoining: CURRENT_YEAR.toString(),
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required.';
    else if (formData.companyName.trim().length < 2) newErrors.companyName = 'Company name must be at least 2 characters.';

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required.';

    if (!formData.email.trim()) newErrors.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email address.';

    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required.';
    else if (!/^\+?[\d\s\-().]{7,}$/.test(formData.phone)) newErrors.phone = 'Please enter a valid phone number.';

    if (!formData.yearOfJoining) newErrors.yearOfJoining = 'Year of joining is required.';

    if (!formData.password) newErrors.password = 'Password is required.';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
    else if (!/[0-9]/.test(formData.password)) newErrors.password = 'Password must contain at least one number.';

    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password.';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!validate()) {
      triggerShake();
      return;
    }

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));

    // Save session and redirect
    localStorage.setItem('auth_token', `${config.role}-token-${Date.now()}`);
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        id: `${config.role}-${Date.now()}`,
        loginId: formData.email,
        email: formData.email,
        role: config.role,
        firstName: formData.firstName,
        lastName: formData.lastName,
        companyId: formData.companyName.toLowerCase().replace(/\s+/g, '-'),
      })
    );

    setIsLoading(false);
    router.push(config.dashboardPath);
  };

  const inputCls = (field: string) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm text-text bg-background placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
      errors[field] ? 'border-status-absent' : 'border-border'
    }`;

  return (
    <div className="min-h-screen flex font-sans bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex w-[38%] bg-surface border-r border-border flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-80 h-80 rounded-full opacity-5 blur-3xl" style={{ background: config.color, transform: 'translate(-40%, -40%)' }} />
          <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-5 blur-3xl" style={{ background: config.color, transform: 'translate(40%, 40%)' }} />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center text-background font-bold text-xl font-display shadow-sm">
            H
          </div>
          <span className="text-lg font-display font-semibold text-text tracking-tight">HRMS Core</span>
        </div>

        <div className="relative z-10 space-y-5">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${config.color}15` }}>
            <div style={{ color: config.color }}>{config.icon}</div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-display font-semibold text-text tracking-tight">
              {config.label} Sign Up
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">
              Create your {config.label.toLowerCase()} account and join your company workspace.
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              'Manage your profile & team',
              'Access leave & attendance tracking',
              'View payroll & payslips',
              config.role === 'hr' ? 'Onboard and manage employees' : 'Submit requests & view reports',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-text-muted">
                <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke={config.color} strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-text-muted">Every workday, perfectly aligned.</div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 overflow-y-auto">
        <div className="w-full max-w-lg space-y-7 py-8">
          {/* Back */}
          <Link href={`/${config.role}/signin`} className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to sign in
          </Link>

          {/* Header */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold mb-3" style={{ backgroundColor: `${config.color}15`, color: config.color }}>
              <span className="h-1.5 w-1.5 rounded-full animate-pulseDot inline-block" style={{ backgroundColor: config.color }} />
              {config.label} Registration
            </div>
            <h1 className="text-2xl font-display font-semibold text-text tracking-tight">Create Account</h1>
            <p className="text-sm text-text-muted">Fill in your details to register as {config.label}.</p>
          </div>

          {/* Global error */}
          {globalError && (
            <div className={`p-3.5 rounded-xl border text-sm font-medium flex items-start gap-2.5 ${shake ? 'animate-shake' : ''}`}
              style={{ backgroundColor: '#D65F5F12', borderColor: '#D65F5F40', color: '#D65F5F' }}>
              <svg className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Section: Company */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Company Information</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-1.5">
                <label htmlFor={`${config.role}-company-name`} className="block text-sm font-medium text-text">
                  Company Name <span className="text-status-absent">*</span>
                </label>
                <input
                  id={`${config.role}-company-name`}
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  className={inputCls('companyName')}
                />
                {errors.companyName && <p className="text-xs text-status-absent">{errors.companyName}</p>}
              </div>
            </div>

            {/* Section: Personal */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Personal Details</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor={`${config.role}-first-name`} className="block text-sm font-medium text-text">
                    First Name <span className="text-status-absent">*</span>
                  </label>
                  <input
                    id={`${config.role}-first-name`}
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    placeholder="John"
                    className={inputCls('firstName')}
                  />
                  {errors.firstName && <p className="text-xs text-status-absent">{errors.firstName}</p>}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor={`${config.role}-last-name`} className="block text-sm font-medium text-text">
                    Last Name <span className="text-status-absent">*</span>
                  </label>
                  <input
                    id={`${config.role}-last-name`}
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    placeholder="Doe"
                    className={inputCls('lastName')}
                  />
                  {errors.lastName && <p className="text-xs text-status-absent">{errors.lastName}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor={`${config.role}-signup-email`} className="block text-sm font-medium text-text">
                  Email Address <span className="text-status-absent">*</span>
                </label>
                <input
                  id={`${config.role}-signup-email`}
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="john.doe@company.com"
                  className={inputCls('email')}
                />
                {errors.email && <p className="text-xs text-status-absent">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor={`${config.role}-phone`} className="block text-sm font-medium text-text">
                    Phone <span className="text-status-absent">*</span>
                  </label>
                  <input
                    id={`${config.role}-phone`}
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+1 555-0100"
                    className={inputCls('phone')}
                  />
                  {errors.phone && <p className="text-xs text-status-absent">{errors.phone}</p>}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor={`${config.role}-year-of-joining`} className="block text-sm font-medium text-text">
                    Year of Joining <span className="text-status-absent">*</span>
                  </label>
                  <select
                    id={`${config.role}-year-of-joining`}
                    value={formData.yearOfJoining}
                    onChange={(e) => handleChange('yearOfJoining', e.target.value)}
                    className={inputCls('yearOfJoining') + ' cursor-pointer'}
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  {errors.yearOfJoining && <p className="text-xs text-status-absent">{errors.yearOfJoining}</p>}
                </div>
              </div>
            </div>

            {/* Section: Security */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Security</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor={`${config.role}-signup-password`} className="block text-sm font-medium text-text">
                    Password <span className="text-status-absent">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id={`${config.role}-signup-password`}
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="Min. 8 chars, 1 number"
                      className={inputCls('password') + ' pr-10'}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors" tabIndex={-1}>
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
                  {errors.password && <p className="text-xs text-status-absent">{errors.password}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor={`${config.role}-confirm-password`} className="block text-sm font-medium text-text">
                    Confirm Password <span className="text-status-absent">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id={`${config.role}-confirm-password`}
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      placeholder="Repeat password"
                      className={inputCls('confirmPassword') + ' pr-10'}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors" tabIndex={-1}>
                      {showConfirmPassword ? (
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
                  {errors.confirmPassword && <p className="text-xs text-status-absent">{errors.confirmPassword}</p>}
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              id={`${config.role}-signup-btn`}
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              style={{ backgroundColor: config.color, boxShadow: `0 4px 20px -4px ${config.color}40` }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Account...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                  Create {config.label} Account
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs text-text-muted border-t border-border/60 pt-4">
            Already have an account?{' '}
            <Link href={`/${config.role}/signin`} className="font-semibold hover:underline" style={{ color: config.color }}>
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
