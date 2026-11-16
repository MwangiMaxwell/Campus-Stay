import { describe, expect, it, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { AuditLog, User, PasswordResetToken } from '@/models';
import { agent, app, createAccount, studentPayload } from './helpers';
import { createHash } from 'node:crypto';

import { sendPasswordResetEmail } from '@/services/email.service';

vi.mock('@/services/email.service', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

const mockedSendEmail = vi.mocked(sendPasswordResetEmail);
describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
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

  it('requests a password reset without revealing whether an account exists', async () => {
    await createAccount('student', 'reset@campusstay.test');

    const existing = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'reset@campusstay.test' });

    const unknown = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'unknown@campusstay.test' });

    expect(existing.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(existing.body.data.message).toBe(unknown.body.data.message);
    expect(mockedSendEmail).toHaveBeenCalledTimes(1);

    const tokens = await PasswordResetToken.find({
      user: (await User.findOne({ email: 'reset@campusstay.test' }))!._id,
    });

    expect(tokens).toHaveLength(1);
    expect(tokens[0].tokenHash).not.toBe(mockedSendEmail.mock.calls[0][1]);
  });

  it('resets a password using a valid token and records an audit log', async () => {
    await createAccount('student', 'reset-success@campusstay.test');

    await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'reset-success@campusstay.test' });

    const resetUrl = mockedSendEmail.mock.calls[0][1];
    const token = new URL(resetUrl).searchParams.get('token');

    expect(token).toBeTruthy();

    const response = await request(app).post('/api/v1/auth/reset-password').send({
      token,
      password: 'NewPassword#2026',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.message).toBe('Password reset successfully');

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'reset-success@campusstay.test',
      password: 'NewPassword#2026',
    });

    expect(login.status).toBe(200);
    expect(await PasswordResetToken.countDocuments()).toBe(0);

    const logs = await AuditLog.find({ action: 'auth.password_reset' });
    expect(logs).toHaveLength(1);
  });

  it('rejects an invalid password reset token', async () => {
    const response = await request(app).post('/api/v1/auth/reset-password').send({
      token: 'this-is-an-invalid-reset-token',
      password: 'NewPassword#2026',
    });

    expect(response.status).toBe(400);
  });

  it('rejects an expired password reset token', async () => {
    const user = await createAccount('student', 'expired@campusstay.test');
    const token = 'expired-reset-token-123456789';
    const tokenHash = createHash('sha256').update(token).digest('hex');

    await PasswordResetToken.create({
      user: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() - 60_000),
    });

    const response = await request(app).post('/api/v1/auth/reset-password').send({
      token,
      password: 'NewPassword#2026',
    });

    expect(response.status).toBe(400);
    expect(await PasswordResetToken.countDocuments()).toBe(0);
  });
});
