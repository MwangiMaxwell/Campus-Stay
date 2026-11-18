'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  BarChart3,
  BedDouble,
  ChevronRight,
  ClipboardList,
  Receipt,
  ScrollText,
} from 'lucide-react';
import { Metric, Notice, PageHeading, primaryButtonClass } from '@/components/campus/campus-ui';
import { formatKes } from '@/components/campus/format';
import { useApi } from '@/hooks/useApi';
import type { Dashboard } from '@/types';

function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-KE', {
    month: 'short',
    timeZone: 'UTC',
  });
}

export function AdminOverview() {
  const { data, error, loading } = useApi<{ dashboard: Dashboard }>('/api/v1/admin/dashboard');
  const dashboard = data?.dashboard;
  const placeholder = loading ? '…' : '-';
  const maxBookings = Math.max(1, ...(dashboard?.monthly.map((row) => row.bookings) ?? [1]));

  return (
    <div>
      <PageHeading
        eyebrow="Operations overview"
        title="Keep campus moving."
        description="Live figures for rooms, bookings and M-Pesa collections across every hostel."
        action={
          <Link href="/admin/bookings" className={primaryButtonClass}>
            Review bookings <ChevronRight className="size-4" />
          </Link>
        }
      />
      {error ? (
        <div className="mt-6">
          <Notice tone="danger">{error}</Notice>
        </div>
      ) : null}
      <div className="grid gap-4 py-7 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Awaiting your approval"
          value={dashboard ? String(dashboard.bookings.awaitingApproval) : placeholder}
          note={
            dashboard && dashboard.bookings.awaitingApproval > 0
              ? 'Paid and waiting'
              : 'Queue is clear'
          }
          up={Boolean(dashboard) && dashboard?.bookings.awaitingApproval === 0}
        />
        <Metric
          label="Collected this month"
          value={dashboard ? formatKes(dashboard.payments.collectedThisMonth) : placeholder}
          note={dashboard ? `${formatKes(dashboard.payments.collectedTotal)} all time` : 'Loading'}
          up
        />
        <Metric
          label="Rooms available"
          value={
            dashboard ? `${dashboard.rooms.available} of ${dashboard.rooms.total}` : placeholder
          }
          note={dashboard ? `${dashboard.rooms.maintenance} in maintenance` : 'Loading'}
          up={Boolean(dashboard) && (dashboard?.rooms.available ?? 0) > 0}
        />
        <Metric
          label="Occupancy"
          value={dashboard ? `${dashboard.rooms.occupancyPercent}%` : placeholder}
          note={dashboard ? `${dashboard.users.students} students registered` : 'Loading'}
          up={Boolean(dashboard) && (dashboard?.rooms.occupancyPercent ?? 100) < 90}
        />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-2xl border border-[#dedbd4] bg-[#fbfaf7] p-6">
          <h3 className="font-semibold">Booking activity</h3>
          <p className="mt-1 text-xs text-[#8a948e]">Reservations made in the last six months</p>
          {dashboard ? (
            <div className="mt-8 flex h-48 items-end gap-3">
              {dashboard.monthly.map((row) => (
                <div
                  key={row.month}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="text-xs font-semibold">{row.bookings}</span>
                  <div
                    className="w-full rounded-t-lg bg-[#173d39]"
                    style={{ height: `${Math.max(4, (row.bookings / maxBookings) * 100)}%` }}
                    title={`${row.bookings} bookings, ${formatKes(row.collected)} collected`}
                  />
                  <span className="text-[11px] text-[#8a948e]">{monthLabel(row.month)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-10 text-sm text-[#7c8882]">{loading ? 'Loading…' : 'No data yet.'}</p>
          )}
        </section>
        <section className="rounded-2xl border border-[#dedbd4] bg-[#173d39] p-6 text-[#f8f4eb]">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">By hostel</h3>
            <BarChart3 className="size-4 text-[#b9d1c5]" />
          </div>
          <div className="mt-8 flex flex-col gap-6">
            {dashboard && dashboard.byHostel.length > 0 ? (
              dashboard.byHostel.map((hostel) => (
                <div key={hostel.name}>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#c5d6cc]">{hostel.name}</span>
                    <span className="font-semibold">{hostel.occupancyPercent}%</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/15">
                    <div
                      style={{ width: `${hostel.occupancyPercent}%` }}
                      className="h-full rounded-full bg-[#d7ed82]"
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-[#c6d3cb]">
                {loading ? 'Loading…' : 'Add rooms to see hostel occupancy.'}
              </p>
            )}
          </div>
          <Link
            href="/admin/rooms"
            className="mt-8 flex items-center gap-2 text-xs font-semibold text-[#d7ed82]"
          >
            View room inventory <ArrowUpRight className="size-3" />
          </Link>
        </section>
      </div>
      <section className="mt-5 rounded-2xl border border-[#dedbd4] bg-[#fbfaf7] p-6">
        <h3 className="font-semibold">Needs your attention</h3>
        <p className="mt-1 text-xs text-[#8a948e]">Jump to the queue you want to work through</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Action
            icon={<ClipboardList className="size-4" />}
            title="Bookings"
            text={
              dashboard
                ? `${dashboard.bookings.awaitingApproval} to approve, ${dashboard.bookings.approved} active`
                : 'Approval queue'
            }
            href="/admin/bookings"
          />
          <Action
            icon={<BedDouble className="size-4" />}
            title="Rooms"
            text={dashboard ? `${dashboard.rooms.total} rooms listed` : 'Room inventory'}
            href="/admin/rooms"
          />
          <Action
            icon={<Receipt className="size-4" />}
            title="Payments"
            text={dashboard ? `${dashboard.payments.success} successful` : 'M-Pesa ledger'}
            href="/admin/payments"
          />
          <Action
            icon={<ScrollText className="size-4" />}
            title="Audit log"
            text="Who did what, and when"
            href="/admin/audit"
          />
        </div>
      </section>
    </div>
  );
}

function Action({
  icon,
  title,
  text,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-[#ebe8e0] p-3 text-left transition hover:border-[#b9d1c5] hover:bg-[#f5f3ef]"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#e9f1e6] text-[#467065]">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs text-[#89948e]">{text}</span>
      </span>
      <ChevronRight className="ml-auto size-4 shrink-0 text-[#a6afa9]" />
    </Link>
  );
}
