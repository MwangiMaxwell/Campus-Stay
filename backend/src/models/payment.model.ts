import { Schema, model, type InferSchemaType } from 'mongoose';
import type { PaymentStatus } from '@/types';

const paymentSchema = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    amount: { type: Number, required: true, min: 0 },
    phoneNumber: { type: String, required: true, trim: true },
    mpesaReceiptNo: { type: String, trim: true },
    checkoutRequestId: { type: String, trim: true },
    merchantRequestId: { type: String, trim: true },
    paymentDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
      required: true,
    },
  },
  { timestamps: true },
);

paymentSchema.index({ mpesaReceiptNo: 1 }, { unique: true, sparse: true });
paymentSchema.index({ booking: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ checkoutRequestId: 1 }, { sparse: true });

export interface IPayment {
  booking: Schema.Types.ObjectId;
  amount: number;
  phoneNumber: string;
  mpesaReceiptNo?: string;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  paymentDate?: Date;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentDocument = InferSchemaType<typeof paymentSchema> & {
  _id: Schema.Types.ObjectId;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
};

export const Payment = model('Payment', paymentSchema);
