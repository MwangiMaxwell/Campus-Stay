import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { agent, app, createAccount, studentPayload } from './helpers';

const roomId = '507f1f77bcf86cd799439011';

describe('role protection', () => {
  it('blocks guests and students from admin routes and lets an admin access users', async () => {
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
    expect(allowed.status).toBe(200);
    expect(allowed.body.success).toBe(true);

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

  it('allows a super admin to suspend another user', async () => {
    // Create the super admin account.
    await createAccount('super_admin', 'root@campusstay.test');

    // Create a separate user who will be suspended.
    await createAccount('admin', 'target@campusstay.test');

    const session = agent();
    await session.post('/api/v1/auth/login').send({
      email: 'root@campusstay.test',
      password: 'Student#2026',
    });

    // Find the target user's ID using the admin users endpoint.
    const usersResponse = await session.get('/api/v1/admin/users');
    expect(usersResponse.status).toBe(200);

    const targetUser = usersResponse.body.data.users.find(
      (user: { email: string }) => user.email === 'target@campusstay.test',
    );

    expect(targetUser).toBeDefined();

    console.log('TARGET USER:', targetUser);

    const response = await session.delete(`/api/v1/admin/users/${targetUser.id}`);

    console.log('SUSPENSION RESPONSE:', JSON.stringify(response.body, null, 2));

    expect(response.status).toBe(200);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
