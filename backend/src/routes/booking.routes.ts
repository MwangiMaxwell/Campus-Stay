import { Router } from 'express';
import {
  cancelOwnBooking,
  getBookingById,
  getBookings,
  postBooking,
} from '@/controllers/booking.controller';
import { authenticate } from '@/middleware/authenticate';
import { requireRole } from '@/middleware/requireRole';
import { validate } from '@/middleware/validate';
import { createBookingSchema } from '@/validators/booking.validator';
import { idParamsSchema } from '@/validators/common';

export const bookingRouter = Router();

bookingRouter.use(authenticate, requireRole('student'));
bookingRouter.post('/', validate({ body: createBookingSchema }), postBooking);
bookingRouter.get('/', getBookings);
bookingRouter.get('/:id', validate({ params: idParamsSchema }), getBookingById);
bookingRouter.patch('/:id/cancel', validate({ params: idParamsSchema }), cancelOwnBooking);
