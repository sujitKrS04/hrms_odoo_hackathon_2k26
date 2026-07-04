'use client';

import React, { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormField } from '../../components/Primitives';
import { useAuth } from '../../components/AuthContext';
import { apiRequest, ResponseError } from '../../utils/api';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      // Login helper sets context and localStorage
      login(response.token, response.user);

      if (response.mustChangePassword) {
        router.push('/change-password');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      if (error instanceof ResponseError) {
        setErrorMsg(error.errorData.message);
      } else {
        setErrorMsg('Something went wrong. Please check your network connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleDetails = () => {
    if (role === 'admin') {
      return {
        label: 'Admin Portal',
        className: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
      };
    }
    if (role === 'hr') {
      return {
        label: 'HR Portal',
        className: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
      };
    }
    if (role === 'employee') {
      return {
        label: 'Employee Portal',
        className: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
      };
    }
    return null;
  };

  const roleDetails = getRoleDetails();

  return (
    <div className="space-y-6 font-sans">
      <div className="space-y-2">
        {roleDetails ? (
          <div className="flex justify-between items-center">
            <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase font-sans ${roleDetails.className}`}>
              {roleDetails.label}
            </span>
            <Link href="/" className="text-xs text-text-muted hover:text-accent font-semibold transition-colors">
              ← Change Portal
            </Link>
          </div>
        ) : (
          <div className="flex justify-end">
            <Link href="/" className="text-xs text-text-muted hover:text-accent font-semibold transition-colors">
              ← Change Portal
            </Link>
          </div>
        )}
        <h2 className="text-2xl font-display font-semibold tracking-tight text-text">
          Sign In
        </h2>
        <p className="text-sm text-text-muted">
          Enter your credentials to access your account.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-status-absent/10 border border-status-absent/30 rounded-lg text-sm font-semibold text-status-absent animate-shake">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Email Address"
          type="email"
          placeholder="e.g. employee@company.com"
          error={errors.email?.message}
          required
          {...register('email')}
        />

        <FormField
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          required
          {...register('password')}
        />

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-text-muted hover:text-text transition-colors">
            <input
              type="checkbox"
              className="rounded border-border text-accent focus:ring-accent/40 h-4 w-4 bg-background"
            />
            Keep me signed in
          </label>
          <span className="text-text-muted hover:text-accent font-semibold cursor-not-allowed">
            Forgot Password?
          </span>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 bg-accent text-background font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-background" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="text-center text-xs text-text-muted pt-4 border-t border-border/60">
        New to HRMS Core?{' '}
        <Link href="/signup" className="text-accent font-semibold hover:underline">
          Register your company
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-12">
        <svg className="animate-spin h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
