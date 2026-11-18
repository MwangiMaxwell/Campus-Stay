import mongoose from 'mongoose';
import { Booking, Payment, Room } from '@/models';
import { AppError } from '@/utils/AppError';
import { recordAudit } from '@/services/audit.service';
import { initiateStkPush } from '@/services/mpesa.service';
import { withId } from '@/utils/withId';
import type { CreatePaymentInput } from '@/validators/payment.validator';

// An STK prompt expires within about a minute. A payment still pending after this long
// never received a callback, so it is closed to let the student try again.
export const PENDING_PAYMENT_TIMEOUT_MS = 5 * 60 * 1000;

export async function expireStalePayments(bookingId?: unknown, now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - PENDING_PAYMENT_TIMEOUT_MS);
  const stale = await Payment.find({
    ...(bookingId ? { booking: bookingId } : {}),
    status: 'pending',
    createdAt: mongoose.trusted({ $lt: cutoff }),
  })
    .select('_id booking')
    .lean();

  let closed = 0;
  for (const payment of stale) {
    const updated = await Payment.findOneAndUpdate(
      { _id: payment._id, status: 'pending' },
      { $set: { status: 'failed' } },
      { returnDocument: 'after' },
    );
    if (!updated) continue;
    closed += 1;
    await recordAudit({
      action: 'payment.failure',
      targetType: 'payment',
      targetId: String(payment._id),
      meta: { reason: 'No confirmation received from M-Pesa in time' },
    });
  }
  return closed;
}

// Create a payment using the price stored in the database.
export async function createPayment(userId: string, input: CreatePaymentInput) {
  const booking = await Booking.findOne({
    _id: input.bookingId,
    user: userId,
  }).lean();

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  if (booking.status !== 'pending') {
    throw new AppError(409, 'Only pending bookings can be paid for');
  }

  const room = await Room.findById(booking.room).lean();

  if (!room) {
    throw new AppError(404, 'The room associated with this booking was not found');
  }

  const amount = Math.round(room.price);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError(400, 'The room has an invalid payment amount');
  }

  await expireStalePayments(booking._id);

  const existingPayment = await Payment.findOne({
    booking: booking._id,
    status: mongoose.trusted({ $in: ['pending', 'success'] }),
  }).lean();

  if (existingPayment?.status === 'success') {
    throw new AppError(409, 'This booking has already been paid for');
  }

  if (existingPayment?.status === 'pending') {
    throw new AppError(409, 'A payment for this booking is already pending');
  }

  // The amount comes from Room.price, never from the frontend.
  const result = await initiateStkPush(userId, input, amount);
  return { ...result, payment: withId(result.payment.toObject()) };
}

// List payments belonging to the signed-in student.
export async function listPayments(userId: string) {
  const bookings = await Booking.find({ user: userId }).select('_id').lean();

  const bookingIds = bookings.map((booking) => booking._id);

  const payments = await Payment.find({
    booking: mongoose.trusted({ $in: bookingIds }),
  })
    .populate({
      path: 'booking',
      populate: {
        path: 'room',
        select: 'roomNumber roomType price hostel',
        populate: { path: 'hostel', select: 'name location' },
      },
    })
    .sort({ createdAt: -1 })
    .lean();

  return payments.map(withId);
}

// Retrieve one payment only if its booking belongs to the student.
export async function getPayment(userId: string, paymentId: string) {
  const bookings = await Booking.find({ user: userId }).select('_id').lean();

  const bookingIds = bookings.map((booking) => booking._id);

  const payment = await Payment.findOne({
    _id: paymentId,
    booking: mongoose.trusted({ $in: bookingIds }),
  })
    .populate({
      path: 'booking',
      populate: {
        path: 'room',
        select: 'roomNumber roomType price hostel',
        populate: { path: 'hostel', select: 'name location' },
      },
    })
    .lean();

  if (!payment) {
    throw new AppError(404, 'Payment not found');
  }

  return withId(payment);
}
