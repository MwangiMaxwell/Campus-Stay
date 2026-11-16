import { Booking, Room } from '@/models';
import { AppError } from '@/utils/AppError';
import { recordAudit } from '@/services/audit.service';
import type { CreateBookingInput } from '@/validators/booking.validator';

async function hasActiveBooking(roomId: string): Promise<boolean> {
  const pending = await Booking.exists({ room: roomId, status: 'pending' });

  if (pending) return true;

  const approved = await Booking.exists({ room: roomId, status: 'approved' });

  return Boolean(approved);
}

// Create a booking for an available room.
export async function createBooking(userId: string, input: CreateBookingInput) {
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

  // Atomically claim the room so two students cannot book it simultaneously.
  const claimedRoom = await Room.findOneAndUpdate(
    {
      _id: input.roomId,
      availabilityStatus: 'available',
    },
    {
      $set: { availabilityStatus: 'booked' },
    },
    { new: true },
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

  return Booking.findById(booking._id)
    .populate({
      path: 'room',
      select: 'roomNumber roomType price capacity availabilityStatus hostel',
      populate: {
        path: 'hostel',
        select: 'name location',
      },
    })
    .lean();
}

// List the signed-in student's bookings.
export async function listBookings(userId: string) {
  return Booking.find({ user: userId })
    .populate({
      path: 'room',
      select: 'roomNumber roomType price capacity availabilityStatus hostel',
      populate: {
        path: 'hostel',
        select: 'name location',
      },
    })
    .sort({ createdAt: -1 })
    .lean();
}

// Retrieve one booking belonging to the signed-in student.
export async function getBooking(userId: string, bookingId: string) {
  const booking = await Booking.findOne({
    _id: bookingId,
    user: userId,
  })
    .populate({
      path: 'room',
      select: 'roomNumber roomType price capacity availabilityStatus hostel',
      populate: {
        path: 'hostel',
        select: 'name location',
      },
    })
    .lean();

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  return booking;
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

  const cancelledBooking = await Booking.findOneAndUpdate(
    {
      _id: bookingId,
      user: userId,
      status: 'pending',
    },
    {
      $set: { status: 'cancelled' },
    },
    { new: true },
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

  return cancelledBooking;
}
