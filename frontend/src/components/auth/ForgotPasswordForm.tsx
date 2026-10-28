'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { apiRequest, formatApiError } from '@/lib/api';
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/lib/schemas';
import { zodFormResolver } from '@/lib/zodFormResolver';
import Link from 'next/link';

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodFormResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setFormError(null);
    try {
      await apiRequest('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(values),
      });
    } catch (error) {
      setFormError(formatApiError(error));
    }
  }

  return (
    <Card className="mx-auto max-w-lg">
      <h1 className="text-3xl font-semibold tracking-tight">Reset your password</h1>
      <p className="mt-2 text-sm text-muted">
        Password reset is wired to the API and will send instructions once that service is finished.
      </p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError ? <Alert tone="info">{formError}</Alert> : null}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" loading={isSubmitting}>
          Send reset link
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
