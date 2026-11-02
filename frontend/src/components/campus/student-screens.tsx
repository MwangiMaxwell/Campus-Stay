'use client';

import Link from 'next/link';
import { BedDouble, Receipt } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function StudentBookings() {
  return (
    <section>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7e8984]">
        Reservations
      </p>
      <h2 className="mt-2 text-4xl font-medium tracking-[-0.06em]">Your bookings</h2>
      <p className="mt-2 max-w-xl text-sm text-[#7c8882]">
        Pending and approved requests will show up here. Booking is not connected yet, so this list
        is empty.
      </p>
      <div className="mt-8 rounded-2xl border border-[#dedbd4] bg-[#fbfaf7] px-6 py-12 text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-full bg-[#e9f1e6] text-[#467065]">
          <BedDouble className="size-5" />
        </span>
        <p className="mt-4 text-sm font-semibold">No bookings yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-[#7c8882]">
          Choose a room first. You can reserve it once booking is available.
        </p>
        <Link
          href="/rooms"
          className="mt-5 inline-flex rounded-xl bg-[#173d39] px-4 py-2 text-sm font-medium text-[#f8f4eb]"
        >
          Find a room
        </Link>
      </div>
    </section>
  );
}

export function StudentPayments() {
  return (
    <section>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7e8984]">Finance</p>
      <h2 className="mt-2 text-4xl font-medium tracking-[-0.06em]">Payments</h2>
      <p className="mt-2 max-w-xl text-sm text-[#7c8882]">
        The booking fee is paid with M-Pesa. Receipts will appear here when payment recording is
        connected.
      </p>
      <div className="mt-8 rounded-2xl border border-[#dedbd4] bg-[#fbfaf7] px-6 py-12 text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-full bg-[#e9f1e6] text-[#467065]">
          <Receipt className="size-5" />
        </span>
        <p className="mt-4 text-sm font-semibold">No payments yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-[#7c8882]">
          A receipt shows up after a successful M-Pesa payment.
        </p>
      </div>
    </section>
  );
}

export function StudentProfile() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="text-sm text-[#7c8882]">Loading profile…</p>;
  }

  if (!user) {
    return null;
  }

  const fields = [
    ['Full name', user.fullName],
    ['Email', user.email],
    ['Phone', user.phone],
    ['Role', user.role.replace('_', ' ')],
    ['Registration number', user.studentRegNo ?? 'Not provided'],
    ['Status', user.status],
  ];

  return (
    <section>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7e8984]">Account</p>
      <h2 className="mt-2 text-4xl font-medium tracking-[-0.06em]">Your profile</h2>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-[#dedbd4] bg-[#fbfaf7] px-5 py-4">
            <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b9790]">
              {label}
            </dt>
            <dd className="mt-2 text-sm font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
