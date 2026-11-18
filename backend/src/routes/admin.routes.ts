import { Router } from 'express';
import {
  approveBooking,
  cancelAdminBooking,
  completeAdminBooking,
  createHostel,
  createRoom,
  createUser,
  deleteRoom,
  deleteUser,
  getAdminPayment,
  getAdminRoom,
  getBookingsReport,
  getDashboard,
  getOccupancyReport,
  getPaymentsReport,
  getUser,
  listAdminBookings,
  listAdminPayments,
  listAdminRooms,
  listAuditLogs,
  listUsers,
  updateHostel,
  updateRoom,
  updateUser,
} from '@/controllers/admin.controller';
import { authenticate } from '@/middleware/authenticate';
import { requireRole } from '@/middleware/requireRole';
import { validate } from '@/middleware/validate';
import {
  adminBookingListQuerySchema,
  adminCreateUserSchema,
  adminHostelSchema,
  adminListQuerySchema,
  adminPaymentListQuerySchema,
  adminRoomListQuerySchema,
  adminRoomSchema,
  adminUpdateHostelSchema,
  adminUpdateRoomSchema,
  adminUpdateUserSchema,
  auditLogListQuerySchema,
  bookingsReportQuerySchema,
  occupancyReportQuerySchema,
  paymentsReportQuerySchema,
} from '@/validators/admin.validator';
import { idParamsSchema } from '@/validators/common';

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole('admin', 'super_admin'));

adminRouter.get('/dashboard', getDashboard);

// Admins manage student accounts. The controller limits staff accounts to super admins.
adminRouter.get('/users', validate({ query: adminListQuerySchema }), listUsers);
adminRouter.post('/users', validate({ body: adminCreateUserSchema }), createUser);
adminRouter.get('/users/:id', validate({ params: idParamsSchema }), getUser);
adminRouter.patch(
  '/users/:id',
  validate({ params: idParamsSchema, body: adminUpdateUserSchema }),
  updateUser,
);
adminRouter.delete('/users/:id', validate({ params: idParamsSchema }), deleteUser);

adminRouter.post('/hostels', validate({ body: adminHostelSchema }), createHostel);
adminRouter.patch(
  '/hostels/:id',
  validate({ params: idParamsSchema, body: adminUpdateHostelSchema }),
  updateHostel,
);

adminRouter.get('/rooms', validate({ query: adminRoomListQuerySchema }), listAdminRooms);
adminRouter.post('/rooms', validate({ body: adminRoomSchema }), createRoom);
adminRouter.get('/rooms/:id', validate({ params: idParamsSchema }), getAdminRoom);
adminRouter.patch(
  '/rooms/:id',
  validate({ params: idParamsSchema, body: adminUpdateRoomSchema }),
  updateRoom,
);
adminRouter.delete('/rooms/:id', validate({ params: idParamsSchema }), deleteRoom);

adminRouter.get('/bookings', validate({ query: adminBookingListQuerySchema }), listAdminBookings);
adminRouter.patch('/bookings/:id/approve', validate({ params: idParamsSchema }), approveBooking);
adminRouter.patch('/bookings/:id/cancel', validate({ params: idParamsSchema }), cancelAdminBooking);
adminRouter.patch(
  '/bookings/:id/complete',
  validate({ params: idParamsSchema }),
  completeAdminBooking,
);

adminRouter.get('/payments', validate({ query: adminPaymentListQuerySchema }), listAdminPayments);
adminRouter.get('/payments/:id', validate({ params: idParamsSchema }), getAdminPayment);

adminRouter.get('/audit-logs', validate({ query: auditLogListQuerySchema }), listAuditLogs);

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
