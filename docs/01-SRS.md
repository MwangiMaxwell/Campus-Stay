# Software Requirements Specification

## 1. Purpose

CampusStay is a web system that lets university students find a hostel room, reserve it, and pay the booking fee with M-Pesa. Staff use the same system to manage rooms, approve or cancel bookings, and print reports.

This specification is the agreement for the five-person course project. Later design and test documents refer to the requirement IDs in section 4.

## 2. Scope

The system covers one university organization per deployment.

In scope:

- Accounts for students, admins, and one super admin
- Hostel and room records
- Search and booking of a room
- Booking-fee payment through M-Pesa
- Approval, cancellation, and reporting

Out of scope:

- A native mobile app
- Card payments or cash recorded outside M-Pesa
- Maintenance work orders
- More than one university in a single database
- Collecting the full term's rent. The payment in this release is the booking fee

## 3. User classes

| Class       | Description                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------ |
| Student     | A registered learner who searches, books, and pays. Public registration always creates this role.                  |
| Admin       | Hostel staff who manage rooms, approve or cancel bookings, and read reports. An admin cannot create another admin. |
| Super admin | The organization owner. Has every admin ability and can create or change staff accounts.                           |
| Guest       | A visitor who can open the public pages and create a student account.                                              |

## 4. Functional requirements

### FR1 User registration and login

The system shall support register, login, logout, and forgot password, with separate access for admins and super admins.

Acceptance notes for this release:

- A visitor registers with full name, email, phone, and password. A student registration number is optional.
- Registration creates an active student. It never creates an admin.
- Login checks the password and rejects a suspended account.
- Logout clears the session cookie.
- Forgot password and reset password are routed and validated. Sending the email and storing the reset token is unfinished and marked `TODO(member-4)`.
- Admins and the super admin use the same login page. Their role decides which pages they can open.

### FR2 Room search and browsing

The system shall let a user filter rooms by hostel, room type, price, and availability.

Acceptance notes:

- `GET /api/v1/rooms` accepts `hostel`, `roomType`, `minPrice`, `maxPrice`, `available`, `page`, and `limit`.
- Room types are single, double, triple, and bedsitter.
- Availability is available, booked, or maintenance. The `available=true` filter returns only available rooms.
- Results are paginated. The student search screen is a placeholder for Member 3.

### FR3 Room booking, main transaction

A logged-in student books an available room. The same room cannot be booked twice.

Acceptance notes:

- Booking routes require a student session.
- The request names a room and a check-in and check-out date. The server, not the browser, decides the fee.
- A room may have only one booking in `pending` or `approved` status. The database enforces this with a partial unique index.
- Creating, listing, cancelling, approving, and completing bookings is unfinished and marked `TODO(member-4)`.

### FR4 Payment processing

The student pays the booking fee via M-Pesa. The system records each payment and sends confirmation.

Acceptance notes:

- The student submits a booking id and a phone number. The amount is read from the booking, not from the request body.
- Each attempt stores status `pending`, `success`, or `failed`, plus M-Pesa request ids and the receipt number when Safaricom sends one.
- Receipt numbers are unique.
- The STK push, the callback, and the confirmation message are unfinished and marked `TODO(member-4)`.

### FR5 Admin management and reports

Admins add, edit, and delete rooms and users, approve or cancel bookings, and open filterable reports for bookings, payments, and occupancy. A report shows the date, the organization name, and the logo.

Acceptance notes:

- Admin routes require an admin or the super admin.
- Creating, updating, and deleting users is limited to the super admin. Only a super admin may assign the super admin role.
- Report filters include a date range and, where it makes sense, status or hostel.
- Report data includes `ORG_NAME` and `ORG_LOGO_URL` from the environment.
- Admin actions and the report queries are unfinished. User, room, and booking work is `TODO(member-4)`. Reports are `TODO(member-5)`.

## 5. Non-functional requirements

### NFR1 Security

Passwords are hashed. Queries are safe from operator injection. An audit log records important actions with who and when.

Built in this skeleton:

- bcrypt cost 12
- JWT in an httpOnly, SameSite cookie, with a short expiry, and the secure flag in production
- Zod validation before any query
- Request keys that start with `$` or contain `.` are removed
- Mongoose `sanitizeFilter` is enabled
- Role middleware on every protected route
- Audit entries for register, login, logout, and failed login
- Rate limits on register, login, and password reset
- Helmet and a single allowed browser origin

Audit entries for password reset, admin changes, booking decisions, and payment results are part of the unfinished handlers. The helper `recordAudit` is ready for those handlers.

### NFR2 Usability

A first-time student completes a booking in under 5 minutes without training. Error messages are clear.

The registration and login forms use plain labels and show the first field error from the API. The booking path itself is not built yet. Member 3 must keep the future search, booking, and payment screens inside that five-minute path. Member 1 will time it during acceptance and record the result in the user manual.

### NFR3 Performance and reliability

Pages load in under 3 seconds, and the system supports at least 100 concurrent users.

The skeleton does not claim this target is measured yet. Member 5 will add a simple concurrent-load check before the final demo. The API paginates room results and limits request bodies to 1 MB so one client cannot request an unbounded list.

## 6. Assumptions

- Students already have a Safaricom line that can complete an STK push.
- Staff accounts are created by the super admin, or by the seed script in development.
- One organization name and one logo apply to every report.
- Hostel prices are Kenyan shillings per month.
- Email addresses are unique and stored in lower case.
- The course demo uses the Daraja sandbox, not live money.

## 7. Constraints

- The team has five members and the course milestone dates in [09-PROJECT-PLAN.md](09-PROJECT-PLAN.md).
- The database is MongoDB Atlas.
- Payments use Safaricom Daraja. The callback URL must be reachable from the internet.
- The implementation stays in this monorepo. New heavy libraries need the team's agreement.
