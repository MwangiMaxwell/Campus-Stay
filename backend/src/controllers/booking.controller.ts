import { cancelBooking, createBooking, getBooking, listBookings } from '@/services/booking.service';
import { AppError } from '@/utils/AppError';
import { asyncHandler } from '@/utils/asyncHandler';
import type { CreateBookingInput } from '@/validators/booking.validator';
import type { IdParams } from '@/validators/common';

export const postBooking = asyncHandler(async (req) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }
  const body = req.validated?.body as CreateBookingInput;
  await createBooking(req.user.id, body);
});

export const getBookings = asyncHandler(async (req) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }
  await listBookings(req.user.id);
});

export const getBookingById = asyncHandler(async (req) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }
  const params = req.validated?.params as IdParams;
  await getBooking(req.user.id, params.id);
});

export const cancelOwnBooking = asyncHandler(async (req) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }
  const params = req.validated?.params as IdParams;
  await cancelBooking(req.user.id, params.id);
});
