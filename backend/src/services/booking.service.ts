import mongoose from 'mongoose';
import { env } from '@/config/env';
import { Booking, Payment, Room } from '@/models';
import { AppError } from '@/utils/AppError';
import { withId } from '@/utils/withId';
import { recordAudit } from '@/services/audit.service';
import type { CreateBookingInput } from '@/validators/booking.validator';

const MAX_STAY_DAYS = 366;
const DAY_MS = 24 * 60 * 60 * 1000;

const roomPopulate = {
  path: 'room',
  select: 'roomNumber roomType price capacity availabilityStatus hostel',
  populate: {
    path: 'hostel',
    select: 'name location',
  },
};

async function hasActiveBooking(roomId: string): Promise<boolean> {
  const pending = await Booking.exists({ room: roomId, status: 'pending' });

  if (pending) return true;

  const approved = await Booking.exists({ room: roomId, status: 'approved' });

  return Boolean(approved);
}

function startOfTodayUtc(now = new Date()): number {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function assertValidStay(checkInDate: string, checkOutDate: string): void {
  const checkIn = Date.parse(checkInDate);
  const checkOut = Date.parse(checkOutDate);

  if (checkIn < startOfTodayUtc()) {
    throw new AppError(400, 'Check-in cannot be in the past');
  }

  if ((checkOut - checkIn) / DAY_MS > MAX_STAY_DAYS) {
    throw new AppError(400, 'A booking cannot be longer than one year');
  }
}

// Attach the newest payment so the student can see whether the fee is settled.
async function withLatestPayment<T extends { _id: unknown }>(bookings: T[]) {
  if (bookings.length === 0) return [];

  const payments = await Payment.find({
    booking: mongoose.trusted({
      $in: bookings.map((booking) => booking._id as mongoose.Types.ObjectId),
    }),
  })
    .select('booking status amount mpesaReceiptNo paymentDate createdAt')
    .sort({ createdAt: -1 })
    .lean<
      {
        booking: mongoose.Types.ObjectId;
        status: string;
        amount: number;
        mpesaReceiptNo?: string | null;
        paymentDate?: Date | null;
        createdAt: Date;
      }[]
    >();

  return bookings.map((booking) => ({
    ...withId(booking),
    latestPayment:
      payments.find((payment) => String(payment.booking) === String(booking._id)) ?? null,
  }));
}

// Release unpaid pending bookings and close finished stays. Safe to run repeatedly.
export async function runBookingMaintenance(now = new Date()): Promise<{
  expired: number;
  completed: number;
}> {
  const cutoff = new Date(now.getTime() - env.BOOKING_HOLD_HOURS * 60 * 60 * 1000);

  const stale = await Booking.find({
    status: 'pending',
    createdAt: mongoose.trusted({ $lt: cutoff }),
  })
    .select('_id room')
    .lean();

  let expired = 0;
  for (const booking of stale) {
    const settled = await Payment.exists({
      booking: booking._id,
      status: mongoose.trusted({ $in: ['pending', 'success'] }),
    });
    if (settled) continue;

    const updated = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'pending' },
      { $set: { status: 'cancelled' } },
      { returnDocument: 'after' },
    );
    if (!updated) continue;

    await Room.updateOne(
      { _id: booking.room, availabilityStatus: 'booked' },
      { $set: { availabilityStatus: 'available' } },
    );
    await recordAudit({
      action: 'booking.expire',
      targetType: 'booking',
      targetId: String(booking._id),
      meta: { roomId: String(booking.room), holdHours: env.BOOKING_HOLD_HOURS },
    });
    expired += 1;
  }

  const finished = await Booking.find({
    status: 'approved',
    checkOutDate: mongoose.trusted({ $lt: new Date(startOfTodayUtc(now)) }),
  })
    .select('_id room')
    .lean();

  let completed = 0;
  for (const booking of finished) {
    const updated = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'approved' },
      { $set: { status: 'completed' } },
      { returnDocument: 'after' },
    );
    if (!updated) continue;

    await Room.updateOne(
      { _id: booking.room, availabilityStatus: 'booked' },
      { $set: { availabilityStatus: 'available' } },
    );
    await recordAudit({
      action: 'booking.complete',
      targetType: 'booking',
      targetId: String(booking._id),
      meta: { roomId: String(booking.room), automatic: true },
    });
    completed += 1;
  }

  return { expired, completed };
}

// Create a booking for an available room.
export async function createBooking(userId: string, input: CreateBookingInput) {
  // Free rooms held by unpaid bookings before checking availability.
  await runBookingMaintenance();

  const room = await Room.findById(input.roomId);

  if (!room) {
    throw new AppError(404, 'Room not found');
  }

  if (room.availabilityStatus === 'maintenance') {
    throw new AppError(409, 'This room is under maintenance');
  }

  if (room.availabilityStatus !== 'available') {
    throw new AppError(409, 'This room is not available');
  }

  assertValidStay(input.checkInDate, input.checkOutDate);

  const existing = await Booking.exists({
    user: userId,
    status: mongoose.trusted({ $in: ['pending', 'approved'] }),
  });

  if (existing) {
    throw new AppError(
      409,
      'You already have an active booking. Cancel it or wait until it is completed before booking another room.',
    );
  }

  // Atomically claim the room so two students cannot book it simultaneously.
  const claimedRoom = await Room.findOneAndUpdate(
    {
      _id: input.roomId,
      availabilityStatus: 'available',
    },
    {
      $set: { availabilityStatus: 'booked' },
    },
    { returnDocument: 'after' },
  );

  if (!claimedRoom) {
    throw new AppError(409, 'This room is no longer available');
  }

  let booking;

  try {
    booking = await Booking.create({
      user: userId,
      room: input.roomId,
      bookingDate: new Date(),
      checkInDate: new Date(input.checkInDate),
      checkOutDate: new Date(input.checkOutDate),
      status: 'pending',
    });
  } catch (error) {
    // Restore availability if booking creation failed and no active
    // booking exists for this room.
    if (!(await hasActiveBooking(input.roomId))) {
      await Room.updateOne(
        { _id: input.roomId, availabilityStatus: 'booked' },
        { $set: { availabilityStatus: 'available' } },
      );
    }

    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      throw new AppError(409, 'This room already has an active booking');
    }

    throw error;
  }

  await recordAudit({
    userId,
    action: 'booking.create',
    targetType: 'booking',
    targetId: String(booking._id),
    meta: {
      roomId: input.roomId,
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
    },
  });

  const created = await Booking.findById(booking._id).populate(roomPopulate).lean();

  return created ? withId(created) : created;
}

// List the signed-in student's bookings.
export async function listBookings(userId: string) {
  const bookings = await Booking.find({ user: userId })
    .populate(roomPopulate)
    .sort({ createdAt: -1 })
    .lean();

  return withLatestPayment(bookings);
}

// Retrieve one booking belonging to the signed-in student.
export async function getBooking(userId: string, bookingId: string) {
  const booking = await Booking.findOne({
    _id: bookingId,
    user: userId,
  })
    .populate(roomPopulate)
    .lean();

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  const [result] = await withLatestPayment([booking]);

  return result;
}

// Cancel a pending booking belonging to the signed-in student.
export async function cancelBooking(userId: string, bookingId: string) {
  const booking = await Booking.findOne({
    _id: bookingId,
    user: userId,
  });

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  if (booking.status !== 'pending') {
    throw new AppError(
      409,
      'Only pending bookings can be cancelled by the student. Contact an administrator for assistance with an approved booking.',
    );
  }

  const paid = await Payment.exists({ booking: booking._id, status: 'success' });

  if (paid) {
    throw new AppError(
      409,
      'This booking is already paid. Contact an administrator to cancel it and arrange a refund.',
    );
  }

  const cancelledBooking = await Booking.findOneAndUpdate(
    {
      _id: bookingId,
      user: userId,
      status: 'pending',
    },
    {
      $set: { status: 'cancelled' },
    },
    { returnDocument: 'after' },
  );

  if (!cancelledBooking) {
    throw new AppError(409, 'This booking can no longer be cancelled');
  }

  const anotherActiveBooking = await hasActiveBooking(String(booking.room));

  if (!anotherActiveBooking) {
    await Room.updateOne(
      {
        _id: booking.room,
        availabilityStatus: 'booked',
      },
      {
        $set: { availabilityStatus: 'available' },
      },
    );
  }

  await recordAudit({
    userId,
    action: 'booking.cancel',
    targetType: 'booking',
    targetId: bookingId,
    meta: {
      roomId: String(booking.room),
    },
  });

  return withId(cancelledBooking.toObject());
}
