'use client';

import { useEffect, useRef } from 'react';
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { capitalize, statusTone } from '@/components/campus/format';
import { cn } from '@/lib/utils';
import type { Pagination } from '@/types';

export const fieldClass =
  'w-full rounded-xl border border-[#d8d5ce] bg-white px-3 py-2.5 text-sm text-[#173d39] outline-none placeholder:text-[#a1aaa5] focus:border-[#173d39] disabled:bg-[#f1efe9] disabled:text-[#8b9790]';

export const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#173d39] px-4 py-2.5 text-sm font-medium text-[#f8f4eb] transition hover:bg-[#285b55] disabled:cursor-not-allowed disabled:opacity-60';

export const outlineButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-[#cbc9c2] px-4 py-2.5 text-sm font-medium text-[#173d39] transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60';

export const dangerButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-[#e3c6c1] px-4 py-2.5 text-sm font-medium text-[#a05d55] transition hover:bg-[#f2e3e0] disabled:cursor-not-allowed disabled:opacity-60';

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 border-b border-[#dedbd4] pb-7 sm:flex-row sm:items-end sm:justify-between print:hidden">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7e8984]">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-4xl font-medium tracking-[-0.06em] text-[#173d39]">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-[#7c8882]">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function Metric({
  label,
  value,
  note,
  up,
}: {
  label: string;
  value: string;
  note: string;
  up?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#dedbd4] bg-[#fbfaf7] p-5">
      <p className="text-xs text-[#82908a]">{label}</p>
      <p className="mt-5 text-3xl font-medium tracking-[-0.05em]">{value}</p>
      <p
        className={`mt-2 flex items-center gap-1 text-xs font-semibold ${up ? 'text-[#5f8176]' : 'text-[#b27b4b]'}`}
      >
        {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
        {note}
      </p>
    </div>
  );
}

export function StatusPill({ status, label }: { status: string; label?: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold ${statusTone(status)}`}
    >
      {label ?? capitalize(status)}
    </span>
  );
}

export function EmptyState({
  title,
  text,
  action,
  icon,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#dedbd4] bg-[#fbfaf7] px-6 py-12 text-center">
      {icon ? (
        <span className="mx-auto grid size-11 place-items-center rounded-full bg-[#e9f1e6] text-[#467065]">
          {icon}
        </span>
      ) : null}
      <p className="mt-4 text-sm font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-[#7c8882]">{text}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'success' | 'danger';
  children: React.ReactNode;
}) {
  const tones = {
    info: 'border-[#d8ded5] bg-[#e9f1e6] text-[#33564d]',
    success: 'border-[#cfe0cc] bg-[#e9f1e6] text-[#33564d]',
    danger: 'border-[#e3c6c1] bg-[#f8ebe8] text-[#8a4a42]',
  };
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('rounded-xl border px-4 py-3 text-sm', tones[tone])}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[#4d625b]">{label}</span>
      {children}
      {hint && !error ? <span className="mt-1 block text-xs text-[#8b9790]">{hint}</span> : null}
      {error ? <span className="mt-1 block text-xs text-[#a05d55]">{error}</span> : null}
    </label>
  );
}

export function Modal({
  title,
  description,
  onClose,
  children,
  wide,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  });

  // Runs once per open, so typing in a field never steals focus back to the dialog.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') closeRef.current();
    }

    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#10282a]/50 p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-[#fbfaf7] p-6 shadow-2xl outline-none sm:rounded-3xl',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-md',
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold tracking-[-0.03em] text-[#173d39]">{title}</h3>
            {description ? <p className="mt-1 text-sm text-[#7c8882]">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-[#7c8882] hover:bg-black/5"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export function Pager({
  pagination,
  onPage,
}: {
  pagination: Pagination | undefined;
  onPage: (page: number) => void;
}) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total } = pagination;
  return (
    <div className="mt-4 flex items-center justify-between text-xs text-[#7c8882] print:hidden">
      <span>
        Page {page} of {totalPages} · {total} total
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className={outlineButtonClass}
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft className="size-4" /> Previous
        </button>
        <button
          type="button"
          className={outlineButtonClass}
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Next <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function DataTable({
  columns,
  children,
  minWidth = 720,
}: {
  columns: string[];
  children: React.ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#dedbd4] bg-[#fbfaf7]">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead className="border-b border-[#ebe8e0] text-xs text-[#89948e]">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-5 py-4 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Row({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-[#f0ede7] last:border-0">{children}</tr>;
}

export function Cell({
  children,
  muted,
  strong,
  className,
}: {
  children: React.ReactNode;
  muted?: boolean;
  strong?: boolean;
  className?: string;
}) {
  return (
    <td
      className={cn(
        'px-5 py-4 align-top',
        muted && 'text-[#74817a]',
        strong && 'font-semibold',
        className,
      )}
    >
      {children}
    </td>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className={cn(fieldClass, 'sm:w-80')}
    />
  );
}

export function Tabs<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition',
              active
                ? 'border-[#173d39] bg-[#173d39] text-[#f8f4eb]'
                : 'border-[#d8d5ce] text-[#68726e] hover:bg-black/5',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
