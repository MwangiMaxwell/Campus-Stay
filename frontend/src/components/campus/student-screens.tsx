'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { BedDouble, Receipt } from 'lucide-react';
import {
  Cell,
  DataTable,
  EmptyState,
  Field,
  Modal,
  Notice,
  PageHeading,
  Row,
  StatusPill,
  dangerButtonClass,
  fieldClass,
  outlineButtonClass,
  primaryButtonClass,
} from '@/components/campus/campus-ui';
import { formatDate, formatDateTime, formatKes, labelRoomType } from '@/components/campus/format';
import { PayModal } from '@/components/campus/pay-modal';
import { useAction, useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';
import {
  changePasswordSchema,
  profileSchema,
  type ChangePasswordValues,
  type ProfileValues,
} from '@/lib/schemas';
import { zodFormResolver } from '@/lib/zodFormResolver';
import type { Booking, Payment, PublicUser } from '@/types';

// Mirrors the server default (BOOKING_HOLD_HOURS). The server is the source of truth.
const HOLD_HOURS = 24;

function StaffNotice({ what }: { what: string }) {
  return (
    <EmptyState
      title="This page is for students"
      text={`Staff accounts do not have ${what}. Manage students' bookings and payments from the admin area.`}
      action={
        <Link href="/admin" className={primaryButtonClass}>
          Open admin area
        </Link>
      }
    />
  );
}

function paymentLabel(booking: Booking): { status: string; label: string } {
  const payment = booking.latestPayment;
  if (!payment) return { status: 'unpaid', label: 'Unpaid' };
  if (payment.status === 'success') return { status: 'success', label: 'Paid' };
  if (payment.status === 'pending') return { status: 'pending', label: 'Payment pending' };
  return { status: 'failed', label: 'Last payment failed' };
}

function nextStep(booking: Booking): string | null {
  if (booking.status === 'pending') {
    const payment = booking.latestPayment;
    if (payment?.status === 'success') return 'Paid. Waiting for staff to approve your booking.';
    if (payment?.status === 'pending') return 'Waiting for M-Pesa to confirm your payment.';
    const releases = new Date(new Date(booking.createdAt).getTime() + HOLD_HOURS * 3600 * 1000);
    return `Pay before ${formatDateTime(releases)} or the room is released.`;
  }
  if (booking.status === 'approved') return 'Approved. Your room is ready for your check-in date.';
  if (booking.status === 'cancelled') return 'This booking was cancelled.';
  return 'This stay is complete.';
}

export function StudentBookings() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const bookings = useApi<Booking[]>(isStudent ? '/api/v1/bookings' : null);
  const [paying, setPaying] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const cancelAction = useAction();
  const reload = bookings.reload;

  async function confirmCancel() {
    if (!cancelling) return;
    const result = await cancelAction.run(() =>
      apiRequest<{ status: string }>(`/api/v1/bookings/${cancelling.id}/cancel`, {
        method: 'PATCH',
      }),
    );
    if (result) {
      setCancelling(null);
      setNotice('Booking cancelled. The room is open to others again.');
      reload();
    }
  }

  return (
    <section>
      <PageHeading
        eyebrow="Reservations"
        title="Your bookings"
        description="Reserve a room, pay the booking fee with M-Pesa, then wait for staff approval."
        action={
          isStudent ? (
            <Link href="/rooms" className={primaryButtonClass}>
              Find a room
            </Link>
          ) : undefined
        }
      />
      <div className="mt-6 space-y-4">
        {notice ? <Notice tone="success">{notice}</Notice> : null}
        {!isStudent && user ? <StaffNotice what="bookings of their own" /> : null}
        {bookings.error ? <Notice tone="danger">{bookings.error}</Notice> : null}
        {isStudent && bookings.loading && !bookings.data ? (
          <p className="text-sm text-[#7c8882]">Loading your bookings…</p>
        ) : null}
        {bookings.data && bookings.data.length === 0 ? (
          <EmptyState
            icon={<BedDouble className="size-5" />}
            title="No bookings yet"
            text="Choose a room and reserve it. It takes about a minute."
            action={
              <Link href="/rooms" className={primaryButtonClass}>
                Find a room
              </Link>
            }
          />
        ) : null}
        {bookings.data?.map((booking) => {
          const payment = paymentLabel(booking);
          const room = booking.room;
          const canPay =
            booking.status === 'pending' &&
            booking.latestPayment?.status !== 'success' &&
            booking.latestPayment?.status !== 'pending';
          const canCancel =
            booking.status === 'pending' && booking.latestPayment?.status !== 'success';
          const step = nextStep(booking);
          return (
            <article
              key={booking.id}
              className="rounded-2xl border border-[#dedbd4] bg-[#fbfaf7] p-5 sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold tracking-[-0.03em]">
                    {room?.hostel?.name} {room?.roomNumber}
                  </h3>
                  <p className="mt-1 text-xs text-[#7f8b84]">
                    {room?.hostel?.location} · {room ? labelRoomType(room.roomType) : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill status={booking.status} />
                  {booking.status === 'pending' || booking.status === 'approved' ? (
                    <StatusPill status={payment.status} label={payment.label} />
                  ) : null}
                </div>
              </div>
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b9790]">
                    Stay
                  </dt>
                  <dd className="mt-1 font-medium">
                    {formatDate(booking.checkInDate)} to {formatDate(booking.checkOutDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b9790]">
                    Booking fee
                  </dt>
                  <dd className="mt-1 font-medium">{formatKes(room?.price ?? 0)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b9790]">
                    Receipt
                  </dt>
                  <dd className="mt-1 font-medium">
                    {booking.latestPayment?.status === 'success'
                      ? (booking.latestPayment.mpesaReceiptNo ?? 'Recorded')
                      : 'None yet'}
                  </dd>
                </div>
              </dl>
              {step ? <p className="mt-4 text-sm text-[#68726e]">{step}</p> : null}
              {canPay || canCancel ? (
                <div className="mt-5 flex flex-wrap gap-2 border-t border-[#ece9e2] pt-4">
                  {canPay ? (
                    <button
                      type="button"
                      className={primaryButtonClass}
                      onClick={() => {
                        setNotice(null);
                        setPaying(booking);
                      }}
                    >
                      Pay {formatKes(room?.price ?? 0)} with M-Pesa
                    </button>
                  ) : null}
                  {canCancel ? (
                    <button
                      type="button"
                      className={dangerButtonClass}
                      onClick={() => {
                        cancelAction.setError(null);
                        setCancelling(booking);
                      }}
                    >
                      Cancel booking
                    </button>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
      {paying ? (
        <PayModal booking={paying} onClose={() => setPaying(null)} onFinished={reload} />
      ) : null}
      {cancelling ? (
        <Modal
          title="Cancel this booking?"
          description={`${cancelling.room?.hostel?.name ?? ''} ${cancelling.room?.roomNumber ?? ''} will be released for other students.`}
          onClose={() => setCancelling(null)}
        >
          {cancelAction.error ? <Notice tone="danger">{cancelAction.error}</Notice> : null}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              className={outlineButtonClass}
              onClick={() => setCancelling(null)}
            >
              Keep booking
            </button>
            <button
              type="button"
              className={dangerButtonClass}
              disabled={cancelAction.busy}
              onClick={() => void confirmCancel()}
            >
              {cancelAction.busy ? 'Cancelling…' : 'Yes, cancel it'}
            </button>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}

export function StudentPayments() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const payments = useApi<Payment[]>(isStudent ? '/api/v1/payments' : null);

  return (
    <section>
      <PageHeading
        eyebrow="Finance"
        title="Payments"
        description="Every M-Pesa booking fee you have started, with its receipt once it succeeds."
      />
      <div className="mt-6 space-y-4">
        {!isStudent && user ? <StaffNotice what="payments of their own" /> : null}
        {payments.error ? <Notice tone="danger">{payments.error}</Notice> : null}
        {isStudent && payments.loading && !payments.data ? (
          <p className="text-sm text-[#7c8882]">Loading your payments…</p>
        ) : null}
        {payments.data && payments.data.length === 0 ? (
          <EmptyState
            icon={<Receipt className="size-5" />}
            title="No payments yet"
            text="A receipt shows up here after you pay a booking fee."
            action={
              <Link href="/bookings" className={outlineButtonClass}>
                Go to bookings
              </Link>
            }
          />
        ) : null}
        {payments.data && payments.data.length > 0 ? (
          <DataTable columns={['Date', 'Room', 'Amount', 'Phone', 'Receipt', 'Status']}>
            {payments.data.map((payment) => (
              <Row key={payment.id}>
                <Cell muted>{formatDateTime(payment.paymentDate ?? payment.createdAt)}</Cell>
                <Cell strong>
                  {payment.booking?.room?.hostel?.name} {payment.booking?.room?.roomNumber}
                </Cell>
                <Cell>{formatKes(payment.amount)}</Cell>
                <Cell muted>{payment.phoneNumber}</Cell>
                <Cell muted>{payment.mpesaReceiptNo ?? 'None'}</Cell>
                <Cell>
                  <StatusPill status={payment.status} />
                </Cell>
              </Row>
            ))}
          </DataTable>
        ) : null}
      </div>
    </section>
  );
}

function ProfileDetails({ user }: { user: PublicUser }) {
  const { refresh } = useAuth();
  const [saved, setSaved] = useState(false);
  const { busy, error, run, setError } = useAction();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodFormResolver(profileSchema),
    defaultValues: {
      fullName: user.fullName,
      phone: user.phone,
      studentRegNo: user.studentRegNo ?? '',
    },
  });

  async function onSubmit(values: ProfileValues) {
    setSaved(false);
    setError(null);
    const result = await run(() =>
      apiRequest<{ user: PublicUser }>('/api/v1/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(values),
      }),
    );
    if (result) {
      await refresh();
      setSaved(true);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      className="space-y-4 rounded-2xl border border-[#dedbd4] bg-[#fbfaf7] p-6"
      noValidate
    >
      <h3 className="font-semibold">Your details</h3>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {saved ? <Notice tone="success">Profile updated.</Notice> : null}
      <Field label="Full name" error={errors.fullName?.message}>
        <input className={fieldClass} autoComplete="name" {...register('fullName')} />
      </Field>
      <Field label="Phone" error={errors.phone?.message}>
        <input className={fieldClass} type="tel" autoComplete="tel" {...register('phone')} />
      </Field>
      {user.role === 'student' ? (
        <Field label="Registration number" error={errors.studentRegNo?.message}>
          <input className={fieldClass} {...register('studentRegNo')} />
        </Field>
      ) : null}
      <Field label="Email" hint="Your email is your login and cannot be changed here.">
        <input className={fieldClass} value={user.email} disabled readOnly />
      </Field>
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-[#8b9790]">
          Role: {user.role.replace('_', ' ')} · Status: {user.status}
        </span>
        <button type="submit" className={primaryButtonClass} disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const [done, setDone] = useState(false);
  const { busy, error, run, setError } = useAction();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodFormResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  async function onSubmit(values: ChangePasswordValues) {
    setDone(false);
    setError(null);
    const result = await run(() =>
      apiRequest<{ message: string }>('/api/v1/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      }),
    );
    if (result) {
      reset();
      setDone(true);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      className="space-y-4 rounded-2xl border border-[#dedbd4] bg-[#fbfaf7] p-6"
      noValidate
    >
      <h3 className="font-semibold">Change password</h3>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {done ? <Notice tone="success">Password changed.</Notice> : null}
      <Field label="Current password" error={errors.currentPassword?.message}>
        <input
          className={fieldClass}
          type="password"
          autoComplete="current-password"
          {...register('currentPassword')}
        />
      </Field>
      <Field label="New password" error={errors.newPassword?.message}>
        <input
          className={fieldClass}
          type="password"
          autoComplete="new-password"
          {...register('newPassword')}
        />
      </Field>
      <Field label="Confirm new password" error={errors.confirmPassword?.message}>
        <input
          className={fieldClass}
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword')}
        />
      </Field>
      <div className="flex justify-end pt-1">
        <button type="submit" className={primaryButtonClass} disabled={busy}>
          {busy ? 'Updating…' : 'Update password'}
        </button>
      </div>
    </form>
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

  return (
    <section>
      <PageHeading
        eyebrow="Account"
        title="Your profile"
        description="Keep your contact details current so staff and M-Pesa can reach you."
      />
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <ProfileDetails user={user} />
        <PasswordForm />
      </div>
    </section>
  );
}
