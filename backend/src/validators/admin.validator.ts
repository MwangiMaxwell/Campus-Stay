import { z } from 'zod';

import {
  emailSchema,
  objectIdSchema,
  passwordSchema,
  phoneSchema,
  dateStringSchema,
  paginationQuerySchema,
} from '@/validators/common';

// Enums
const roleSchema = z.enum(['student', 'admin', 'super_admin']);
const statusSchema = z.enum(['active', 'suspended']);
const roomTypeSchema = z.enum(['single', 'double', 'triple', 'bedsitter']);
const availabilitySchema = z.enum(['available', 'booked', 'maintenance']);
const bookingStatusSchema = z.enum(['pending', 'approved', 'cancelled', 'completed']);
const paymentStatusSchema = z.enum(['pending', 'success', 'failed']);

// USER MANAGEMENT

export const adminListQuerySchema = z.object({
  role: roleSchema.optional(),
  status: statusSchema.optional(),
  q: z.string().trim().min(1).max(80).optional(),
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

// ROOM MANAGEMENT

export const adminRoomListQuerySchema = z.object({
  ...paginationQuerySchema,
  hostelId: objectIdSchema.optional(),
  roomType: roomTypeSchema.optional(),
  availabilityStatus: availabilitySchema.optional(),
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

// BOOKING MANAGEMENT

export const adminBookingListQuerySchema = z.object({
  ...paginationQuerySchema,
  status: bookingStatusSchema.optional(),
});

// PAYMENT MANAGEMENT

export const adminPaymentListQuerySchema = z.object({
  ...paginationQuerySchema,
  status: paymentStatusSchema.optional(),
});

// HOSTELS

export const adminHostelSchema = z.object({
  name: z.string().trim().min(2).max(80),
  location: z.string().trim().min(2).max(120),
  contactPhone: phoneSchema,
});

export const adminUpdateHostelSchema = adminHostelSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });

// AUDIT LOG

export const auditLogListQuerySchema = z.object({
  ...paginationQuerySchema,
  action: z.string().trim().min(1).max(60).optional(),
});

// REPORTS

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

// TYPES

export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

export type AdminRoomInput = z.infer<typeof adminRoomSchema>;
export type AdminUpdateRoomInput = z.infer<typeof adminUpdateRoomSchema>;
export type AdminRoomListQuery = z.infer<typeof adminRoomListQuerySchema>;

export type AdminBookingListQuery = z.infer<typeof adminBookingListQuerySchema>;

export type AdminPaymentListQuery = z.infer<typeof adminPaymentListQuerySchema>;

export type AdminHostelInput = z.infer<typeof adminHostelSchema>;
export type AdminUpdateHostelInput = z.infer<typeof adminUpdateHostelSchema>;
export type AuditLogListQuery = z.infer<typeof auditLogListQuerySchema>;
export type BookingsReportQuery = z.infer<typeof bookingsReportQuerySchema>;
export type PaymentsReportQuery = z.infer<typeof paymentsReportQuerySchema>;
export type OccupancyReportQuery = z.infer<typeof occupancyReportQuerySchema>;

export type AdminListQuery = z.infer<typeof adminListQuerySchema>;
