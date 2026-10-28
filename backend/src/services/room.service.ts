import mongoose from 'mongoose';
import { Room } from '@/models';
import type { AvailabilityStatus, RoomListResult, RoomSummary, RoomType } from '@/types';
import { AppError } from '@/utils/AppError';
import type { RoomQuery } from '@/validators/room.validator';

interface HostelRef {
  _id: unknown;
  name: string;
  location: string;
  contactPhone: string;
}

interface RoomRow {
  _id: unknown;
  roomNumber: string;
  roomType: RoomType;
  price: number;
  capacity: number;
  availabilityStatus: AvailabilityStatus;
  hostel: HostelRef | null;
}

function toSummary(room: RoomRow): RoomSummary {
  if (!room.hostel || typeof room.hostel !== 'object' || !('name' in room.hostel)) {
    throw new AppError(500, 'Room is missing its hostel');
  }
  return {
    id: String(room._id),
    roomNumber: room.roomNumber,
    roomType: room.roomType,
    price: room.price,
    capacity: room.capacity,
    availabilityStatus: room.availabilityStatus,
    hostel: {
      id: String(room.hostel._id),
      name: room.hostel.name,
      location: room.hostel.location,
      contactPhone: room.hostel.contactPhone,
    },
  };
}

export async function listRooms(queryInput: RoomQuery): Promise<RoomListResult> {
  const filter: Record<string, unknown> = {};
  if (queryInput.hostel) {
    filter.hostel = queryInput.hostel;
  }
  if (queryInput.roomType) {
    filter.roomType = queryInput.roomType;
  }
  if (queryInput.available === 'true') {
    filter.availabilityStatus = 'available';
  }
  if (queryInput.available === 'false') {
    filter.availabilityStatus = mongoose.trusted({ $in: ['booked', 'maintenance'] });
  }

  if (queryInput.minPrice !== undefined || queryInput.maxPrice !== undefined) {
    const price: { $gte?: number; $lte?: number } = {};
    if (queryInput.minPrice !== undefined) {
      price.$gte = queryInput.minPrice;
    }
    if (queryInput.maxPrice !== undefined) {
      price.$lte = queryInput.maxPrice;
    }
    // The numbers come from Zod. trusted() marks operators this service wrote so sanitizeFilter keeps them.
    filter.price = mongoose.trusted(price);
  }

  const page = queryInput.page;
  const limit = queryInput.limit;
  const [rows, total] = await Promise.all([
    Room.find(filter)
      .populate('hostel', 'name location contactPhone')
      .sort({ roomNumber: 1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<RoomRow[]>(),
    Room.countDocuments(filter),
  ]);

  return {
    rooms: rows.map((row) => toSummary(row)),
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}
