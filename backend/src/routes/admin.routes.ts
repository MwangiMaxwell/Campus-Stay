import { Router } from 'express';
import {
  approveBooking,
  cancelAdminBooking,
  createRoom,
  createUser,
  deleteRoom,
  deleteUser,
  getAdminPayment,
  getAdminRoom,
  getBookingsReport,
  getOccupancyReport,
  getPaymentsReport,
  getUser,
  listAdminBookings,
  listAdminPayments,
  listAdminRooms,
  listUsers,
  updateRoom,
  updateUser,
} from '@/controllers/admin.controller';
import { authenticate } from '@/middleware/authenticate';
import { requireRole } from '@/middleware/requireRole';
import { validate } from '@/middleware/validate';
import {
  adminCreateUserSchema,
  adminListQuerySchema,
  adminRoomSchema,
  adminUpdateRoomSchema,
  adminUpdateUserSchema,
  bookingsReportQuerySchema,
  occupancyReportQuerySchema,
  paymentsReportQuerySchema,
} from '@/validators/admin.validator';
import { idParamsSchema } from '@/validators/common';

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole('admin', 'super_admin'));

adminRouter.get('/users', validate({ query: adminListQuerySchema }), listUsers);
adminRouter.post(
  '/users',
  requireRole('super_admin'),
  validate({ body: adminCreateUserSchema }),
  createUser,
);
adminRouter.get('/users/:id', validate({ params: idParamsSchema }), getUser);
adminRouter.patch(
  '/users/:id',
  requireRole('super_admin'),
  validate({ params: idParamsSchema, body: adminUpdateUserSchema }),
  updateUser,
);
adminRouter.delete(
  '/users/:id',
  requireRole('super_admin'),
  validate({ params: idParamsSchema }),
  deleteUser,
);

adminRouter.get('/rooms', validate({ query: adminListQuerySchema }), listAdminRooms);
adminRouter.post('/rooms', validate({ body: adminRoomSchema }), createRoom);
adminRouter.get('/rooms/:id', validate({ params: idParamsSchema }), getAdminRoom);
adminRouter.patch(
  '/rooms/:id',
  validate({ params: idParamsSchema, body: adminUpdateRoomSchema }),
  updateRoom,
);
adminRouter.delete('/rooms/:id', validate({ params: idParamsSchema }), deleteRoom);

adminRouter.get('/bookings', listAdminBookings);
adminRouter.patch('/bookings/:id/approve', validate({ params: idParamsSchema }), approveBooking);
adminRouter.patch('/bookings/:id/cancel', validate({ params: idParamsSchema }), cancelAdminBooking);

adminRouter.get('/payments', listAdminPayments);
adminRouter.get('/payments/:id', validate({ params: idParamsSchema }), getAdminPayment);

adminRouter.get(
  '/reports/bookings',
  validate({ query: bookingsReportQuerySchema }),
  getBookingsReport,
);
adminRouter.get(
  '/reports/payments',
  validate({ query: paymentsReportQuerySchema }),
  getPaymentsReport,
);
adminRouter.get(
  '/reports/occupancy',
  validate({ query: occupancyReportQuerySchema }),
  getOccupancyReport,
);
