import { describe, expect, it } from 'vitest';
import { Hostel } from '../src/models/hostel.model';
import { Room } from '../src/models/room.model';
import { AuditLog } from '../src/models/auditLog.model';
import { agent, createAccount } from './helpers';

describe('Admin room management', () => {
  it('allows an admin to list rooms with hostel details and pagination', async () => {
    const admin = await createAccount('admin', 'admin@campusstay.test');

    const hostel = await Hostel.create({
      name: 'Kilimo Hostels',
      location: 'North Campus',
      contactPhone: '+254700000001',
      manager: admin._id,
    });

    await Room.create([
      {
        hostel: hostel._id,
        roomNumber: 'A-101',
        roomType: 'single',
        price: 8000,
        capacity: 1,
        availabilityStatus: 'available',
      },
      {
        hostel: hostel._id,
        roomNumber: 'A-102',
        roomType: 'double',
        price: 12000,
        capacity: 2,
        availabilityStatus: 'available',
      },
    ]);

    const session = agent();

    await session.post('/api/v1/auth/login').send({
      email: 'admin@campusstay.test',
      password: 'Student#2026',
    });

    const response = await session.get('/api/v1/admin/rooms').query({ page: 1, limit: 1 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.rooms).toHaveLength(1);

    expect(response.body.data.rooms[0].hostel).toMatchObject({
      id: String(hostel._id),
      name: 'Kilimo Hostels',
      location: 'North Campus',
      contactPhone: '+254700000001',
    });

    expect(response.body.data.pagination).toMatchObject({
      page: 1,
      limit: 1,
      total: 2,
      totalPages: 2,
    });
  });

  it('rejects a student trying to access admin rooms', async () => {
    await createAccount('student', 'student@campusstay.test');

    const session = agent();

    await session.post('/api/v1/auth/login').send({
      email: 'student@campusstay.test',
      password: 'Student#2026',
    });

    const response = await session.get('/api/v1/admin/rooms');

    expect(response.status).toBe(403);
  });

  it('rejects an unauthenticated request', async () => {
    const session = agent();

    const response = await session.get('/api/v1/admin/rooms');

    expect(response.status).toBe(401);
  });

  it('allows an admin to create a room and records an audit log', async () => {
    const admin = await createAccount('admin', 'create-admin@campusstay.test');

    const hostel = await Hostel.create({
      name: 'Sunrise Hostels',
      location: 'South Campus',
      contactPhone: '+254700000002',
      manager: admin._id,
    });

    const session = agent();

    await session.post('/api/v1/auth/login').send({
      email: 'create-admin@campusstay.test',
      password: 'Student#2026',
    });

    const response = await session.post('/api/v1/admin/rooms').send({
      hostelId: String(hostel._id),
      roomNumber: 'B-101',
      roomType: 'single',
      price: 9000,
      capacity: 1,
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.room.roomNumber).toBe('B-101');
    expect(response.body.data.room.availabilityStatus).toBe('available');
    expect(response.body.data.room.hostel.name).toBe('Sunrise Hostels');

    const savedRoom = await Room.findOne({ roomNumber: 'B-101' });
    expect(savedRoom).not.toBeNull();

    const audit = await AuditLog.findOne({
      action: 'admin.room.create',
      targetId: String(savedRoom!._id),
    });

    expect(audit).not.toBeNull();
    expect(String(audit!.user)).toBe(String(admin._id));
  });

  it('rejects room creation when the hostel does not exist', async () => {
    await createAccount('admin', 'missing-hostel@campusstay.test');

    const session = agent();

    await session.post('/api/v1/auth/login').send({
      email: 'missing-hostel@campusstay.test',
      password: 'Student#2026',
    });

    const response = await session.post('/api/v1/admin/rooms').send({
      hostelId: '507f1f77bcf86cd799439011',
      roomNumber: 'C-101',
      roomType: 'single',
      price: 9000,
      capacity: 1,
    });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(await Room.countDocuments()).toBe(0);
  });

  it('rejects duplicate room numbers within the same hostel', async () => {
    const admin = await createAccount('admin', 'duplicate-room@campusstay.test');

    const hostel = await Hostel.create({
      name: 'Green View Hostels',
      location: 'North Campus',
      contactPhone: '+254700000003',
      manager: admin._id,
    });

    await Room.create({
      hostel: hostel._id,
      roomNumber: 'D-101',
      roomType: 'single',
      price: 8500,
      capacity: 1,
    });

    const session = agent();

    await session.post('/api/v1/auth/login').send({
      email: 'duplicate-room@campusstay.test',
      password: 'Student#2026',
    });

    const response = await session.post('/api/v1/admin/rooms').send({
      hostelId: String(hostel._id),
      roomNumber: 'D-101',
      roomType: 'double',
      price: 12000,
      capacity: 2,
    });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(await Room.countDocuments({ hostel: hostel._id })).toBe(1);
  });
});
