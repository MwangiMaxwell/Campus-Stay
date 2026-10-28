import { Schema, model, type InferSchemaType } from 'mongoose';
import type { AvailabilityStatus, RoomType } from '@/types';

const roomSchema = new Schema(
  {
    hostel: { type: Schema.Types.ObjectId, ref: 'Hostel', required: true },
    roomNumber: { type: String, required: true, trim: true },
    roomType: {
      type: String,
      enum: ['single', 'double', 'triple', 'bedsitter'],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    capacity: { type: Number, required: true, min: 1 },
    availabilityStatus: {
      type: String,
      enum: ['available', 'booked', 'maintenance'],
      default: 'available',
      required: true,
    },
  },
  { timestamps: true },
);

roomSchema.index({ hostel: 1, roomNumber: 1 }, { unique: true, name: 'uniq_hostel_room_number' });
roomSchema.index({ roomType: 1, price: 1, availabilityStatus: 1 }, { name: 'room_search_filters' });
roomSchema.index({ hostel: 1, availabilityStatus: 1 }, { name: 'room_hostel_availability' });

export interface IRoom {
  hostel: Schema.Types.ObjectId;
  roomNumber: string;
  roomType: RoomType;
  price: number;
  capacity: number;
  availabilityStatus: AvailabilityStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type RoomDocument = InferSchemaType<typeof roomSchema> & {
  _id: Schema.Types.ObjectId;
  roomType: RoomType;
  availabilityStatus: AvailabilityStatus;
  createdAt: Date;
  updatedAt: Date;
};

export const Room = model('Room', roomSchema);
