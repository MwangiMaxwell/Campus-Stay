import { AppError } from '@/utils/AppError';

// TODO(member-5): aggregate bookings for a printable report that includes the date, ORG_NAME, and ORG_LOGO_URL.
export async function bookingsReport(): Promise<never> {
  throw new AppError(501, 'Not implemented');
}

// TODO(member-5): aggregate payments for a printable report that includes the date, ORG_NAME, and ORG_LOGO_URL.
export async function paymentsReport(): Promise<never> {
  throw new AppError(501, 'Not implemented');
}

// TODO(member-5): aggregate occupancy for a printable report that includes the date, ORG_NAME, and ORG_LOGO_URL.
export async function occupancyReport(): Promise<never> {
  throw new AppError(501, 'Not implemented');
}
