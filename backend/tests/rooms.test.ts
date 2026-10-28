import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { Hostel, Room, User } from '@/models';
import { app } from './helpers';

async function seedRooms() {
  const manager = await User.create({
    fullName: 'Grace Mwangi',
    email: 'manager@campusstay.test',
    phone: '+254722000001',
    passwordHash: 'not-used-for-this-test',
    role: 'admin',
    status: 'active',
  });
  const north = await Hostel.create({
    name: 'Kilimo Hostels',
    location: 'North Campus',
    contactPhone: '+254700000001',
    manager: manager._id,
  });
  const south = await Hostel.create({
    name: 'Lakeside Hall',
    location: 'South Campus',
    contactPhone: '+254700000002',
    manager: manager._id,
  });

  await Room.create([
    {
      hostel: north._id,
      roomNumber: 'A-101',
      roomType: 'single',
      price: 8000,
      capacity: 1,
      availabilityStatus: 'available',
    },
    {
      hostel: north._id,
      roomNumber: 'A-102',
      roomType: 'double',
      price: 12000,
      capacity: 2,
      availabilityStatus: 'available',
    },
    {
      hostel: north._id,
      roomNumber: 'A-105',
      roomType: 'single',
      price: 8500,
      capacity: 1,
      availabilityStatus: 'maintenance',
    },
    {
      hostel: south._id,
      roomNumber: 'B-201',
      roomType: 'single',
      price: 9000,
      capacity: 1,
      availabilityStatus: 'available',
    },
    {
      hostel: south._id,
      roomNumber: 'B-203',
      roomType: 'triple',
      price: 16000,
      capacity: 3,
      availabilityStatus: 'booked',
    },
  ]);

  return { north, south };
}

describe('GET /api/v1/rooms', () => {
  it('filters by hostel, type, price, and availability and paginates', async () => {
    const { north } = await seedRooms();

    const all = await request(app).get('/api/v1/rooms');
    expect(all.status).toBe(200);
    expect(all.body.data.pagination.total).toBe(5);

    const singles = await request(app).get('/api/v1/rooms').query({ roomType: 'single' });
    expect(singles.body.data.rooms).toHaveLength(3);

    const priced = await request(app)
      .get('/api/v1/rooms')
      .query({ minPrice: 8500, maxPrice: 12000 });
    expect(
      priced.body.data.rooms.map((room: { roomNumber: string }) => room.roomNumber).sort(),
    ).toEqual(['A-102', 'A-105', 'B-201']);

    const available = await request(app).get('/api/v1/rooms').query({ available: 'true' });
    expect(available.body.data.pagination.total).toBe(3);

    const hostel = await request(app)
      .get('/api/v1/rooms')
      .query({ hostel: String(north._id) });
    expect(hostel.body.data.pagination.total).toBe(3);

    const page = await request(app).get('/api/v1/rooms').query({ limit: 2, page: 2 });
    expect(page.body.data.rooms).toHaveLength(2);
    expect(page.body.data.pagination).toMatchObject({ page: 2, limit: 2, total: 5, totalPages: 3 });
  });

  it('rejects an unknown room type', async () => {
    const response = await request(app).get('/api/v1/rooms').query({ roomType: 'castle' });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
