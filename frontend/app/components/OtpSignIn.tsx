'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface RoleAuthConfig {
  role: 'hr' | 'employee';
  label: string;
  color: string;
  icon: React.ReactNode;
  dashboardPath: string;
}

interface OtpSignInProps {
  config: RoleAuthConfig;
}

// Simulate OTP (in production this would be server-side)
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

type Step = 'credentials' | 'otp' | 'success';

export function OtpSignIn({ config }: OtpSignInProps) {
  const router = useRouter();

  // Form state
  const [loginId, setLoginId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP state
  const [step, setStep] = useState<Step>('credentials');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Error and loading
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const t = setTimeout(() => setOtpTimer((v) => v - 1), 1000);
      return () => clearTimeout(t);
    } else if (step === 'otp') {
      setCanResend(true);
    }
  }, [otpTimer, step]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginId.trim()) { setError('Login ID is required.'); triggerShake(); return; }
    if (!email.trim()) { setError('Email address is required.'); triggerShake(); return; }
    if (!password.trim()) { setError('Password is required.'); triggerShake(); return; }

    setIsLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));

    // In real app: validate credentials with backend, then backend sends OTP
    const newOtp = generateOTP();
    setGeneratedOtp(newOtp);

    // Show OTP in a toast-style notification (demo mode)
    console.log(`[DEMO] OTP for ${email}: ${newOtp}`);

    setIsLoading(false);
    setOtpTimer(60);
    setCanResend(false);
    setStep('otp');
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const enteredOtp = otp.join('');

    if (enteredOtp.length < 6) {
      setError('Please enter all 6 digits of the OTP.');
      triggerShake();
      return;
    }

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 700));

    if (enteredOtp === generatedOtp) {
      // Save auth session
      localStorage.setItem('auth_token', `${config.role}-token-${Date.now()}`);
      localStorage.setItem(
        'auth_user',
        JSON.stringify({
          id: `${config.role}-${Date.now()}`,
          loginId,
          email,
          role: config.role,
          firstName: loginId,
          lastName: '',
          companyId: 'demo-company',
        })
      );
      setStep('success');
      setTimeout(() => router.push(config.dashboardPath), 1200);
    } else {
      triggerShake();
      setError('Incorrect OTP. Please check the code sent to your email.');
    }

    setIsLoading(false);
  };

  const handleResendOtp = async () => {
    const newOtp = generateOTP();
    setGeneratedOtp(newOtp);
    console.log(`[DEMO] Resent OTP for ${email}: ${newOtp}`);
    setOtp(['', '', '', '', '', '']);
    setOtpTimer(60);
    setCanResend(false);
    otpRefs.current[0]?.focus();
  };

  return (
    <div className="min-h-screen flex font-sans bg-background">
      {/* Left decorative panel */}
      <div className="hidden lg:flex w-[42%] bg-surface border-r border-border flex-col justify-between p-12 relative overflow-hidden">
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

        <div className="relative z-10 space-y-6">
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${config.color}15` }}>
            <div style={{ color: config.color }}>{config.icon}</div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-display font-semibold text-text tracking-tight">
              {config.label} Portal
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">
              Secure OTP-verified authentication for {config.label.toLowerCase()} accounts.
            </p>
          </div>

          {/* Step indicator */}
          <div className="space-y-3">
            {[
              { step: 1, label: 'Enter credentials', done: step !== 'credentials' },
              { step: 2, label: 'Verify OTP from email', done: step === 'success' },
              { step: 3, label: 'Access dashboard', done: false },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={
                    s.done
                      ? { backgroundColor: config.color, color: '#fff' }
                      : step === 'credentials' && s.step === 1
                      ? { backgroundColor: `${config.color}20`, color: config.color, border: `2px solid ${config.color}` }
                      : step === 'otp' && s.step === 2
                      ? { backgroundColor: `${config.color}20`, color: config.color, border: `2px solid ${config.color}` }
                      : { backgroundColor: 'var(--border)', color: 'var(--text-muted)' }
                  }
                >
                  {s.done ? (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    s.step
                  )}
                </div>
                <span className="text-sm text-text-muted">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-text-muted">
          Every workday, perfectly aligned.
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Back */}
          {step === 'credentials' && (
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to role selection
            </Link>
          )}

          {step === 'otp' && (
            <button onClick={() => { setStep('credentials'); setError(null); setOtp(['','','','','','']); }}
              className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to credentials
            </button>
          )}

          {/* Success state */}
          {step === 'success' && (
            <div className="text-center space-y-4 py-8">
              <div className="h-16 w-16 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: `${config.color}15` }}>
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke={config.color} strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-xl font-display font-semibold text-text">Verified! Redirecting...</h2>
              <p className="text-sm text-text-muted">Your identity has been confirmed. Taking you to the dashboard.</p>
              <div className="flex justify-center">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24" style={{ color: config.color }}>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            </div>
          )}

          {/* Credentials step */}
          {step === 'credentials' && (
            <>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold mb-3" style={{ backgroundColor: `${config.color}15`, color: config.color }}>
                  <span className="h-1.5 w-1.5 rounded-full animate-pulseDot inline-block" style={{ backgroundColor: config.color }} />
                  {config.label} Authentication
                </div>
                <h1 className="text-2xl font-display font-semibold text-text tracking-tight">Sign In</h1>
                <p className="text-sm text-text-muted">Enter your credentials. An OTP will be sent to your email.</p>
              </div>

              {error && (
                <div className={`p-3.5 rounded-xl border text-sm font-medium flex items-start gap-2.5 ${shake ? 'animate-shake' : ''}`}
                  style={{ backgroundColor: '#D65F5F12', borderColor: '#D65F5F40', color: '#D65F5F' }}>
                  <svg className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleCredentialSubmit} className="space-y-5">
                {/* Login ID */}
                <div className="space-y-1.5">
                  <label htmlFor={`${config.role}-login-id`} className="block text-sm font-medium text-text">
                    Login ID <span className="text-status-absent">*</span>
                  </label>
                  <input
                    id={`${config.role}-login-id`}
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="Your assigned login ID"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-text text-sm placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor={`${config.role}-email`} className="block text-sm font-medium text-text">
                    Email Address <span className="text-status-absent">*</span>
                  </label>
                  <input
                    id={`${config.role}-email`}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-text text-sm placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label htmlFor={`${config.role}-password`} className="block text-sm font-medium text-text">
                    Password <span className="text-status-absent">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id={`${config.role}-password`}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 pr-11 rounded-xl border border-border bg-background text-text text-sm placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
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
                </div>

                <button
                  id={`${config.role}-send-otp-btn`}
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: config.color, boxShadow: `0 4px 20px -4px ${config.color}40` }}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      Send OTP to Email
                    </>
                  )}
                </button>
              </form>

              <div className="text-center text-xs text-text-muted pt-2 border-t border-border/60">
                Don&apos;t have an account?{' '}
                <Link href={`/${config.role}/signup`} className="font-semibold hover:underline" style={{ color: config.color }}>
                  Sign up here
                </Link>
              </div>
            </>
          )}

          {/* OTP step */}
          {step === 'otp' && (
            <>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold mb-3" style={{ backgroundColor: `${config.color}15`, color: config.color }}>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  OTP Verification
                </div>
                <h1 className="text-2xl font-display font-semibold text-text tracking-tight">Check your email</h1>
                <p className="text-sm text-text-muted">
                  We sent a 6-digit code to{' '}
                  <span className="font-semibold text-text">{email}</span>.
                  Enter it below to continue.
                </p>

                {/* Demo hint */}
                <div className="mt-3 p-3 rounded-lg border text-xs" style={{ backgroundColor: `${config.color}08`, borderColor: `${config.color}25`, color: config.color }}>
                  <span className="font-semibold">Demo mode:</span> Check your browser console for the OTP code (F12 → Console).
                </div>
              </div>

              {error && (
                <div className={`p-3.5 rounded-xl border text-sm font-medium flex items-start gap-2.5 ${shake ? 'animate-shake' : ''}`}
                  style={{ backgroundColor: '#D65F5F12', borderColor: '#D65F5F40', color: '#D65F5F' }}>
                  <svg className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleOtpVerify} className="space-y-6">
                {/* OTP Boxes */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text">6-Digit OTP</label>
                  <div className="flex gap-2.5 justify-between" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        id={`otp-digit-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="flex-1 h-14 text-center text-xl font-bold rounded-xl border bg-background text-text transition-all focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{
                          borderColor: digit ? config.color : 'var(--border)',
                          boxShadow: digit ? `0 0 0 1px ${config.color}40` : undefined,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Timer & Resend */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">
                    {!canResend ? (
                      <>Code expires in <span className="font-mono font-semibold text-text">0:{otpTimer.toString().padStart(2, '0')}</span></>
                    ) : (
                      "Code expired."
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!canResend}
                    className="font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ color: canResend ? config.color : undefined }}
                  >
                    Resend OTP
                  </button>
                </div>

                <button
                  id={`${config.role}-verify-otp-btn`}
                  type="submit"
                  disabled={isLoading || otp.join('').length < 6}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: config.color, boxShadow: `0 4px 20px -4px ${config.color}40` }}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Verify & Sign In
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
