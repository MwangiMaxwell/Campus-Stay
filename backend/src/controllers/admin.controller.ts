import { AppError, isDuplicateKey } from '@/utils/AppError';
import { asyncHandler } from '@/utils/asyncHandler';
import { AuditLog, Booking, Hostel, Payment, Room, User, toPublicUser } from '@/models';
import { recordAudit } from '@/services/audit.service';
import { sendSuccess } from '@/utils/apiResponse';
import {
  bookingsReport,
  dashboardSummary,
  occupancyReport,
  paymentsReport,
} from '@/services/report.service';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { withId } from '@/utils/withId';

import type {
  AdminBookingListQuery,
  AdminCreateUserInput,
  AdminHostelInput,
  AdminUpdateHostelInput,
  AuditLogListQuery,
  BookingsReportQuery,
  OccupancyReportQuery,
  PaymentsReportQuery,
  AdminListQuery,
  AdminPaymentListQuery,
  AdminRoomInput,
  AdminRoomListQuery,
  AdminUpdateRoomInput,
  AdminUpdateUserInput,
} from '@/validators/admin.validator';
import type { IdParams } from '@/validators/common';

interface AdminRoomRow {
  _id: unknown;
  roomNumber: string;
  roomType: string;
  price: number;
  capacity: number;
  availabilityStatus: string;
  hostel: {
    _id: unknown;
    name: string;
    location: string;
    contactPhone: string;
  } | null;
}

function requireUser(req: { user?: { id: string } }): string {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  return req.user.id;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Admins manage student accounts. Only a super admin manages staff accounts and roles.
function assertCanManage(actorRole: string | undefined, targetRole: string | undefined): void {
  if (actorRole === 'super_admin') return;

  if (targetRole !== undefined && targetRole !== 'student') {
    throw new AppError(403, 'Only a super admin can manage staff accounts');
  }
}

// --------------------------------------------------
// USER MANAGEMENT
// --------------------------------------------------

// List users with optional role/status filters and pagination.
export const listUsers = asyncHandler(async (req, res) => {
  requireUser(req);

  const query = req.validated?.query as AdminListQuery;
  const { page, limit, role, status, q } = query;

  const pattern = q ? mongoose.trusted({ $regex: escapeRegex(q), $options: 'i' }) : undefined;

  const filter = {
    ...(role && { role }),
    ...(status && { status }),
    ...(pattern && {
      $or: [{ fullName: pattern }, { email: pattern }, { studentRegNo: pattern }],
    }),
  };

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  sendSuccess(res, {
    users: users.map(toPublicUser),
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  });
});

// Create a user, hash their password, and record the administrative action.
export const createUser = asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const body = req.validated?.body as AdminCreateUserInput;

  assertCanManage(req.user?.role, body.role);

  const passwordHash = await bcrypt.hash(body.password, 12);

  try {
    const user = await User.create({
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      passwordHash,
      role: body.role,
      status: body.status ?? 'active',
      studentRegNo: body.studentRegNo,
    });

    await recordAudit({
      userId,
      action: 'admin.user.create',
      targetType: 'user',
      targetId: String(user._id),
      ip: req.ip,
      meta: {
        email: user.email,
        role: user.role,
      },
    });

    sendSuccess(res, { user: toPublicUser(user) }, 201);
  } catch (error) {
    if (isDuplicateKey(error)) {
      throw new AppError(409, 'An account with this email already exists');
    }

    throw error;
  }
});

// Return one user without exposing passwordHash.
export const getUser = asyncHandler(async (req, res) => {
  requireUser(req);

  const { id } = req.validated?.params as IdParams;
  const user = await User.findById(id);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  sendSuccess(res, { user: toPublicUser(user) });
});

// Update user details and record the administrative action.
export const updateUser = asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const { id } = req.validated?.params as IdParams;
  const body = req.validated?.body as AdminUpdateUserInput;

  const existingUser = await User.findById(id);

  if (!existingUser) {
    throw new AppError(404, 'User not found');
  }

  assertCanManage(req.user?.role, existingUser.role);
  assertCanManage(req.user?.role, body.role);

  if (
    userId === id &&
    ((body.role !== undefined && body.role !== existingUser.role) ||
      (body.status !== undefined && body.status !== existingUser.status))
  ) {
    throw new AppError(409, 'You cannot change your own role or status');
  }

  const updates = {
    ...(body.fullName !== undefined && {
      fullName: body.fullName,
    }),
    ...(body.email !== undefined && {
      email: body.email,
    }),
    ...(body.phone !== undefined && {
      phone: body.phone,
    }),
    ...(body.role !== undefined && {
      role: body.role,
    }),
    ...(body.status !== undefined && {
      status: body.status,
    }),
    ...(body.studentRegNo !== undefined && {
      studentRegNo: body.studentRegNo,
    }),
    ...(body.password !== undefined && {
      passwordHash: await bcrypt.hash(body.password, 12),
    }),
  };

  try {
    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true },
    );

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    await recordAudit({
      userId,
      action: 'admin.user.update',
      targetType: 'user',
      targetId: String(user._id),
      ip: req.ip,
      meta: {
        updatedFields: Object.keys(updates),
      },
    });

    sendSuccess(res, { user: toPublicUser(user) });
  } catch (error) {
    if (isDuplicateKey(error)) {
      throw new AppError(409, 'An account with this email already exists');
    }

    throw error;
  }
});

// Suspend a user instead of deleting their account and historical records.
export const deleteUser = asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const { id } = req.validated?.params as IdParams;

  if (userId === id) {
    throw new AppError(409, 'You cannot suspend your own account');
  }

  const user = await User.findById(id);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  assertCanManage(req.user?.role, user.role);

  user.status = 'suspended';
  await user.save();

  await recordAudit({
    userId,
    action: 'admin.user.delete',
    targetType: 'user',
    targetId: String(user._id),
    ip: req.ip,
    meta: {
      email: user.email,
      action: 'suspend',
    },
  });

  sendSuccess(res, {
    message: 'User suspended successfully',
    user: toPublicUser(user),
  });
});

// --------------------------------------------------
// ROOM MANAGEMENT
// --------------------------------------------------

// List rooms for administrators with pagination and hostel details.
export const listAdminRooms = asyncHandler(async (req, res) => {
  requireUser(req);

  const query = req.validated?.query as AdminRoomListQuery;
  const { page, limit, hostelId, roomType, availabilityStatus } = query;

  const filter = {
    ...(hostelId && { hostel: hostelId }),
    ...(roomType && { roomType }),
    ...(availabilityStatus && { availabilityStatus }),
  };

  const [rows, total] = await Promise.all([
    Room.find(filter)
      .populate('hostel', 'name location contactPhone')
      .sort({ roomNumber: 1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<AdminRoomRow[]>(),

    Room.countDocuments(filter),
  ]);

  const rooms = rows.map((room) => ({
    id: String(room._id),
    roomNumber: room.roomNumber,
    roomType: room.roomType,
    price: room.price,
    capacity: room.capacity,
    availabilityStatus: room.availabilityStatus,
    hostel: room.hostel
      ? {
          id: String(room.hostel._id),
          name: room.hostel.name,
          location: room.hostel.location,
          contactPhone: room.hostel.contactPhone,
        }
      : null,
  }));

  sendSuccess(res, {
    rooms,
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  });
});

// Create a room and write an audit entry.
export const createRoom = asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const body = req.validated?.body as AdminRoomInput;

  const hostel = await Hostel.findById(body.hostelId);

  if (!hostel) {
    throw new AppError(404, 'Hostel not found');
  }

  const room = await Room.create({
    hostel: body.hostelId,
    roomNumber: body.roomNumber,
    roomType: body.roomType,
    price: body.price,
    capacity: body.capacity,
    availabilityStatus: body.availabilityStatus ?? 'available',
  });

  await recordAudit({
    userId,
    action: 'admin.room.create',
    targetType: 'room',
    targetId: String(room._id),
    ip: req.ip,
    meta: {
      roomNumber: room.roomNumber,
      hostelId: body.hostelId,
    },
  });

  sendSuccess(
    res,
    {
      room: {
        id: String(room._id),
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        price: room.price,
        capacity: room.capacity,
        availabilityStatus: room.availabilityStatus,
        hostel: {
          id: String(hostel._id),
          name: hostel.name,
          location: hostel.location,
          contactPhone: hostel.contactPhone,
        },
      },
    },
    201,
  );
});

// Get one room with hostel details.
export const getAdminRoom = asyncHandler(async (req, res) => {
  requireUser(req);

  const { id } = req.validated?.params as IdParams;

  const room = await Room.findById(id)
    .populate('hostel', 'name location contactPhone')
    .lean<AdminRoomRow>();

  if (!room) {
    throw new AppError(404, 'Room not found');
  }

  sendSuccess(res, {
    room: {
      id: String(room._id),
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      price: room.price,
      capacity: room.capacity,
      availabilityStatus: room.availabilityStatus,
      hostel: room.hostel
        ? {
            id: String(room.hostel._id),
            name: room.hostel.name,
            location: room.hostel.location,
            contactPhone: room.hostel.contactPhone,
          }
        : null,
    },
  });
});

// Update room details.
export const updateRoom = asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const { id } = req.validated?.params as IdParams;
  const body = req.validated?.body as AdminUpdateRoomInput;

  const existingRoom = await Room.findById(id);

  if (!existingRoom) {
    throw new AppError(404, 'Room not found');
  }

  if (body.hostelId) {
    const hostel = await Hostel.findById(body.hostelId);

    if (!hostel) {
      throw new AppError(404, 'Hostel not found');
    }
  }

  // A room with a live booking has to stay booked until that booking is closed.
  if (body.availabilityStatus !== undefined && body.availabilityStatus !== 'booked') {
    const activeBooking = await Booking.exists({
      room: existingRoom._id,
      status: mongoose.trusted({ $in: ['pending', 'approved'] }),
    });

    if (activeBooking) {
      throw new AppError(
        409,
        'This room has an active booking. Cancel or complete the booking before changing its status.',
      );
    }
  }

  const updates = {
    ...(body.hostelId !== undefined && {
      hostel: body.hostelId,
    }),
    ...(body.roomNumber !== undefined && {
      roomNumber: body.roomNumber,
    }),
    ...(body.roomType !== undefined && {
      roomType: body.roomType,
    }),
    ...(body.price !== undefined && {
      price: body.price,
    }),
    ...(body.capacity !== undefined && {
      capacity: body.capacity,
    }),
    ...(body.availabilityStatus !== undefined && {
      availabilityStatus: body.availabilityStatus,
    }),
  };

  const room = await Room.findByIdAndUpdate(
    id,
    { $set: updates },
    { returnDocument: 'after', runValidators: true },
  )
    .populate('hostel', 'name location contactPhone')
    .lean<AdminRoomRow>();

  if (!room) {
    throw new AppError(404, 'Room not found');
  }

  await recordAudit({
    userId,
    action: 'admin.room.update',
    targetType: 'room',
    targetId: String(room._id),
    ip: req.ip,
    meta: {
      updatedFields: Object.keys(updates),
    },
  });

  sendSuccess(res, {
    room: {
      id: String(room._id),
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      price: room.price,
      capacity: room.capacity,
      availabilityStatus: room.availabilityStatus,
      hostel: room.hostel
        ? {
            id: String(room.hostel._id),
            name: room.hostel.name,
            location: room.hostel.location,
            contactPhone: room.hostel.contactPhone,
          }
        : null,
    },
  });
});

// Delete a room only if it has no booking history.
export const deleteRoom = asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const { id } = req.validated?.params as IdParams;

  const room = await Room.findById(id);

  if (!room) {
    throw new AppError(404, 'Room not found');
  }

  const hasBookings = await Booking.exists({
    room: room._id,
  });

  if (hasBookings) {
    throw new AppError(
      409,
      'Room has booking history. Set its availability status to maintenance instead.',
    );
  }

  await Room.findByIdAndDelete(id);

  await recordAudit({
    userId,
    action: 'admin.room.delete',
    targetType: 'room',
    targetId: String(room._id),
    ip: req.ip,
    meta: {
      roomNumber: room.roomNumber,
      hostelId: String(room.hostel),
    },
  });

  sendSuccess(res, {
    message: 'Room deleted successfully',
  });
});

// --------------------------------------------------
// BOOKING MANAGEMENT
// --------------------------------------------------

// List bookings with pagination and optional status filtering.
export const listAdminBookings = asyncHandler(async (req, res) => {
  requireUser(req);

  const query = req.validated?.query as AdminBookingListQuery;
  const { page, limit, status } = query;

  const filter = status ? { status } : {};

  const [rows, total] = await Promise.all([
    Booking.find(filter)
      .populate('user', 'fullName email phone studentRegNo')
      .populate({
        path: 'room',
        select: 'roomNumber roomType price capacity availabilityStatus hostel',
        populate: {
          path: 'hostel',
          select: 'name location',
        },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Booking.countDocuments(filter),
  ]);

  // trusted() keeps the $in operator, which sanitizeFilter would otherwise neutralise.
  const payments = await Payment.find({
    booking: mongoose.trusted({
      $in: rows.map((booking) => booking._id),
    }),
  })
    .sort({ createdAt: -1 })
    .lean();

  const bookings = rows.map((booking) => ({
    ...withId(booking),
    latestPayment:
      payments.find((payment) => String(payment.booking) === String(booking._id)) ?? null,
  }));

  sendSuccess(res, {
    bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  });
});

// Approve a booking only if payment was successful.
export const approveBooking = asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const { id } = req.validated?.params as IdParams;

  const booking = await Booking.findById(id);

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  if (booking.status !== 'pending') {
    throw new AppError(409, 'Only pending bookings can be approved');
  }

  const payment = await Payment.exists({
    booking: booking._id,
    status: 'success',
  });

  if (!payment) {
    throw new AppError(409, 'Booking cannot be approved without successful payment');
  }

  const room = await Room.findById(booking.room);

  if (!room) {
    throw new AppError(404, 'Room not found');
  }

  if (room.availabilityStatus === 'maintenance') {
    throw new AppError(409, 'Cannot approve a booking for a room under maintenance');
  }

  const updatedBooking = await Booking.findOneAndUpdate(
    {
      _id: id,
      status: 'pending',
    },
    {
      $set: {
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
      },
    },
    { returnDocument: 'after' },
  );

  if (!updatedBooking) {
    throw new AppError(409, 'Booking could not be approved');
  }

  await Room.findByIdAndUpdate(room._id, {
    $set: {
      availabilityStatus: 'booked',
    },
  });

  await recordAudit({
    userId,
    action: 'booking.approve',
    targetType: 'booking',
    targetId: String(booking._id),
    ip: req.ip,
    meta: {
      roomId: String(room._id),
    },
  });

  sendSuccess(res, {
    booking: updatedBooking,
  });
});

// Cancel a pending or approved booking.
export const cancelAdminBooking = asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const { id } = req.validated?.params as IdParams;

  const booking = await Booking.findById(id);

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  if (!['pending', 'approved'].includes(booking.status)) {
    throw new AppError(409, 'This booking cannot be cancelled');
  }

  // trusted() keeps the $in operator, which sanitizeFilter would otherwise neutralise.
  const updatedBooking = await Booking.findOneAndUpdate(
    {
      _id: id,
      status: mongoose.trusted({ $in: ['pending', 'approved'] }),
    },
    {
      $set: {
        status: 'cancelled',
      },
    },
    { returnDocument: 'after' },
  );

  if (!updatedBooking) {
    throw new AppError(409, 'Booking could not be cancelled');
  }

  // The partial unique index allows one live booking per room, so the room is free again.
  await Room.findOneAndUpdate(
    {
      _id: booking.room,
      availabilityStatus: 'booked',
    },
    {
      $set: {
        availabilityStatus: 'available',
      },
    },
  );

  const refundDue = Boolean(await Payment.exists({ booking: booking._id, status: 'success' }));

  await recordAudit({
    userId,
    action: 'booking.cancel',
    targetType: 'booking',
    targetId: String(booking._id),
    ip: req.ip,
    meta: {
      roomId: String(booking.room),
      refundDue,
    },
  });

  sendSuccess(res, {
    booking: updatedBooking,
    refundDue,
  });
});

// Close an approved booking once the stay is over and free the room.
export const completeAdminBooking = asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const { id } = req.validated?.params as IdParams;

  const booking = await Booking.findById(id);

  if (!booking) {
    throw new AppError(404, 'Booking not found');
  }

  if (booking.status !== 'approved') {
    throw new AppError(409, 'Only approved bookings can be completed');
  }

  const updatedBooking = await Booking.findOneAndUpdate(
    { _id: id, status: 'approved' },
    { $set: { status: 'completed' } },
    { returnDocument: 'after' },
  );

  if (!updatedBooking) {
    throw new AppError(409, 'Booking could not be completed');
  }

  await Room.findOneAndUpdate(
    { _id: booking.room, availabilityStatus: 'booked' },
    { $set: { availabilityStatus: 'available' } },
  );

  await recordAudit({
    userId,
    action: 'booking.complete',
    targetType: 'booking',
    targetId: String(booking._id),
    ip: req.ip,
    meta: { roomId: String(booking.room) },
  });

  sendSuccess(res, { booking: updatedBooking });
});

// --------------------------------------------------
// PAYMENT MANAGEMENT
// --------------------------------------------------

// List payments with optional status filtering and pagination.
export const listAdminPayments = asyncHandler(async (req, res) => {
  requireUser(req);

  const query = req.validated?.query as AdminPaymentListQuery;
  const { page, limit, status } = query;

  const filter = status ? { status } : {};

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate({
        path: 'booking',
        populate: [
          {
            path: 'user',
            select: 'fullName email phone studentRegNo',
          },
          {
            path: 'room',
            select: 'roomNumber roomType price hostel',
            populate: {
              path: 'hostel',
              select: 'name location',
            },
          },
        ],
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Payment.countDocuments(filter),
  ]);

  sendSuccess(res, {
    payments: payments.map(withId),
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  });
});

// Get one payment with its related booking information.
export const getAdminPayment = asyncHandler(async (req, res) => {
  requireUser(req);

  const { id } = req.validated?.params as IdParams;

  const payment = await Payment.findById(id)
    .populate({
      path: 'booking',
      populate: [
        {
          path: 'user',
          select: 'fullName email phone studentRegNo',
        },
        {
          path: 'room',
          select: 'roomNumber roomType price hostel',
          populate: {
            path: 'hostel',
            select: 'name location',
          },
        },
      ],
    })
    .lean();

  if (!payment) {
    throw new AppError(404, 'Payment not found');
  }

  sendSuccess(res, { payment });
});

// --------------------------------------------------
// REPORTS
// --------------------------------------------------

export const getBookingsReport = asyncHandler(async (req, res) => {
  requireUser(req);

  const report = await bookingsReport(req.validated?.query as BookingsReportQuery);

  sendSuccess(res, { report });
});

export const getPaymentsReport = asyncHandler(async (req, res) => {
  requireUser(req);

  const report = await paymentsReport(req.validated?.query as PaymentsReportQuery);

  sendSuccess(res, { report });
});

export const getOccupancyReport = asyncHandler(async (req, res) => {
  requireUser(req);

  const report = await occupancyReport(req.validated?.query as OccupancyReportQuery);

  sendSuccess(res, { report });
});

// --------------------------------------------------
// DASHBOARD AND AUDIT LOG
// --------------------------------------------------

export const getDashboard = asyncHandler(async (req, res) => {
  requireUser(req);

  sendSuccess(res, { dashboard: await dashboardSummary() });
});

// Read-only view of the append-only audit log (NFR1: who did what, and when).
export const listAuditLogs = asyncHandler(async (req, res) => {
  requireUser(req);

  const { page, limit, action } = req.validated?.query as AuditLogListQuery;
  const filter = action ? { action: mongoose.trusted({ $regex: `^${escapeRegex(action)}` }) } : {};

  const [rows, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('user', 'fullName email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  sendSuccess(res, {
    logs: rows.map(withId),
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  });
});

// --------------------------------------------------
// HOSTELS
// --------------------------------------------------

export const createHostel = asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const body = req.validated?.body as AdminHostelInput;

  try {
    const hostel = await Hostel.create({
      name: body.name,
      location: body.location,
      contactPhone: body.contactPhone,
      manager: userId,
    });

    await recordAudit({
      userId,
      action: 'admin.hostel.create',
      targetType: 'hostel',
      targetId: String(hostel._id),
      ip: req.ip,
      meta: { name: hostel.name },
    });

    sendSuccess(res, { hostel: withId(hostel.toObject()) }, 201);
  } catch (error) {
    if (isDuplicateKey(error)) {
      throw new AppError(409, 'A hostel with this name already exists');
    }

    throw error;
  }
});

export const updateHostel = asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const { id } = req.validated?.params as IdParams;
  const body = req.validated?.body as AdminUpdateHostelInput;

  try {
    const hostel = await Hostel.findByIdAndUpdate(
      id,
      { $set: body },
      { returnDocument: 'after', runValidators: true },
    ).lean();

    if (!hostel) {
      throw new AppError(404, 'Hostel not found');
    }

    await recordAudit({
      userId,
      action: 'admin.hostel.update',
      targetType: 'hostel',
      targetId: String(hostel._id),
      ip: req.ip,
      meta: { updatedFields: Object.keys(body) },
    });

    sendSuccess(res, { hostel: withId(hostel) });
  } catch (error) {
    if (isDuplicateKey(error)) {
      throw new AppError(409, 'A hostel with this name already exists');
    }

    throw error;
  }
});
