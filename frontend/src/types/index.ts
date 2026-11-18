export type UserRole = 'student' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'suspended';
export type RoomType = 'single' | 'double' | 'triple' | 'bedsitter';
export type AvailabilityStatus = 'available' | 'booked' | 'maintenance';

export interface PublicUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  studentRegNo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HostelSummary {
  id: string;
  name: string;
  location: string;
  contactPhone: string;
}

export interface RoomSummary {
  id: string;
  roomNumber: string;
  roomType: RoomType;
  price: number;
  capacity: number;
  availabilityStatus: AvailabilityStatus;
  hostel: HostelSummary;
}

export interface RoomListResult {
  rooms: RoomSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RoomFilters {
  hostel?: string;
  roomType?: RoomType;
  minPrice?: string;
  maxPrice?: string;
  available?: 'true' | 'false';
  page?: number;
  limit?: number;
}

export type BookingStatus = 'pending' | 'approved' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'success' | 'failed';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaymentBrief {
  _id?: string;
  id?: string;
  status: PaymentStatus;
  amount: number;
  mpesaReceiptNo?: string | null;
  paymentDate?: string | null;
  createdAt: string;
}

export interface BookingRoom {
  _id: string;
  roomNumber: string;
  roomType: RoomType;
  price: number;
  capacity: number;
  availabilityStatus: AvailabilityStatus;
  hostel: { _id: string; name: string; location: string } | null;
}

export interface Booking {
  id: string;
  status: BookingStatus;
  bookingDate: string;
  checkInDate: string;
  checkOutDate: string;
  createdAt: string;
  room: BookingRoom | null;
  latestPayment?: PaymentBrief | null;
}

export interface AdminBooking extends Omit<Booking, 'room'> {
  room: BookingRoom | null;
  user: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    studentRegNo?: string;
  } | null;
}

export interface Payment {
  id: string;
  amount: number;
  phoneNumber: string;
  status: PaymentStatus;
  mpesaReceiptNo?: string | null;
  paymentDate?: string | null;
  createdAt: string;
  booking: {
    _id: string;
    status: BookingStatus;
    room: BookingRoom | null;
    user?: { fullName: string; email: string; studentRegNo?: string } | null;
  } | null;
}

export interface AuditEntry {
  id: string;
  action: string;
  targetType?: string;
  targetId?: string;
  ip?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
  user: { fullName: string; email: string; role: UserRole } | null;
}

export interface Dashboard {
  rooms: {
    total: number;
    available: number;
    booked: number;
    maintenance: number;
    occupancyPercent: number;
  };
  byHostel: Array<{
    name: string;
    total: number;
    booked: number;
    maintenance: number;
    occupancyPercent: number;
  }>;
  bookings: Record<BookingStatus, number> & { awaitingApproval: number };
  payments: {
    success: number;
    pending: number;
    failed: number;
    collectedThisMonth: number;
    collectedTotal: number;
  };
  users: { students: number; staff: number };
  monthly: Array<{ month: string; bookings: number; collected: number }>;
}

export interface ReportHeader {
  title: string;
  generatedAt: string;
  organization: { name: string; logoUrl?: string };
  filters: Record<string, string | undefined>;
}
