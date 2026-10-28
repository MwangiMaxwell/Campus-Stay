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
