import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { Spinner } from '@/components/ui/Spinner';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Spinner label="Loading" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
