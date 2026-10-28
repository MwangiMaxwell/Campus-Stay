import { AppError } from '@/utils/AppError';
import { asyncHandler } from '@/utils/asyncHandler';
import type {
  AdminCreateUserInput,
  AdminRoomInput,
  AdminUpdateRoomInput,
  AdminUpdateUserInput,
} from '@/validators/admin.validator';
import type { IdParams } from '@/validators/common';
import { bookingsReport, occupancyReport, paymentsReport } from '@/services/report.service';

function requireUser(req: { user?: { id: string } }): string {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }
  return req.user.id;
}

// TODO(member-4): list users with filters and pagination. Never return passwordHash.
export const listUsers = asyncHandler(async (req) => {
  requireUser(req);
  void req.validated?.query;
  throw new AppError(501, 'Not implemented');
});

// TODO(member-4): create a user, hash the password with bcrypt cost 12, and write an admin.user.create audit entry.
export const createUser = asyncHandler(async (req) => {
  requireUser(req);
  const _body = req.validated?.body as AdminCreateUserInput;
  void _body;
  throw new AppError(501, 'Not implemented');
});

// TODO(member-4): return one user without passwordHash.
export const getUser = asyncHandler(async (req) => {
  requireUser(req);
  const _params = req.validated?.params as IdParams;
  void _params;
  throw new AppError(501, 'Not implemented');
});

// TODO(member-4): update a user and write an admin.user.update audit entry. Only a super admin may assign super_admin.
export const updateUser = asyncHandler(async (req) => {
  requireUser(req);
  const _body = req.validated?.body as AdminUpdateUserInput;
  void _body;
  throw new AppError(501, 'Not implemented');
});

// TODO(member-4): delete or suspend a user and write an admin.user.delete audit entry.
export const deleteUser = asyncHandler(async (req) => {
  requireUser(req);
  const _params = req.validated?.params as IdParams;
  void _params;
  throw new AppError(501, 'Not implemented');
});

// TODO(member-4): list rooms for administrators.
export const listAdminRooms = asyncHandler(async (req) => {
  requireUser(req);
  void req.validated?.query;
  throw new AppError(501, 'Not implemented');
});

// TODO(member-4): create a room and write an admin.room.create audit entry.
export const createRoom = asyncHandler(async (req) => {
  requireUser(req);
  const _body = req.validated?.body as AdminRoomInput;
  void _body;
  throw new AppError(501, 'Not implemented');
});

// TODO(member-4): return one room for administrators.
export const getAdminRoom = asyncHandler(async (req) => {
  requireUser(req);
  const _params = req.validated?.params as IdParams;
  void _params;
  throw new AppError(501, 'Not implemented');
});

// TODO(member-4): update a room and write an admin.room.update audit entry.
export const updateRoom = asyncHandler(async (req) => {
  requireUser(req);
  const _body = req.validated?.body as AdminUpdateRoomInput;
  void _body;
  throw new AppError(501, 'Not implemented');
});

// TODO(member-4): delete a room and write an admin.room.delete audit entry.
export const deleteRoom = asyncHandler(async (req) => {
  requireUser(req);
  const _params = req.validated?.params as IdParams;
  void _params;
  throw new AppError(501, 'Not implemented');
});

// TODO(member-4): list bookings for administrators.
export const listAdminBookings = asyncHandler(async (req) => {
  requireUser(req);
  throw new AppError(501, 'Not implemented');
});

// TODO(member-4): approve a pending booking and write a booking.approve audit entry.
export const approveBooking = asyncHandler(async (req) => {
  requireUser(req);
  const _params = req.validated?.params as IdParams;
  void _params;
  throw new AppError(501, 'Not implemented');
});

// TODO(member-4): cancel a booking and write a booking.cancel audit entry.
export const cancelAdminBooking = asyncHandler(async (req) => {
  requireUser(req);
  const _params = req.validated?.params as IdParams;
  void _params;
  throw new AppError(501, 'Not implemented');
});

// TODO(member-4): list payments for administrators.
export const listAdminPayments = asyncHandler(async (req) => {
  requireUser(req);
  throw new AppError(501, 'Not implemented');
});

// TODO(member-4): return one payment for administrators.
export const getAdminPayment = asyncHandler(async (req) => {
  requireUser(req);
  const _params = req.validated?.params as IdParams;
  void _params;
  throw new AppError(501, 'Not implemented');
});

export const getBookingsReport = asyncHandler(async (req) => {
  requireUser(req);
  void req.validated?.query;
  await bookingsReport();
});

export const getPaymentsReport = asyncHandler(async (req) => {
  requireUser(req);
  void req.validated?.query;
  await paymentsReport();
});

export const getOccupancyReport = asyncHandler(async (req) => {
  requireUser(req);
  void req.validated?.query;
  await occupancyReport();
});
