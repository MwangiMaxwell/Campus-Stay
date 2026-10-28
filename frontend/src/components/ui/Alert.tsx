import { cn } from '@/lib/utils';

const tones = {
  info: 'border-line bg-paper text-ink',
  success: 'border-success/30 bg-success/10 text-success',
  danger: 'border-danger/30 bg-danger/10 text-danger',
};

export function Alert({
  tone = 'info',
  children,
}: {
  tone?: keyof typeof tones;
  children: React.ReactNode;
}) {
  return (
    <div role="alert" className={cn('rounded-lg border px-3 py-2 text-sm', tones[tone])}>
      {children}
    </div>
  );
}
