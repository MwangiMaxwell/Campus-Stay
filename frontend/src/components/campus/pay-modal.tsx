'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Smartphone, XCircle } from 'lucide-react';
import {
  Field,
  Modal,
  Notice,
  fieldClass,
  outlineButtonClass,
  primaryButtonClass,
} from '@/components/campus/campus-ui';
import { formatKes } from '@/components/campus/format';
import { useAction } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';
import type { Booking, Payment } from '@/types';

const POLL_MS = 2500;
const GIVE_UP_MS = 2 * 60 * 1000;
const PHONE_PATTERN = /^\+?[0-9]{10,15}$/;

interface StartedPayment {
  payment: Payment;
  message?: string;
}

export function PayModal({
  booking,
  onClose,
  onFinished,
}: {
  booking: Booking;
  onClose: () => void;
  onFinished: () => void;
}) {
  const { user } = useAuth();
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [started, setStarted] = useState<StartedPayment | null>(null);
  const [outcome, setOutcome] = useState<Payment | null>(null);
  const [gaveUp, setGaveUp] = useState(false);
  const { busy, error, run } = useAction();
  const fee = booking.room?.price ?? 0;
  const roomName = booking.room
    ? `${booking.room.hostel?.name ?? ''} ${booking.room.roomNumber}`.trim()
    : 'your room';
  const phoneValid = PHONE_PATTERN.test(phone.trim());
  const paymentId = started?.payment.id ?? null;

  // Ask the server for the payment status until M-Pesa has answered.
  useEffect(() => {
    if (!paymentId || outcome) return;

    let cancelled = false;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      apiRequest<Payment>(`/api/v1/payments/${paymentId}`)
        .then((payment) => {
          if (cancelled) return;
          if (payment.status !== 'pending') {
            setOutcome(payment);
            onFinished();
          } else if (Date.now() - startedAt > GIVE_UP_MS) {
            setGaveUp(true);
          }
        })
        .catch(() => undefined);
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [paymentId, outcome, onFinished]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!phoneValid) return;
    const result = await run(() =>
      apiRequest<StartedPayment>('/api/v1/payments', {
        method: 'POST',
        body: JSON.stringify({ bookingId: booking.id, phoneNumber: phone.trim() }),
      }),
    );
    if (result) {
      setStarted(result);
      setOutcome(null);
      setGaveUp(false);
      onFinished();
    }
  }

  if (outcome?.status === 'success') {
    return (
      <Modal title="Payment received" onClose={onClose}>
        <div className="flex flex-col items-center text-center">
          <span className="grid size-12 place-items-center rounded-full bg-[#e9f1e6] text-[#467065]">
            <CheckCircle2 className="size-6" />
          </span>
          <p className="mt-4 text-sm font-semibold">
            {formatKes(outcome.amount)} paid for {roomName}
          </p>
          {outcome.mpesaReceiptNo ? (
            <p className="mt-1 text-sm text-[#7c8882]">
              M-Pesa receipt <span className="font-semibold">{outcome.mpesaReceiptNo}</span>
            </p>
          ) : null}
          <p className="mt-3 text-sm text-[#7c8882]">
            Staff will review and approve your booking. You can follow its status on your bookings
            page.
          </p>
        </div>
        <div className="mt-6 flex justify-end">
          <button type="button" className={primaryButtonClass} onClick={onClose}>
            Done
          </button>
        </div>
      </Modal>
    );
  }

  if (outcome?.status === 'failed') {
    return (
      <Modal title="Payment not completed" onClose={onClose}>
        <div className="flex flex-col items-center text-center">
          <span className="grid size-12 place-items-center rounded-full bg-[#f2e3e0] text-[#a05d55]">
            <XCircle className="size-6" />
          </span>
          <p className="mt-4 text-sm font-semibold">The M-Pesa prompt was cancelled or failed.</p>
          <p className="mt-1 text-sm text-[#7c8882]">
            You have not been charged. Your room is still held, so you can try again.
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={outlineButtonClass} onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className={primaryButtonClass}
            onClick={() => {
              setStarted(null);
              setOutcome(null);
            }}
          >
            Try again
          </button>
        </div>
      </Modal>
    );
  }

  if (started) {
    return (
      <Modal title="Check your phone" onClose={onClose}>
        <div className="flex flex-col items-center text-center">
          <span className="grid size-12 animate-pulse place-items-center rounded-full bg-[#e9f1e6] text-[#467065]">
            <Smartphone className="size-6" />
          </span>
          <p className="mt-4 text-sm font-semibold">
            Enter your M-Pesa PIN to pay {formatKes(started.payment.amount)}
          </p>
          <p className="mt-1 text-sm text-[#7c8882]">
            {started.message ?? 'A payment prompt was sent to your phone.'}
          </p>
          <p role="status" className="mt-4 text-xs text-[#8b9790]">
            {gaveUp
              ? 'This is taking longer than usual. You can close this window. Your booking will update when M-Pesa confirms.'
              : 'Waiting for confirmation…'}
          </p>
        </div>
        <div className="mt-6 flex justify-end">
          <button type="button" className={outlineButtonClass} onClick={onClose}>
            Close
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Pay the booking fee"
      description={`${roomName} · ${formatKes(fee)} via M-Pesa`}
      onClose={onClose}
    >
      <form onSubmit={(event) => void submit(event)} className="space-y-4" noValidate>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Field
          label="M-Pesa phone number"
          hint="You will get a prompt on this phone to enter your PIN."
          error={
            phone && !phoneValid ? 'Enter 10 to 15 digits. A leading + is optional.' : undefined
          }
        >
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className={fieldClass}
          />
        </Field>
        <div className="flex justify-end gap-2">
          <button type="button" className={outlineButtonClass} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={primaryButtonClass} disabled={busy || !phoneValid}>
            {busy ? 'Sending prompt…' : `Pay ${formatKes(fee)}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
