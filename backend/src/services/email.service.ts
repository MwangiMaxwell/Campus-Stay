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

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function sendEmail(message: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
    throw new Error('Email service is not configured');
  }

  await transporter.sendMail({ from: env.EMAIL_FROM, ...message });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  await sendEmail({
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
      <p><a href="${escapeHtml(resetUrl)}">Reset your password</a></p>
      <p>This link expires in 30 minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  });
}

export interface PaymentConfirmation {
  fullName: string;
  amount: number;
  receipt?: string;
  hostelName?: string;
  roomNumber?: string;
}

// FR4: confirm every successful payment to the student.
export async function sendPaymentConfirmationEmail(
  email: string,
  details: PaymentConfirmation,
): Promise<void> {
  const room =
    details.hostelName && details.roomNumber
      ? `${details.hostelName} ${details.roomNumber}`
      : 'your room';
  const receipt = details.receipt ?? 'pending';
  const amount = `KES ${new Intl.NumberFormat('en-KE').format(details.amount)}`;

  await sendEmail({
    to: email,
    subject: 'CampusStay payment received',
    text: [
      `Hello ${details.fullName},`,
      '',
      `We received your M-Pesa payment of ${amount} for ${room}.`,
      `M-Pesa receipt: ${receipt}`,
      '',
      'The housing office will review and approve your booking. You can follow its status in the Bookings page.',
    ].join('\n'),
    html: `
      <h2>Payment received</h2>
      <p>Hello ${escapeHtml(details.fullName)},</p>
      <p>We received your M-Pesa payment of <strong>${escapeHtml(amount)}</strong> for ${escapeHtml(room)}.</p>
      <p>M-Pesa receipt: <strong>${escapeHtml(receipt)}</strong></p>
      <p>The housing office will review and approve your booking. You can follow its status in the Bookings page.</p>
    `,
  });
}
