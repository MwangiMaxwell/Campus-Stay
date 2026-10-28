'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { formatApiError } from '@/lib/api';
import { registerSchema, type RegisterValues } from '@/lib/schemas';
import { zodFormResolver } from '@/lib/zodFormResolver';

export function RegisterForm() {
  const { register: registerAccount } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodFormResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      studentRegNo: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    try {
      await registerAccount({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        password: values.password,
        studentRegNo: values.studentRegNo || undefined,
      });
      router.push('/rooms');
      router.refresh();
    } catch (error) {
      setFormError(formatApiError(error));
    }
  }

  return (
    <Card className="mx-auto max-w-lg">
      <h1 className="text-3xl font-semibold tracking-tight">Create an account</h1>
      <p className="mt-2 text-sm text-muted">
        Students can register here. Staff accounts are created by a super admin.
      </p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError ? <Alert tone="danger">{formError}</Alert> : null}
        <Input
          label="Full name"
          autoComplete="name"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Phone"
          type="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Input
          label="Student registration number (optional)"
          error={errors.studentRegNo?.message}
          {...register('studentRegNo')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" loading={isSubmitting} className="w-full">
          Create account
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        Already registered?{' '}
        <Link href="/login" className="font-semibold text-brand">
          Log in
        </Link>
      </p>
    </Card>
  );
}
