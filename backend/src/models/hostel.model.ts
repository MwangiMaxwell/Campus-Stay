import { Schema, model, type InferSchemaType } from 'mongoose';

const hostelSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    location: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    manager: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export interface IHostel {
  name: string;
  location: string;
  contactPhone: string;
  manager: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type HostelDocument = InferSchemaType<typeof hostelSchema> & {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Hostel = model('Hostel', hostelSchema);
