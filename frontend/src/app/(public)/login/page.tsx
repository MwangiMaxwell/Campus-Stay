import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { Spinner } from '@/components/ui/Spinner';

export default function LoginPage() {
  return (
    <Suspense fallback={<Spinner label="Loading login" />}>
      <LoginForm />
    </Suspense>
  );
}
