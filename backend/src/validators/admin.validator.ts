import { z } from 'zod';
import {
  emailSchema,
  objectIdSchema,
  passwordSchema,
  phoneSchema,
  dateStringSchema,
  paginationQuerySchema,
} from '@/validators/common';

const roleSchema = z.enum(['student', 'admin', 'super_admin']);
const statusSchema = z.enum(['active', 'suspended']);
const roomTypeSchema = z.enum(['single', 'double', 'triple', 'bedsitter']);
const availabilitySchema = z.enum(['available', 'booked', 'maintenance']);
const bookingStatusSchema = z.enum(['pending', 'approved', 'cancelled', 'completed']);
const paymentStatusSchema = z.enum(['pending', 'success', 'failed']);

export const adminListQuerySchema = z.object({
  role: roleSchema.optional(),
  status: statusSchema.optional(),
  ...paginationQuerySchema,
});

export const adminCreateUserSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  role: roleSchema,
  status: statusSchema.optional(),
  studentRegNo: z.string().trim().min(2).max(32).optional(),
});

export const adminUpdateUserSchema = adminCreateUserSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });

export const adminRoomSchema = z.object({
  hostelId: objectIdSchema,
  roomNumber: z.string().trim().min(1).max(20),
  roomType: roomTypeSchema,
  price: z.number().nonnegative(),
  capacity: z.number().int().positive(),
  availabilityStatus: availabilitySchema.optional(),
});

export const adminUpdateRoomSchema = adminRoomSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });

export const bookingsReportQuerySchema = z.object({
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
  status: bookingStatusSchema.optional(),
  hostelId: objectIdSchema.optional(),
});

export const paymentsReportQuerySchema = z.object({
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
  status: paymentStatusSchema.optional(),
});

export const occupancyReportQuerySchema = z.object({
  from: dateStringSchema.optional(),
  to: dateStringSchema.optional(),
  hostelId: objectIdSchema.optional(),
});

export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type AdminRoomInput = z.infer<typeof adminRoomSchema>;
export type AdminUpdateRoomInput = z.infer<typeof adminUpdateRoomSchema>;
