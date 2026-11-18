import { afterEach, describe, expect, it } from 'vitest';
import { env } from '@/config/env';
import { AuditLog, Booking, Hostel, Payment, Room } from '@/models';
import { runBookingMaintenance } from '@/services/booking.service';
import { SIMULATED_PROMPT_DELAY_MS } from '@/services/mpesa.service';
import { createAccount, login, stayDates } from './helpers';

async function seedRoom(number = 'L-101', price = 8000) {
  const manager = await createAccount('admin', `manager-${number}@campusstay.test`);
  const hostel = await Hostel.create({
    name: `Hostel ${number}`,
    location: 'Nairobi',
    contactPhone: '+254700000099',
    manager: manager._id,
  });
  const room = await Room.create({
    hostel: hostel._id,
    roomNumber: number,
    roomType: 'single',
    price,
    capacity: 1,
    availabilityStatus: 'available',
  });
  return { hostel, room };
}

async function bookAs(email: string, roomId: string) {
  await createAccount('student', email);
  const session = await login(email);
  const response = await session.post('/api/v1/bookings').send({ roomId, ...stayDates() });
  expect(response.status).toBe(201);
  return { session, bookingId: String(response.body.data._id) };
}

async function markPaid(bookingId: string, amount = 8000) {
  return Payment.create({
    booking: bookingId,
    amount,
    phoneNumber: '254711000001',
    status: 'success',
    mpesaReceiptNo: 'RCP12345',
    paymentDate: new Date(),
  });
}

describe('booking rules', () => {
  it('rejects past check-in dates and stays longer than a year', async () => {
    const { room } = await seedRoom();
    await createAccount('student', 'rules1@campusstay.test');
    const session = await login('rules1@campusstay.test');

    const past = await session
      .post('/api/v1/bookings')
      .send({ roomId: String(room._id), ...stayDates(-10, 20) });
    expect(past.status).toBe(400);

    const tooLong = await session
      .post('/api/v1/bookings')
      .send({ roomId: String(room._id), ...stayDates(10, 400) });
    expect(tooLong.status).toBe(400);
  });

  it('allows only one active booking per student', async () => {
    const first = await seedRoom('L-201');
    const second = await seedRoom('L-202');
    const { session } = await bookAs('rules2@campusstay.test', String(first.room._id));

    const again = await session
      .post('/api/v1/bookings')
      .send({ roomId: String(second.room._id), ...stayDates() });
    expect(again.status).toBe(409);
  });

  it('releases unpaid holds after the hold period but keeps paid bookings', async () => {
    const unpaidRoom = await seedRoom('L-301');
    const paidRoom = await seedRoom('L-302');
    const unpaid = await bookAs('hold1@campusstay.test', String(unpaidRoom.room._id));
    const paid = await bookAs('hold2@campusstay.test', String(paidRoom.room._id));
    await markPaid(paid.bookingId);

    const later = new Date(Date.now() + (env.BOOKING_HOLD_HOURS + 1) * 60 * 60 * 1000);
    const result = await runBookingMaintenance(later);

    expect(result.expired).toBe(1);
    expect((await Booking.findById(unpaid.bookingId))?.status).toBe('cancelled');
    expect((await Room.findById(unpaidRoom.room._id))?.availabilityStatus).toBe('available');
    expect((await Booking.findById(paid.bookingId))?.status).toBe('pending');
  });

  it('completes approved stays after the check-out date', async () => {
    const { room } = await seedRoom('L-401');
    const { bookingId } = await bookAs('auto1@campusstay.test', String(room._id));
    await markPaid(bookingId);
    await Booking.updateOne({ _id: bookingId }, { $set: { status: 'approved' } });

    const later = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const result = await runBookingMaintenance(later);

    expect(result.completed).toBe(1);
    expect((await Booking.findById(bookingId))?.status).toBe('completed');
    expect((await Room.findById(room._id))?.availabilityStatus).toBe('available');
  });

  it('does not let a student cancel a booking that is already paid', async () => {
    const { room } = await seedRoom('L-501');
    const { session, bookingId } = await bookAs('paidcancel@campusstay.test', String(room._id));
    await markPaid(bookingId);

    const response = await session.patch(`/api/v1/bookings/${bookingId}/cancel`);
    expect(response.status).toBe(409);
  });

  it('lists the latest payment with each booking', async () => {
    const { room } = await seedRoom('L-601');
    const { session, bookingId } = await bookAs('latest@campusstay.test', String(room._id));
    await markPaid(bookingId);

    const list = await session.get('/api/v1/bookings');
    expect(list.body.data[0].latestPayment.status).toBe('success');
  });
});

describe('admin booking workflow', () => {
  it('requires payment before approval, then approves and completes', async () => {
    const { room } = await seedRoom('A-101');
    const { bookingId } = await bookAs('flow1@campusstay.test', String(room._id));
    await createAccount('admin', 'staff1@campusstay.test');
    const admin = await login('staff1@campusstay.test');

    const early = await admin.patch(`/api/v1/admin/bookings/${bookingId}/approve`);
    expect(early.status).toBe(409);

    await markPaid(bookingId);

    const approved = await admin.patch(`/api/v1/admin/bookings/${bookingId}/approve`);
    expect(approved.status).toBe(200);
    expect(approved.body.data.booking.status).toBe('approved');

    const completed = await admin.patch(`/api/v1/admin/bookings/${bookingId}/complete`);
    expect(completed.status).toBe(200);
    expect(completed.body.data.booking.status).toBe('completed');
    expect((await Room.findById(room._id))?.availabilityStatus).toBe('available');

    const again = await admin.patch(`/api/v1/admin/bookings/${bookingId}/complete`);
    expect(again.status).toBe(409);
  });

  it('cancels a booking, frees the room and flags a refund when it was paid', async () => {
    const { room } = await seedRoom('A-201');
    const { bookingId } = await bookAs('flow2@campusstay.test', String(room._id));
    await markPaid(bookingId);
    await createAccount('admin', 'staff2@campusstay.test');
    const admin = await login('staff2@campusstay.test');

    const response = await admin.patch(`/api/v1/admin/bookings/${bookingId}/cancel`);
    expect(response.status).toBe(200);
    expect(response.body.data.refundDue).toBe(true);
    expect((await Room.findById(room._id))?.availabilityStatus).toBe('available');

    const logs = await AuditLog.find({ action: 'booking.cancel' });
    expect(logs.length).toBeGreaterThan(0);
  });

  it('lists bookings with the latest payment and filters by status', async () => {
    const { room } = await seedRoom('A-301');
    const { bookingId } = await bookAs('flow3@campusstay.test', String(room._id));
    await markPaid(bookingId);
    await createAccount('admin', 'staff3@campusstay.test');
    const admin = await login('staff3@campusstay.test');

    const list = await admin.get('/api/v1/admin/bookings?status=pending');
    expect(list.status).toBe(200);
    expect(list.body.data.bookings).toHaveLength(1);
    expect(list.body.data.bookings[0].latestPayment.status).toBe('success');

    const none = await admin.get('/api/v1/admin/bookings?status=approved');
    expect(none.body.data.bookings).toHaveLength(0);
  });

  it('lists payments for staff and hides them from students', async () => {
    const { room } = await seedRoom('A-401');
    const { session, bookingId } = await bookAs('flow4@campusstay.test', String(room._id));
    await markPaid(bookingId);
    await createAccount('admin', 'staff4@campusstay.test');
    const admin = await login('staff4@campusstay.test');

    const list = await admin.get('/api/v1/admin/payments?status=success');
    expect(list.status).toBe(200);
    expect(list.body.data.payments).toHaveLength(1);

    const denied = await session.get('/api/v1/admin/payments');
    expect(denied.status).toBe(403);
  });

  it('will not put a room into maintenance while a booking is active', async () => {
    const { room } = await seedRoom('A-501');
    await bookAs('flow5@campusstay.test', String(room._id));
    await createAccount('admin', 'staff5@campusstay.test');
    const admin = await login('staff5@campusstay.test');

    const response = await admin
      .patch(`/api/v1/admin/rooms/${room._id}`)
      .send({ availabilityStatus: 'maintenance' });
    expect(response.status).toBe(409);
  });
});

describe('reports and dashboard', () => {
  it('builds the bookings, payments and occupancy reports and the dashboard', async () => {
    const { room, hostel } = await seedRoom('R-101');
    const { bookingId } = await bookAs('report1@campusstay.test', String(room._id));
    await markPaid(bookingId);
    await createAccount('admin', 'staff6@campusstay.test');
    const admin = await login('staff6@campusstay.test');

    const bookings = await admin.get('/api/v1/admin/reports/bookings');
    expect(bookings.status).toBe(200);
    expect(bookings.body.data.report.summary.total).toBe(1);
    expect(bookings.body.data.report.rows[0].paymentStatus).toBe('success');
    expect(bookings.body.data.report.organization.name).toBeTruthy();

    const payments = await admin.get('/api/v1/admin/reports/payments');
    expect(payments.body.data.report.summary.totalCollected).toBe(8000);

    const occupancy = await admin.get(`/api/v1/admin/reports/occupancy?hostelId=${hostel._id}`);
    expect(occupancy.status).toBe(200);
    expect(occupancy.body.data.report.summary.totalRooms).toBe(1);
    expect(occupancy.body.data.report.summary.booked).toBe(1);

    const dashboard = await admin.get('/api/v1/admin/dashboard');
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.data.dashboard.bookings.awaitingApproval).toBe(1);
    expect(dashboard.body.data.dashboard.payments.collectedTotal).toBe(8000);
  });

  it('serves the audit log to staff', async () => {
    const { room } = await seedRoom('R-201');
    await bookAs('report2@campusstay.test', String(room._id));
    await createAccount('admin', 'staff7@campusstay.test');
    const admin = await login('staff7@campusstay.test');

    const response = await admin.get('/api/v1/admin/audit-logs?action=booking.create');
    expect(response.status).toBe(200);
    expect(response.body.data.logs.length).toBeGreaterThan(0);
  });
});

describe('hostels and user permissions', () => {
  it('lets staff create and edit hostels and exposes them publicly', async () => {
    await createAccount('admin', 'staff8@campusstay.test');
    const admin = await login('staff8@campusstay.test');

    const created = await admin
      .post('/api/v1/admin/hostels')
      .send({ name: 'Baraka House', location: 'Kileleshwa', contactPhone: '+254700111222' });
    expect(created.status).toBe(201);

    const duplicate = await admin
      .post('/api/v1/admin/hostels')
      .send({ name: 'Baraka House', location: 'Kileleshwa', contactPhone: '+254700111222' });
    expect(duplicate.status).toBe(409);

    const updated = await admin
      .patch(`/api/v1/admin/hostels/${created.body.data.hostel.id}`)
      .send({ location: 'Westlands' });
    expect(updated.body.data.hostel.location).toBe('Westlands');
  });

  it('stops admins from managing staff, and users from changing their own role', async () => {
    const other = await createAccount('admin', 'other-admin@campusstay.test');
    const owner = await createAccount('super_admin', 'owner2@campusstay.test');
    await createAccount('admin', 'staff9@campusstay.test');
    const admin = await login('staff9@campusstay.test');

    const editStaff = await admin
      .patch(`/api/v1/admin/users/${other._id}`)
      .send({ fullName: 'Renamed' });
    expect(editStaff.status).toBe(403);

    const createStaff = await admin.post('/api/v1/admin/users').send({
      fullName: 'New Staff',
      email: 'newstaff@campusstay.test',
      phone: '+254700333444',
      password: 'Student#2026',
      role: 'admin',
    });
    expect(createStaff.status).toBe(403);

    const superSession = await login('owner2@campusstay.test');
    const selfChange = await superSession
      .patch(`/api/v1/admin/users/${owner._id}`)
      .send({ role: 'student' });
    expect(selfChange.status).toBe(409);

    const superEdit = await superSession
      .patch(`/api/v1/admin/users/${other._id}`)
      .send({ fullName: 'Renamed Staff' });
    expect(superEdit.status).toBe(200);
  });
});

describe('profile', () => {
  it('updates the profile and changes the password', async () => {
    await createAccount('student', 'profile1@campusstay.test');
    const session = await login('profile1@campusstay.test');

    const updated = await session
      .patch('/api/v1/auth/me')
      .send({ fullName: 'Grace Njeri', phone: '+254722000111' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.user.fullName).toBe('Grace Njeri');

    const empty = await session.patch('/api/v1/auth/me').send({});
    expect(empty.status).toBe(400);

    const wrong = await session
      .post('/api/v1/auth/change-password')
      .send({ currentPassword: 'Nope#12345', newPassword: 'Brand#New2026' });
    expect(wrong.status).toBe(400);

    const changed = await session
      .post('/api/v1/auth/change-password')
      .send({ currentPassword: 'Student#2026', newPassword: 'Brand#New2026' });
    expect(changed.status).toBe(200);

    const relogin = await session
      .post('/api/v1/auth/login')
      .send({ email: 'profile1@campusstay.test', password: 'Brand#New2026' });
    expect(relogin.status).toBe(200);
  });
});

describe('simulated M-Pesa', () => {
  const original = env.MPESA_SIMULATE;

  afterEach(() => {
    Object.assign(env, { MPESA_SIMULATE: original });
  });

  it('confirms a simulated payment through the real callback handler', async () => {
    Object.assign(env, { MPESA_SIMULATE: true });
    const { room } = await seedRoom('S-101', 6500);
    const { session, bookingId } = await bookAs('sim1@campusstay.test', String(room._id));

    const response = await session
      .post('/api/v1/payments')
      .send({ bookingId, phoneNumber: '+254711000001' });
    expect(response.status).toBe(201);
    expect(response.body.data.payment.status).toBe('pending');
    expect(response.body.data.payment.amount).toBe(6500);

    await new Promise((resolve) => setTimeout(resolve, SIMULATED_PROMPT_DELAY_MS + 1000));

    const payment = await Payment.findOne({ booking: bookingId });
    expect(payment?.status).toBe('success');
    expect(payment?.mpesaReceiptNo).toBeTruthy();
  }, 20_000);
});
