import { cancelBooking, createBooking, getBooking, listBookings } from '@/services/booking.service';
import { AppError } from '@/utils/AppError';
import { sendSuccess } from '@/utils/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import type { CreateBookingInput } from '@/validators/booking.validator';
import type { IdParams } from '@/validators/common';

export const postBooking = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const body = req.validated?.body as CreateBookingInput;
  const booking = await createBooking(req.user.id, body);

  sendSuccess(res, booking, 201);
});

export const getBookings = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const bookings = await listBookings(req.user.id);

  sendSuccess(res, bookings);
});

export const getBookingById = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const params = req.validated?.params as IdParams;
  const booking = await getBooking(req.user.id, params.id);

  sendSuccess(res, booking);
});

export const cancelOwnBooking = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const params = req.validated?.params as IdParams;
  const booking = await cancelBooking(req.user.id, params.id);

  sendSuccess(res, booking);
});
