import { AppError } from '@/utils/AppError';
import type { CreateBookingInput } from '@/validators/booking.validator';

// TODO(member-4): book an available room for the signed-in student and reject a second active booking for that room.
export async function createBooking(_userId: string, _input: CreateBookingInput): Promise<never> {
  throw new AppError(501, 'Not implemented');
}

// TODO(member-4): list bookings for the signed-in student.
export async function listBookings(_userId: string): Promise<never> {
  throw new AppError(501, 'Not implemented');
}

// TODO(member-4): return one booking when it belongs to the signed-in student.
export async function getBooking(_userId: string, _bookingId: string): Promise<never> {
  throw new AppError(501, 'Not implemented');
}

// TODO(member-4): cancel the student's booking and write a booking.cancel audit entry.
export async function cancelBooking(_userId: string, _bookingId: string): Promise<never> {
  throw new AppError(501, 'Not implemented');
}
