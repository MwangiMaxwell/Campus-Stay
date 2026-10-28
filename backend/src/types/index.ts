export type UserRole = 'student' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'suspended';
export type RoomType = 'single' | 'double' | 'triple' | 'bedsitter';
export type AvailabilityStatus = 'available' | 'booked' | 'maintenance';
export type BookingStatus = 'pending' | 'approved' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'success' | 'failed';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface PublicUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  studentRegNo: string | null;
  createdAt: Date;
  updatedAt: Date;
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

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RoomListResult {
  rooms: RoomSummary[];
  pagination: Pagination;
}
