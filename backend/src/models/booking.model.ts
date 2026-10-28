import { Schema, model, type InferSchemaType } from 'mongoose';
import type { BookingStatus } from '@/types';

const bookingSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    bookingDate: { type: Date, required: true },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'cancelled', 'completed'],
      default: 'pending',
      required: true,
    },
  },
  { timestamps: true },
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ status: 1, createdAt: -1 });

// One pending or approved booking may exist for a room. Cancelled and completed rows stay for history.
bookingSchema.index(
  { room: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'approved'] } },
    name: 'uniq_active_booking_per_room',
  },
);

export interface IBooking {
  user: Schema.Types.ObjectId;
  room: Schema.Types.ObjectId;
  approvedBy?: Schema.Types.ObjectId;
  approvedAt?: Date;
  bookingDate: Date;
  checkInDate: Date;
  checkOutDate: Date;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingDocument = InferSchemaType<typeof bookingSchema> & {
  _id: Schema.Types.ObjectId;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
};

export const Booking = model('Booking', bookingSchema);
