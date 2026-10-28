import { describe, expect, it } from 'vitest';
import { registerSchema } from '@/validators/auth.validator';
import { createBookingSchema } from '@/validators/booking.validator';
import { roomQuerySchema } from '@/validators/room.validator';
import { sanitizeInput } from '@/utils/sanitize';

describe('validators', () => {
  it('accepts a student registration and rejects a weak password', () => {
    const valid = registerSchema.safeParse({
      fullName: 'Amina Wanjiku',
      email: 'Amina@CampusStay.test',
      phone: '+254711000001',
      password: 'Student#2026',
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.email).toBe('amina@campusstay.test');
    }

    const weak = registerSchema.safeParse({
      fullName: 'Amina Wanjiku',
      email: 'amina@campusstay.test',
      phone: '+254711000001',
      password: 'password',
    });
    expect(weak.success).toBe(false);
  });

  it('rejects a booking whose check-out is not after check-in', () => {
    const result = createBookingSchema.safeParse({
      roomId: '507f1f77bcf86cd799439011',
      checkInDate: '2026-12-01',
      checkOutDate: '2026-11-01',
    });
    expect(result.success).toBe(false);
  });

  it('parses room search query strings', () => {
    const result = roomQuerySchema.safeParse({
      roomType: 'double',
      minPrice: '1000',
      available: 'true',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minPrice).toBe(1000);
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(10);
    }
  });

  it('strips operator keys and dotted keys', () => {
    const clean = sanitizeInput({
      email: { $gt: '' },
      'user.name': 'Ada',
      profile: { city: 'Nairobi' },
    });
    expect(clean).toEqual({ email: {}, profile: { city: 'Nairobi' } });
  });
});
