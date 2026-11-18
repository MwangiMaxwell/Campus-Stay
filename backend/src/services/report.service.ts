import mongoose from 'mongoose';
import { env } from '@/config/env';
import { Booking, Payment, Room, User } from '@/models';
import type { BookingStatus, PaymentStatus } from '@/types';
import type {
  BookingsReportQuery,
  OccupancyReportQuery,
  PaymentsReportQuery,
} from '@/validators/admin.validator';

const DAY_MS = 24 * 60 * 60 * 1000;
// Reports are meant to be printed, so a hard cap keeps one request from loading the database.
const REPORT_ROW_LIMIT = 1000;

interface Named {
  _id: unknown;
  name: string;
  location?: string;
}

interface StudentRef {
  fullName: string;
  email: string;
  phone?: string;
  studentRegNo?: string;
}

interface RoomRef {
  _id: unknown;
  roomNumber: string;
  roomType: string;
  price: number;
  hostel: Named | null;
}

function reportHeader(title: string, filters: Record<string, string | undefined>) {
  return {
    title,
    generatedAt: new Date().toISOString(),
    organization: { name: env.ORG_NAME, logoUrl: env.ORG_LOGO_URL },
    filters,
  };
}

// A bare date such as 2026-11-30 as the upper bound means the whole of that day.
function dateRange(from?: string, to?: string): { $gte?: Date; $lte?: Date } | undefined {
  const range: { $gte?: Date; $lte?: Date } = {};

  if (from) {
    range.$gte = new Date(from);
  }

  if (to) {
    const end = new Date(to);
    range.$lte = /^\d{4}-\d{2}-\d{2}$/.test(to) ? new Date(end.getTime() + DAY_MS - 1) : end;
  }

  return Object.keys(range).length > 0 ? range : undefined;
}

function percent(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function bookingsReport(query: BookingsReportQuery) {
  const range = dateRange(query.from, query.to);
  const filter: Record<string, unknown> = {};

  if (query.status) filter.status = query.status;
  if (range) filter.bookingDate = mongoose.trusted(range);

  if (query.hostelId) {
    const roomIds = await Room.find({ hostel: query.hostelId }).distinct('_id');
    filter.room = mongoose.trusted({ $in: roomIds });
  }

  const bookings = await Booking.find(filter)
    .populate<{ user: StudentRef | null }>('user', 'fullName email phone studentRegNo')
    .populate<{ room: RoomRef | null }>({
      path: 'room',
      select: 'roomNumber roomType price hostel',
      populate: { path: 'hostel', select: 'name location' },
    })
    .sort({ bookingDate: -1 })
    .limit(REPORT_ROW_LIMIT)
    .lean();

  const payments = await Payment.find({
    booking: mongoose.trusted({ $in: bookings.map((booking) => booking._id) }),
  })
    .sort({ createdAt: -1 })
    .lean();

  const byStatus: Record<BookingStatus, number> = {
    pending: 0,
    approved: 0,
    cancelled: 0,
    completed: 0,
  };

  const rows = bookings.map((booking) => {
    byStatus[booking.status] += 1;
    const payment = payments.find((item) => String(item.booking) === String(booking._id));

    return {
      id: String(booking._id),
      student: booking.user?.fullName ?? 'Unknown',
      email: booking.user?.email ?? '',
      studentRegNo: booking.user?.studentRegNo ?? '',
      hostel: booking.room?.hostel?.name ?? '',
      roomNumber: booking.room?.roomNumber ?? '',
      roomType: booking.room?.roomType ?? '',
      fee: booking.room?.price ?? 0,
      bookingDate: booking.bookingDate,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      status: booking.status,
      paymentStatus: payment?.status ?? 'unpaid',
    };
  });

  return {
    ...reportHeader('Bookings report', {
      from: query.from,
      to: query.to,
      status: query.status,
      hostelId: query.hostelId,
    }),
    summary: { total: rows.length, byStatus, truncated: rows.length === REPORT_ROW_LIMIT },
    rows,
  };
}

export async function paymentsReport(query: PaymentsReportQuery) {
  const range = dateRange(query.from, query.to);
  const filter: Record<string, unknown> = {};

  if (query.status) filter.status = query.status;
  if (range) filter.createdAt = mongoose.trusted(range);

  const payments = await Payment.find(filter)
    .populate<{
      booking: { user: StudentRef | null; room: RoomRef | null } | null;
    }>({
      path: 'booking',
      populate: [
        { path: 'user', select: 'fullName email studentRegNo' },
        {
          path: 'room',
          select: 'roomNumber roomType price hostel',
          populate: { path: 'hostel', select: 'name location' },
        },
      ],
    })
    .sort({ createdAt: -1 })
    .limit(REPORT_ROW_LIMIT)
    .lean();

  const byStatus: Record<PaymentStatus, { count: number; amount: number }> = {
    pending: { count: 0, amount: 0 },
    success: { count: 0, amount: 0 },
    failed: { count: 0, amount: 0 },
  };

  const rows = payments.map((payment) => {
    byStatus[payment.status].count += 1;
    byStatus[payment.status].amount += payment.amount;

    return {
      id: String(payment._id),
      date: payment.paymentDate ?? payment.createdAt,
      student: payment.booking?.user?.fullName ?? 'Unknown',
      studentRegNo: payment.booking?.user?.studentRegNo ?? '',
      hostel: payment.booking?.room?.hostel?.name ?? '',
      roomNumber: payment.booking?.room?.roomNumber ?? '',
      phoneNumber: payment.phoneNumber,
      amount: payment.amount,
      receipt: payment.mpesaReceiptNo ?? '',
      status: payment.status,
    };
  });

  return {
    ...reportHeader('Payments report', {
      from: query.from,
      to: query.to,
      status: query.status,
    }),
    summary: {
      total: rows.length,
      totalCollected: byStatus.success.amount,
      byStatus,
      truncated: rows.length === REPORT_ROW_LIMIT,
    },
    rows,
  };
}

export async function occupancyReport(query: OccupancyReportQuery) {
  const rooms = await Room.find(query.hostelId ? { hostel: query.hostelId } : {})
    .populate<{ hostel: Named | null }>('hostel', 'name location')
    .lean();

  // The period decides which stays count as occupying a room. It defaults to right now.
  const start = query.from ? new Date(query.from) : new Date();
  const end =
    dateRange(undefined, query.to)?.$lte ??
    (query.from ? new Date(start.getTime() + DAY_MS - 1) : start);

  const stays = await Booking.find({
    status: mongoose.trusted({ $in: ['approved', 'completed'] }),
    checkInDate: mongoose.trusted({ $lte: end }),
    checkOutDate: mongoose.trusted({ $gte: start }),
    room: mongoose.trusted({ $in: rooms.map((room) => room._id) }),
  })
    .select('room')
    .lean();

  const stayRooms = new Set(stays.map((stay) => String(stay.room)));
  const grouped = new Map<
    string,
    {
      hostel: string;
      location: string;
      totalRooms: number;
      available: number;
      booked: number;
      maintenance: number;
      roomsWithStays: number;
    }
  >();

  for (const room of rooms) {
    const key = String(room.hostel?._id ?? 'unknown');
    const row = grouped.get(key) ?? {
      hostel: room.hostel?.name ?? 'Unknown hostel',
      location: room.hostel?.location ?? '',
      totalRooms: 0,
      available: 0,
      booked: 0,
      maintenance: 0,
      roomsWithStays: 0,
    };

    row.totalRooms += 1;
    row[room.availabilityStatus] += 1;
    if (stayRooms.has(String(room._id))) row.roomsWithStays += 1;
    grouped.set(key, row);
  }

  const rows = [...grouped.values()].map((row) => ({
    ...row,
    occupancyPercent: percent(row.booked, row.totalRooms - row.maintenance),
  }));

  const totals = rows.reduce(
    (sum, row) => ({
      totalRooms: sum.totalRooms + row.totalRooms,
      available: sum.available + row.available,
      booked: sum.booked + row.booked,
      maintenance: sum.maintenance + row.maintenance,
    }),
    { totalRooms: 0, available: 0, booked: 0, maintenance: 0 },
  );

  return {
    ...reportHeader('Occupancy report', {
      from: query.from,
      to: query.to,
      hostelId: query.hostelId,
    }),
    summary: {
      ...totals,
      occupancyPercent: percent(totals.booked, totals.totalRooms - totals.maintenance),
    },
    rows,
  };
}

// Figures for the admin overview page.
export async function dashboardSummary() {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const historyStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

  const [rooms, bookings, payments, students, staff] = await Promise.all([
    Room.find().populate<{ hostel: Named | null }>('hostel', 'name').lean(),
    Booking.find().select('status createdAt').lean(),
    Payment.find().select('status amount paymentDate createdAt booking').lean(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: mongoose.trusted({ $in: ['admin', 'super_admin'] }) }),
  ]);

  const roomCounts = { total: rooms.length, available: 0, booked: 0, maintenance: 0 };
  const hostels = new Map<
    string,
    { name: string; total: number; booked: number; maintenance: number }
  >();

  for (const room of rooms) {
    roomCounts[room.availabilityStatus] += 1;
    const key = String(room.hostel?._id ?? 'unknown');
    const row = hostels.get(key) ?? {
      name: room.hostel?.name ?? 'Unknown hostel',
      total: 0,
      booked: 0,
      maintenance: 0,
    };
    row.total += 1;
    if (room.availabilityStatus === 'booked') row.booked += 1;
    if (room.availabilityStatus === 'maintenance') row.maintenance += 1;
    hostels.set(key, row);
  }

  const bookingCounts: Record<BookingStatus, number> = {
    pending: 0,
    approved: 0,
    cancelled: 0,
    completed: 0,
  };
  for (const booking of bookings) bookingCounts[booking.status] += 1;

  const paidBookingIds = new Set(
    payments.filter((payment) => payment.status === 'success').map((p) => String(p.booking)),
  );
  const pendingBookings = await Booking.find({ status: 'pending' }).select('_id').lean();
  const awaitingApproval = pendingBookings.filter((booking) =>
    paidBookingIds.has(String(booking._id)),
  ).length;

  const paymentCounts = { success: 0, pending: 0, failed: 0 };
  let collectedThisMonth = 0;
  let collectedTotal = 0;
  for (const payment of payments) {
    paymentCounts[payment.status] += 1;
    if (payment.status === 'success') {
      collectedTotal += payment.amount;
      if ((payment.paymentDate ?? payment.createdAt) >= monthStart) {
        collectedThisMonth += payment.amount;
      }
    }
  }

  const monthly: Array<{ month: string; bookings: number; collected: number }> = [];
  for (let offset = 0; offset < 6; offset += 1) {
    const date = new Date(
      Date.UTC(historyStart.getUTCFullYear(), historyStart.getUTCMonth() + offset, 1),
    );
    monthly.push({ month: monthKey(date), bookings: 0, collected: 0 });
  }
  for (const booking of bookings) {
    const row = monthly.find((item) => item.month === monthKey(booking.createdAt));
    if (row) row.bookings += 1;
  }
  for (const payment of payments) {
    if (payment.status !== 'success') continue;
    const row = monthly.find(
      (item) => item.month === monthKey(payment.paymentDate ?? payment.createdAt),
    );
    if (row) row.collected += payment.amount;
  }

  return {
    rooms: {
      ...roomCounts,
      occupancyPercent: percent(roomCounts.booked, roomCounts.total - roomCounts.maintenance),
    },
    byHostel: [...hostels.values()].map((row) => ({
      ...row,
      occupancyPercent: percent(row.booked, row.total - row.maintenance),
    })),
    bookings: { ...bookingCounts, awaitingApproval },
    payments: { ...paymentCounts, collectedThisMonth, collectedTotal },
    users: { students, staff },
    monthly,
  };
}
