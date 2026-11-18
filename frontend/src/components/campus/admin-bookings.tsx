'use client';

import { useState } from 'react';
import { Check, Flag, X } from 'lucide-react';
import {
  Cell,
  DataTable,
  EmptyState,
  Modal,
  Notice,
  PageHeading,
  Pager,
  Row,
  SearchBox,
  StatusPill,
  Tabs,
  dangerButtonClass,
  outlineButtonClass,
  primaryButtonClass,
} from '@/components/campus/campus-ui';
import { formatDate, formatKes } from '@/components/campus/format';
import { useAction, useApi } from '@/hooks/useApi';
import { apiRequest } from '@/lib/api';
import type { AdminBooking, BookingStatus, Pagination } from '@/types';

const PAGE_SIZE = 20;

interface BookingList {
  bookings: AdminBooking[];
  pagination: Pagination;
}

type Filter = '' | BookingStatus;

const tabs: Array<{ value: Filter; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: '', label: 'All' },
];

function paymentState(booking: AdminBooking): { status: string; label: string } {
  const payment = booking.latestPayment;
  if (!payment) return { status: 'unpaid', label: 'Unpaid' };
  if (payment.status === 'success') return { status: 'success', label: 'Paid' };
  if (payment.status === 'pending') return { status: 'pending', label: 'Pending' };
  return { status: 'failed', label: 'Failed' };
}

type Pending =
  { kind: 'cancel'; booking: AdminBooking } | { kind: 'complete'; booking: AdminBooking };

export function AdminBookings() {
  const [filter, setFilter] = useState<Filter>('pending');
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState<Pending | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const confirmAction = useAction();

  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (filter) params.set('status', filter);
  const bookings = useApi<BookingList>(`/api/v1/admin/bookings?${params.toString()}`);
  const reload = bookings.reload;

  const needle = query.trim().toLowerCase();
  const visible = (bookings.data?.bookings ?? []).filter((booking) =>
    `${booking.user?.fullName ?? ''} ${booking.user?.email ?? ''} ${booking.user?.studentRegNo ?? ''} ${booking.room?.roomNumber ?? ''} ${booking.room?.hostel?.name ?? ''}`
      .toLowerCase()
      .includes(needle),
  );

  async function approve(booking: AdminBooking) {
    setNotice(null);
    setRowError(null);
    setWorkingId(booking.id);
    try {
      await apiRequest<unknown>(`/api/v1/admin/bookings/${booking.id}/approve`, {
        method: 'PATCH',
      });
      setNotice(
        `Approved ${booking.user?.fullName ?? 'booking'} for ${booking.room?.roomNumber ?? ''}.`,
      );
      reload();
    } catch (error) {
      setRowError(error instanceof Error ? error.message : 'Could not approve this booking.');
    } finally {
      setWorkingId(null);
    }
  }

  async function confirm() {
    if (!pending) return;
    const { kind, booking } = pending;
    const result = await confirmAction.run(() =>
      apiRequest<{ refundDue?: boolean }>(`/api/v1/admin/bookings/${booking.id}/${kind}`, {
        method: 'PATCH',
      }),
    );
    if (result) {
      setPending(null);
      setNotice(
        kind === 'complete'
          ? 'Stay marked as completed and the room is open again.'
          : result.refundDue
            ? `Booking cancelled. ${booking.user?.fullName ?? 'The student'} paid ${formatKes(booking.latestPayment?.amount ?? 0)}, so a refund is due.`
            : 'Booking cancelled and the room is open again.',
      );
      reload();
    }
  }

  const paidAmount =
    pending?.booking.latestPayment?.status === 'success' ? pending.booking.latestPayment.amount : 0;

  return (
    <div>
      <PageHeading
        eyebrow="Reservations"
        title="Bookings"
        description="Approve paid bookings, cancel requests, and close finished stays."
      />
      <div className="flex flex-col gap-3 border-b border-[#dedbd4] py-5 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={filter}
          options={tabs}
          onChange={(value) => {
            setFilter(value);
            setPage(1);
          }}
        />
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Search this page by student or room"
        />
      </div>
      <div className="mt-5 space-y-4">
        {notice ? <Notice tone="success">{notice}</Notice> : null}
        {rowError ? <Notice tone="danger">{rowError}</Notice> : null}
        {bookings.error ? <Notice tone="danger">{bookings.error}</Notice> : null}
        {bookings.loading && !bookings.data ? (
          <p className="text-sm text-[#7c8882]">Loading bookings…</p>
        ) : null}
        {bookings.data && visible.length === 0 ? (
          <EmptyState
            title="No bookings here"
            text={
              filter === 'pending'
                ? 'Nothing is waiting. New reservations will line up here.'
                : 'No bookings match this view.'
            }
          />
        ) : null}
        {visible.length > 0 ? (
          <DataTable
            minWidth={980}
            columns={['Student', 'Room', 'Stay', 'Fee', 'Payment', 'Status', 'Actions']}
          >
            {visible.map((booking) => {
              const payment = paymentState(booking);
              const canApprove = booking.status === 'pending' && payment.status === 'success';
              const canCancel = booking.status === 'pending' || booking.status === 'approved';
              const canComplete = booking.status === 'approved';
              return (
                <Row key={booking.id}>
                  <Cell>
                    <p className="font-semibold">{booking.user?.fullName ?? 'Unknown'}</p>
                    <p className="mt-0.5 text-xs text-[#8b9790]">
                      {booking.user?.email}
                      {booking.user?.studentRegNo ? ` · ${booking.user.studentRegNo}` : ''}
                    </p>
                  </Cell>
                  <Cell>
                    <p className="font-semibold">{booking.room?.roomNumber}</p>
                    <p className="mt-0.5 text-xs text-[#8b9790]">{booking.room?.hostel?.name}</p>
                  </Cell>
                  <Cell muted>
                    {formatDate(booking.checkInDate)}
                    <br />
                    to {formatDate(booking.checkOutDate)}
                  </Cell>
                  <Cell>{formatKes(booking.room?.price ?? 0)}</Cell>
                  <Cell>
                    <StatusPill status={payment.status} label={payment.label} />
                    {booking.latestPayment?.mpesaReceiptNo ? (
                      <p className="mt-1 text-[11px] text-[#8b9790]">
                        {booking.latestPayment.mpesaReceiptNo}
                      </p>
                    ) : null}
                  </Cell>
                  <Cell>
                    <StatusPill status={booking.status} />
                  </Cell>
                  <Cell>
                    <div className="flex flex-wrap gap-1.5">
                      {canApprove ? (
                        <button
                          type="button"
                          className={`${primaryButtonClass} !px-3 !py-1.5 !text-xs`}
                          disabled={workingId === booking.id}
                          onClick={() => void approve(booking)}
                        >
                          <Check className="size-3.5" /> Approve
                        </button>
                      ) : null}
                      {canComplete ? (
                        <button
                          type="button"
                          className={`${outlineButtonClass} !px-3 !py-1.5 !text-xs`}
                          onClick={() => {
                            confirmAction.setError(null);
                            setPending({ kind: 'complete', booking });
                          }}
                        >
                          <Flag className="size-3.5" /> Complete
                        </button>
                      ) : null}
                      {canCancel ? (
                        <button
                          type="button"
                          className={`${dangerButtonClass} !px-3 !py-1.5 !text-xs`}
                          onClick={() => {
                            confirmAction.setError(null);
                            setPending({ kind: 'cancel', booking });
                          }}
                        >
                          <X className="size-3.5" /> Cancel
                        </button>
                      ) : null}
                      {!canApprove && booking.status === 'pending' ? (
                        <span className="self-center text-[11px] text-[#8b9790]">
                          Awaiting payment
                        </span>
                      ) : null}
                    </div>
                  </Cell>
                </Row>
              );
            })}
          </DataTable>
        ) : null}
        <Pager pagination={bookings.data?.pagination} onPage={setPage} />
      </div>
      {pending ? (
        <Modal
          title={pending.kind === 'cancel' ? 'Cancel this booking?' : 'Complete this stay?'}
          description={`${pending.booking.user?.fullName ?? 'Student'} · ${pending.booking.room?.hostel?.name ?? ''} ${pending.booking.room?.roomNumber ?? ''}`}
          onClose={() => setPending(null)}
        >
          <div className="space-y-3">
            {pending.kind === 'cancel' ? (
              <p className="text-sm text-[#68726e]">
                The room becomes available again.
                {paidAmount > 0
                  ? ` The student paid ${formatKes(paidAmount)} by M-Pesa. The booking will be flagged so a refund can be arranged.`
                  : ''}
              </p>
            ) : (
              <p className="text-sm text-[#68726e]">
                Use this when the student has checked out. The room becomes available again.
              </p>
            )}
            {confirmAction.error ? <Notice tone="danger">{confirmAction.error}</Notice> : null}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className={outlineButtonClass} onClick={() => setPending(null)}>
              Go back
            </button>
            <button
              type="button"
              className={pending.kind === 'cancel' ? dangerButtonClass : primaryButtonClass}
              disabled={confirmAction.busy}
              onClick={() => void confirm()}
            >
              {confirmAction.busy
                ? 'Working…'
                : pending.kind === 'cancel'
                  ? 'Cancel booking'
                  : 'Mark completed'}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
