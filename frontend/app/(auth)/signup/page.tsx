'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormField } from '../../components/Primitives';
import { useAuth } from '../../components/AuthContext';
import { apiRequest, ResponseError } from '../../utils/api';

const signupSchema = z
  .object({
    companyName: z.string().min(2, 'Company name must be at least 2 characters'),
    companyEmail: z.string().email('Invalid company email address').optional().or(z.literal('')),
    companyPhone: z.string().optional(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .refine((val) => /[0-9]/.test(val), 'Password must contain at least 1 number'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      companyName: '',
      companyEmail: '',
      companyPhone: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = async (data: SignupFormValues) => {
    setErrorMsg(null);
    setFieldErrors({});
    setIsLoading(true);

    try {
      const response = await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          companyName: data.companyName,
          companyEmail: data.companyEmail || undefined,
          companyPhone: data.companyPhone || undefined,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
        }),
      });

      // Login helper sets context and localStorage
      login(response.token, response.user);
      router.push('/dashboard');
    } catch (error: any) {
      if (error instanceof ResponseError) {
        if (error.errorData.field) {
          setFieldErrors({ [error.errorData.field]: error.errorData.message });
        } else if (error.errorData.fields) {
          setFieldErrors(error.errorData.fields);
        } else {
          setErrorMsg(error.errorData.message);
        }
      } else {
        setErrorMsg('An unexpected error occurred. Please verify your network.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-semibold tracking-tight text-text">
          Register Company
        </h2>
        <p className="text-sm text-text-muted">
          Create a new company space and your administrator account.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-status-absent/10 border border-status-absent/30 rounded-lg text-sm font-semibold text-status-absent animate-shake">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="border-b border-border pb-4 mb-4">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Company Information
          </h3>
          <div className="space-y-4">
            <FormField
              label="Company Name"
              placeholder="e.g. Acme Corporation"
              error={errors.companyName?.message || fieldErrors.companyName}
              required
              {...register('companyName')}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Company Email"
                type="email"
                placeholder="e.g. contact@acme.com"
                error={errors.companyEmail?.message || fieldErrors.companyEmail}
                {...register('companyEmail')}
              />
              <FormField
                label="Company Phone"
                placeholder="e.g. +1 555-0199"
                error={errors.companyPhone?.message || fieldErrors.companyPhone}
                {...register('companyPhone')}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Admin Account Information
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="First Name"
                placeholder="e.g. John"
                error={errors.firstName?.message || fieldErrors.firstName}
                required
                {...register('firstName')}
              />
              <FormField
                label="Last Name"
                placeholder="e.g. Doe"
                error={errors.lastName?.message || fieldErrors.lastName}
                required
                {...register('lastName')}
              />
            </div>

            <FormField
              label="Email Address"
              type="email"
              placeholder="e.g. john.doe@acme.com"
              error={errors.email?.message || fieldErrors.email}
              required
              {...register('email')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Password"
                type="password"
                placeholder="Min. 8 chars, 1 number"
                error={errors.password?.message || fieldErrors.password}
                required
                {...register('password')}
              />
              <FormField
                label="Confirm Password"
                type="password"
                placeholder="Repeat password"
                error={errors.confirmPassword?.message || fieldErrors.confirmPassword}
                required
                {...register('confirmPassword')}
              />
            </div>
          </div>
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
              Creating Account...
            </>
          ) : (
            'Register and Create Admin'
          )}
        </button>
      </form>

      <div className="text-center text-xs text-text-muted pt-4 border-t border-border/60">
        Already registered?{' '}
        <Link href="/login" className="text-accent font-semibold hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
