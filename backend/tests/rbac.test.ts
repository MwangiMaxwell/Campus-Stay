import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { agent, app, createAccount, studentPayload } from './helpers';

const roomId = '507f1f77bcf86cd799439011';

describe('role protection', () => {
  it('blocks guests and students from admin routes and lets an admin reach the stub', async () => {
    const guest = await request(app).get('/api/v1/admin/users');
    expect(guest.status).toBe(401);

    const studentSession = agent();
    await studentSession.post('/api/v1/auth/register').send(studentPayload);
    const student = await studentSession.get('/api/v1/admin/users');
    expect(student.status).toBe(403);

    await createAccount('admin', 'admin@campusstay.test');
    const adminSession = agent();
    await adminSession.post('/api/v1/auth/login').send({
      email: 'admin@campusstay.test',
      password: 'Student#2026',
    });
    const allowed = await adminSession.get('/api/v1/admin/users');
    expect(allowed.status).toBe(501);
    expect(allowed.body.success).toBe(false);

    const deniedDelete = await adminSession.delete(`/api/v1/admin/users/${roomId}`);
    expect(deniedDelete.status).toBe(403);
  });

  it('requires a student session for bookings and validates the body before the stub', async () => {
    const guest = await request(app).get('/api/v1/bookings');
    expect(guest.status).toBe(401);

    const session = agent();
    await session.post('/api/v1/auth/register').send({
      ...studentPayload,
      email: 'booker@campusstay.test',
    });

    const invalid = await session.post('/api/v1/bookings').send({ roomId: 'nope' });
    expect(invalid.status).toBe(400);

    const valid = await session.post('/api/v1/bookings').send({
      roomId,
      checkInDate: '2026-11-01',
      checkOutDate: '2026-12-01',
    });
    expect(valid.status).toBe(501);
  });

  it('lets a super admin reach a super-admin stub', async () => {
    await createAccount('super_admin', 'root@campusstay.test');
    const session = agent();
    await session.post('/api/v1/auth/login').send({
      email: 'root@campusstay.test',
      password: 'Student#2026',
    });
    const response = await session.delete(`/api/v1/admin/users/${roomId}`);
    expect(response.status).toBe(501);
  });
});
