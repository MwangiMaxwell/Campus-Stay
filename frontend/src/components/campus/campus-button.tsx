import { cn } from '@/lib/utils';

type Variant = 'default' | 'ghost' | 'outline';

const variants: Record<Variant, string> = {
  default:
    'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60',
  ghost:
    'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition hover:bg-black/5',
  outline:
    'inline-flex items-center justify-center gap-2 rounded-lg border text-sm font-medium transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60',
};

export function CampusButton({
  variant = 'default',
  className,
  type = 'button',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={cn(variants[variant], className)} {...props} />;
}
