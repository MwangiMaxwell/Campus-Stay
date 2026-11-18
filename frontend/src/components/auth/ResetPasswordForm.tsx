'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { apiRequest, formatApiError } from '@/lib/api';
import { resetPasswordSchema, type ResetPasswordValues } from '@/lib/schemas';
import { zodFormResolver } from '@/lib/zodFormResolver';

export function ResetPasswordForm() {
  const token = useSearchParams().get('token');
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodFormResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  async function onSubmit(values: ResetPasswordValues) {
    setFormError(null);
    try {
      await apiRequest('/api/v1/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password: values.password }),
      });
      setDone(true);
    } catch (error) {
      setFormError(formatApiError(error));
    }
  }

  if (!token) {
    return (
      <Card className="mx-auto max-w-lg">
        <h1 className="text-3xl font-semibold tracking-tight">Reset link is not valid</h1>
        <p className="mt-2 text-sm text-muted">
          This page needs the link from your reset email. Request a new one to continue.
        </p>
        <p className="mt-4 text-sm">
          <Link href="/forgot-password" className="font-semibold text-brand">
            Request a new link
          </Link>
        </p>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="mx-auto max-w-lg">
        <h1 className="text-3xl font-semibold tracking-tight">Password updated</h1>
        <p className="mt-2 text-sm text-muted">You can now log in with your new password.</p>
        <p className="mt-4 text-sm">
          <Link href="/login" className="font-semibold text-brand">
            Go to login
          </Link>
        </p>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg">
      <h1 className="text-3xl font-semibold tracking-tight">Choose a new password</h1>
      <p className="mt-2 text-sm text-muted">
        Use at least 8 characters with one letter and one number.
      </p>
      <form method="post" className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError ? <Alert tone="danger">{formError}</Alert> : null}
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" loading={isSubmitting}>
          Update password
        </Button>
      </form>
      <p className="mt-4 text-sm">
        <Link href="/login" className="font-semibold text-brand">
          Back to login
        </Link>
      </p>
    </Card>
  );
}
