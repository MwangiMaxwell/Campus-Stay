'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { formatApiError } from '@/lib/api';
import { safeNextPath } from '@/lib/auth';
import { loginSchema, type LoginValues } from '@/lib/schemas';
import { zodFormResolver } from '@/lib/zodFormResolver';
import Link from 'next/link';

const demos = [
  ['Super admin', 'peter.kamau@campusstay.test', 'SuperAdmin#2026'],
  ['Admin', 'grace.mwangi@campusstay.test', 'Admin#2026'],
  ['Student', 'amina.wanjiku@campusstay.test', 'Student#2026'],
];

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodFormResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      const user = await login(values);
      router.push(safeNextPath(searchParams.get('next'), user.role));
      router.refresh();
    } catch (error) {
      setFormError(formatApiError(error));
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <h1 className="text-3xl font-semibold tracking-tight">Log in</h1>
        <p className="mt-2 text-sm text-muted">
          Use the email and password for your CampusStay account.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {formError ? <Alert tone="danger">{formError}</Alert> : null}
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex items-center justify-between gap-3">
            <Link href="/forgot-password" className="text-sm text-brand">
              Forgot password?
            </Link>
            <Button type="submit" loading={isSubmitting}>
              Log in
            </Button>
          </div>
        </form>
        <p className="mt-4 text-sm text-muted">
          New here?{' '}
          <Link href="/register" className="font-semibold text-brand">
            Create an account
          </Link>
        </p>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold">Demo accounts</h2>
        <p className="mt-2 text-sm text-muted">
          These accounts exist after you run the seed script. They are for local use only.
        </p>
        <ul className="mt-4 space-y-3 text-sm">
          {demos.map(([role, email, password]) => (
            <li key={email}>
              <p className="font-medium">{role}</p>
              <p className="text-muted">{email}</p>
              <p className="font-mono text-xs">{password}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
