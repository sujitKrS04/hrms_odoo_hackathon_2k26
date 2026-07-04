'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { FormField } from '../../components/Primitives';
import { useAuth } from '../../components/AuthContext';
import { apiRequest, ResponseError } from '../../utils/api';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .refine((val) => /[0-9]/.test(val), 'New password must contain at least 1 number'),
    confirmNewPassword: z.string().min(1, 'Confirm new password is required'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const { updateUser, logout } = useAuth();
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
    mode: 'onBlur',
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    setErrorMsg(null);
    setFieldErrors({});
    setIsLoading(true);

    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      // Update the user session state
      updateUser({ mustChangePassword: false });
      router.push('/dashboard');
    } catch (error: any) {
      if (error instanceof ResponseError) {
        if (error.errorData.field) {
          setFieldErrors({ [error.errorData.field]: error.errorData.message });
        } else {
          setErrorMsg(error.errorData.message);
        }
      } else {
        setErrorMsg('An error occurred. Please verify your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-semibold tracking-tight text-text">
          Change Password
        </h2>
        <p className="text-sm text-text-muted">
          Your administrator or manager set up your account with a temporary password. You must update it to continue.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-status-absent/10 border border-status-absent/30 rounded-lg text-sm font-semibold text-status-absent animate-shake">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Current Password"
          type="password"
          placeholder="••••••••"
          error={errors.currentPassword?.message || fieldErrors.currentPassword}
          required
          {...register('currentPassword')}
        />

        <FormField
          label="New Password"
          type="password"
          placeholder="Min. 8 chars, 1 number"
          error={errors.newPassword?.message || fieldErrors.newPassword}
          required
          {...register('newPassword')}
        />

        <FormField
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          error={errors.confirmNewPassword?.message || fieldErrors.confirmNewPassword}
          required
          {...register('confirmNewPassword')}
        />

        <div className="flex gap-4 pt-2">
          <button
            type="button"
            onClick={logout}
            className="flex-1 py-2.5 bg-background border border-border text-text font-semibold rounded-lg hover:bg-surface active:scale-[0.98] transition-all text-center"
          >
            Cancel & Log Out
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-2.5 bg-accent text-background font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-background" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              'Save & Continue'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
