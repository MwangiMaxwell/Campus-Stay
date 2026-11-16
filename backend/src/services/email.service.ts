import nodemailer from 'nodemailer';
import { env } from '@/config/env';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || 'localhost',
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth:
    env.SMTP_USER && env.SMTP_PASSWORD
      ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
        }
      : undefined,
});

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
    throw new Error('Email service is not configured');
  }

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: email,
    subject: 'Reset your CampusStay password',
    text: [
      'We received a request to reset your CampusStay password.',
      '',
      `Use this link to reset your password: ${resetUrl}`,
      '',
      'This link expires in 30 minutes.',
      'If you did not request this, you can ignore this email.',
    ].join('\n'),
    html: `
      <h2>Reset your CampusStay password</h2>
      <p>We received a request to reset your password.</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>This link expires in 30 minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  });
}
