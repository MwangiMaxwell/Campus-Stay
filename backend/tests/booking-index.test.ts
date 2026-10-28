import { describe, expect, it } from 'vitest';
import { Booking, Hostel, Room, User } from '@/models';

describe('booking unique index', () => {
  it('rejects a second active booking for the same room and allows one after cancellation', async () => {
    const user = await User.create({
      fullName: 'Amina Wanjiku',
      email: 'index-student@campusstay.test',
      phone: '+254711000009',
      passwordHash: 'not-used-for-this-test',
      role: 'student',
      status: 'active',
    });
    const hostel = await Hostel.create({
      name: 'Index Hall',
      location: 'East Campus',
      contactPhone: '+254700000009',
      manager: user._id,
    });
    const room = await Room.create({
      hostel: hostel._id,
      roomNumber: 'C-301',
      roomType: 'single',
      price: 7000,
      capacity: 1,
      availabilityStatus: 'available',
    });

    const dates = {
      user: user._id,
      room: room._id,
      bookingDate: new Date('2026-11-01'),
      checkInDate: new Date('2026-11-02'),
      checkOutDate: new Date('2026-12-02'),
    };

    await Booking.syncIndexes();
    const active = await Booking.create({ ...dates, status: 'pending' });
    await expect(Booking.create({ ...dates, status: 'approved' })).rejects.toMatchObject({
      code: 11000,
    });

    active.status = 'cancelled';
    await active.save();
    const next = await Booking.create({ ...dates, status: 'pending' });
    expect(next.status).toBe('pending');
  });
});
