'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  Field,
  Modal,
  Notice,
  fieldClass,
  outlineButtonClass,
  primaryButtonClass,
} from '@/components/campus/campus-ui';
import {
  addDays,
  dateInputValue,
  formatDate,
  formatKes,
  labelRoomType,
} from '@/components/campus/format';
import { useAction } from '@/hooks/useApi';
import { apiRequest } from '@/lib/api';
import type { Booking, RoomSummary } from '@/types';

const MAX_STAY_DAYS = 366;
const DAY_MS = 24 * 60 * 60 * 1000;

function stayProblem(checkIn: string, checkOut: string): string | null {
  if (!checkIn || !checkOut) return 'Choose both dates.';
  if (checkIn < dateInputValue(0)) return 'Check-in cannot be in the past.';
  if (checkOut <= checkIn) return 'Check-out must be after check-in.';
  const days = (Date.parse(checkOut) - Date.parse(checkIn)) / DAY_MS;
  if (days > MAX_STAY_DAYS) return 'A booking cannot be longer than one year.';
  return null;
}

export function BookRoomModal({
  room,
  onClose,
  onBooked,
  onPay,
}: {
  room: RoomSummary;
  onClose: () => void;
  onBooked: () => void;
  onPay: (booking: Booking) => void;
}) {
  const [checkIn, setCheckIn] = useState(() => dateInputValue(7));
  const [checkOut, setCheckOut] = useState(() => dateInputValue(7 + 120));
  const [created, setCreated] = useState<Booking | null>(null);
  const { busy, error, run } = useAction();
  const problem = stayProblem(checkIn, checkOut);
  const days = problem ? 0 : Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / DAY_MS);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (problem) return;
    const booking = await run(() =>
      apiRequest<Booking>('/api/v1/bookings', {
        method: 'POST',
        body: JSON.stringify({ roomId: room.id, checkInDate: checkIn, checkOutDate: checkOut }),
      }),
    );
    if (booking) {
      setCreated(booking);
      onBooked();
    }
  }

  if (created) {
    return (
      <Modal title="Room reserved" onClose={onClose}>
        <div className="flex flex-col items-center text-center">
          <span className="grid size-12 place-items-center rounded-full bg-[#e9f1e6] text-[#467065]">
            <CheckCircle2 className="size-6" />
          </span>
          <p className="mt-4 text-sm font-semibold">
            {room.hostel.name} {room.roomNumber} is held for you.
          </p>
          <p className="mt-1 text-sm text-[#7c8882]">
            Pay the booking fee of {formatKes(room.price)} with M-Pesa so staff can approve your
            booking. Unpaid reservations are released after 24 hours.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" className={outlineButtonClass} onClick={onClose}>
            Pay later
          </button>
          <button type="button" className={primaryButtonClass} onClick={() => onPay(created)}>
            Pay {formatKes(room.price)} now
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={`Book ${room.hostel.name} ${room.roomNumber}`}
      description={`${labelRoomType(room.roomType)} room · sleeps ${room.capacity} · ${room.hostel.location}`}
      onClose={onClose}
    >
      <form onSubmit={(event) => void submit(event)} className="space-y-4" noValidate>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Check-in">
            <input
              type="date"
              required
              min={dateInputValue(0)}
              value={checkIn}
              onChange={(event) => {
                setCheckIn(event.target.value);
                if (event.target.value && checkOut <= event.target.value) {
                  setCheckOut(addDays(event.target.value, 120));
                }
              }}
              className={fieldClass}
            />
          </Field>
          <Field label="Check-out">
            <input
              type="date"
              required
              min={checkIn ? addDays(checkIn, 1) : undefined}
              value={checkOut}
              onChange={(event) => setCheckOut(event.target.value)}
              className={fieldClass}
            />
          </Field>
        </div>
        {problem ? (
          <p className="text-xs text-[#a05d55]">{problem}</p>
        ) : (
          <p className="text-xs text-[#7c8882]">
            {formatDate(checkIn)} to {formatDate(checkOut)} · {days} days
          </p>
        )}
        <div className="rounded-xl bg-[#f1efe9] px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[#68726e]">Booking fee</span>
            <span className="font-semibold">{formatKes(room.price)}</span>
          </div>
          <p className="mt-1 text-xs text-[#8b9790]">
            Paid with M-Pesa after you reserve. The amount is set by the room, not by this form.
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className={outlineButtonClass} onClick={onClose}>
            Not now
          </button>
          <button type="submit" className={primaryButtonClass} disabled={busy || Boolean(problem)}>
            {busy ? 'Reserving…' : 'Reserve room'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
