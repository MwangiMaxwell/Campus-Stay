import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { AuditLog, User } from '@/models';
import { agent, app, createAccount, studentPayload } from './helpers';

describe('auth', () => {
  it('registers a student, sets an httpOnly cookie, and hides the password hash', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...studentPayload,
        role: 'super_admin',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(studentPayload.email);
    expect(response.body.data.user.role).toBe('student');
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');

    const setCookie = response.headers['set-cookie'];
    const cookie = Array.isArray(setCookie) ? setCookie.join(';') : String(setCookie);
    expect(cookie.toLowerCase()).toContain('httponly');

    const stored = await User.findOne({ email: studentPayload.email });
    expect(stored?.get('passwordHash')).toBeUndefined();
    const withHash = await User.findOne({ email: studentPayload.email }).select('+passwordHash');
    expect(typeof withHash?.get('passwordHash')).toBe('string');

    const logs = await AuditLog.find({ action: 'auth.register' });
    expect(logs).toHaveLength(1);
  });

  it('rejects a duplicate email and an invalid body', async () => {
    await request(app).post('/api/v1/auth/register').send(studentPayload);
    const duplicate = await request(app).post('/api/v1/auth/register').send(studentPayload);
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.success).toBe(false);

    const invalid = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.details.fieldErrors).toBeTruthy();
  });

  it('logs in, returns the current user, and logs out', async () => {
    await request(app).post('/api/v1/auth/register').send(studentPayload);
    const session = agent();

    const loginResponse = await session.post('/api/v1/auth/login').send({
      email: studentPayload.email,
      password: studentPayload.password,
    });
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.user.email).toBe(studentPayload.email);

    const me = await session.get('/api/v1/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.user.fullName).toBe(studentPayload.fullName);

    const logoutResponse = await session.post('/api/v1/auth/logout');
    expect(logoutResponse.status).toBe(200);
    const after = await session.get('/api/v1/auth/me');
    expect(after.status).toBe(401);

    const loginLogs = await AuditLog.find({ action: 'auth.login' });
    const logoutLogs = await AuditLog.find({ action: 'auth.logout' });
    expect(loginLogs.length).toBeGreaterThan(0);
    expect(logoutLogs.length).toBeGreaterThan(0);
  });

  it('rejects a bad password and a suspended account', async () => {
    await request(app).post('/api/v1/auth/register').send(studentPayload);
    const bad = await request(app).post('/api/v1/auth/login').send({
      email: studentPayload.email,
      password: 'Wrong#2026',
    });
    expect(bad.status).toBe(401);
    expect(bad.body.error.message).toBe('Invalid email or password');

    await createAccount('student', 'suspended@campusstay.test', 'suspended');
    const suspended = await request(app).post('/api/v1/auth/login').send({
      email: 'suspended@campusstay.test',
      password: 'Student#2026',
    });
    expect(suspended.status).toBe(403);
  });

  it('does not treat operator objects as an email', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: { $gt: '' },
        password: 'Student#2026',
      });
    expect(response.status).toBe(400);
  });
});
