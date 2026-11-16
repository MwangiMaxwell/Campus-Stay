import mongoose from 'mongoose';
import { Booking, Payment, Room } from '@/models';
import { AppError } from '@/utils/AppError';
import { initiateStkPush } from '@/services/mpesa.service';
import type { CreatePaymentInput } from '@/validators/payment.validator';

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
  return initiateStkPush(userId, input, amount);
}

// List payments belonging to the signed-in student.
export async function listPayments(userId: string) {
  const bookings = await Booking.find({ user: userId }).select('_id').lean();

  const bookingIds = bookings.map((booking) => booking._id);

  return Payment.find({
    booking: mongoose.trusted({ $in: bookingIds }),
  })
    .populate({
      path: 'booking',
      populate: {
        path: 'room',
        select: 'roomNumber roomType price',
      },
    })
    .sort({ createdAt: -1 })
    .lean();
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
        select: 'roomNumber roomType price',
      },
    })
    .lean();

  if (!payment) {
    throw new AppError(404, 'Payment not found');
  }

  return payment;
}
