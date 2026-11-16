import { describe, expect, it } from 'vitest';
import { AuditLog, Hostel, Room } from '@/models';
import { agent, createAccount } from './helpers';

const dates = {
  checkInDate: '2026-12-01T00:00:00.000Z',
  checkOutDate: '2027-01-01T00:00:00.000Z',
};

async function createStudentSession(email: string) {
  await createAccount('student', email);

  const session = agent();
  const login = await session.post('/api/v1/auth/login').send({
    email,
    password: 'Student#2026',
  });

  expect(login.status).toBe(200);

  return session;
}

async function createTestRoom(
  managerEmail: string,
  status: 'available' | 'booked' | 'maintenance' = 'available',
) {
  const manager = await createAccount('student', managerEmail);

  const hostel = await Hostel.create({
    name: 'Test Hostel',
    location: 'Nairobi',
    contactPhone: '+254700000099',
    manager: manager._id,
  });

  const room = await Room.create({
    hostel: hostel._id,
    roomNumber: 'A-101',
    roomType: 'single',
    price: 7000,
    capacity: 1,
    availabilityStatus: status,
  });

  return room;
}
describe('student bookings', () => {
  it('creates a booking and marks the room as booked', async () => {
    const session = await createStudentSession('booking1@campusstay.test');
    const room = await createTestRoom('manager1@campusstay.test');

    const response = await session.post('/api/v1/bookings').send({
      roomId: String(room._id),
      ...dates,
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('pending');

    const updatedRoom = await Room.findById(room._id);
    expect(updatedRoom?.availabilityStatus).toBe('booked');

    const logs = await AuditLog.find({ action: 'booking.create' });
    expect(logs).toHaveLength(1);
  });

  it('rejects a booking when the room is already booked', async () => {
    const session = await createStudentSession('booking2@campusstay.test');
    const room = await createTestRoom('manager2@campusstay.test', 'booked');

    const response = await session.post('/api/v1/bookings').send({
      roomId: String(room._id),
      ...dates,
    });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it('allows a student to view their bookings', async () => {
    const session = await createStudentSession('booking3@campusstay.test');
    const room = await createTestRoom('manager3@campusstay.test');

    const created = await session.post('/api/v1/bookings').send({
      roomId: String(room._id),
      ...dates,
    });

    expect(created.status).toBe(201);

    const list = await session.get('/api/v1/bookings');

    expect(list.status).toBe(200);
    expect(list.body.success).toBe(true);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].status).toBe('pending');

    const details = await session.get(`/api/v1/bookings/${created.body.data._id}`);

    expect(details.status).toBe(200);
    expect(details.body.data._id).toBe(created.body.data._id);
  });

  it('does not allow a student to view another student’s booking', async () => {
    const firstStudent = await createStudentSession('booking4@campusstay.test');
    const room = await createTestRoom('manager4@campusstay.test');

    const created = await firstStudent.post('/api/v1/bookings').send({
      roomId: String(room._id),
      ...dates,
    });

    expect(created.status).toBe(201);

    const secondStudent = await createStudentSession('booking5@campusstay.test');

    const response = await secondStudent.get(`/api/v1/bookings/${created.body.data._id}`);

    expect(response.status).toBe(404);
  });

  it('allows a student to cancel a pending booking and frees the room', async () => {
    const session = await createStudentSession('booking6@campusstay.test');
    const room = await createTestRoom('manager6@campusstay.test');

    const created = await session.post('/api/v1/bookings').send({
      roomId: String(room._id),
      ...dates,
    });

    expect(created.status).toBe(201);

    const response = await session.patch(`/api/v1/bookings/${created.body.data._id}/cancel`);

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('cancelled');

    const updatedRoom = await Room.findById(room._id);
    expect(updatedRoom?.availabilityStatus).toBe('available');

    const logs = await AuditLog.find({ action: 'booking.cancel' });
    expect(logs).toHaveLength(1);
  });
});
