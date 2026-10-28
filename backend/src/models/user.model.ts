import { Schema, model, type InferSchemaType } from 'mongoose';
import type { PublicUser, UserRole, UserStatus } from '@/types';

const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['student', 'admin', 'super_admin'],
      default: 'student',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
      required: true,
    },
    studentRegNo: { type: String, trim: true },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, status: 1 });

userSchema.set('toJSON', {
  transform(_doc, ret) {
    const record = ret as { passwordHash?: string };
    delete record.passwordHash;
    return ret;
  },
});

export interface IUser {
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  studentRegNo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: Schema.Types.ObjectId;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
};

export const User = model('User', userSchema);

export function toPublicUser(user: {
  _id: unknown;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  studentRegNo?: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PublicUser {
  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    studentRegNo: user.studentRegNo ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toAuthUser(user: {
  _id: unknown;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}
