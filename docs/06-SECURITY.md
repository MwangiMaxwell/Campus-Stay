# Security

This document lists the threats that matter for a hostel system and the control that exists in this repository. It is the design record. The public reporting process is in the root [SECURITY.md](../SECURITY.md).

## 1. Threats and mitigations

| Threat                                    | What could go wrong                                            | Mitigation in this project                                                                                                                                                                                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stolen password database                  | An attacker reads `passwordHash` and cracks weak passwords     | bcrypt with cost 12. The field is `select: false`. Responses are built with `toPublicUser`, and `toJSON` deletes the hash.                                                                                                                           |
| Session theft through script              | A cross-site script reads the JWT                              | The token is only in an `HttpOnly` cookie. It is not written to `localStorage`.                                                                                                                                                                      |
| Session sent from another site            | A foreign page triggers a logged-in action                     | `SameSite=Lax`. State-changing routes use JSON, which a simple cross-site form does not send as `application/json`.                                                                                                                                  |
| Cookie leaked on plain HTTP in production | A network observer copies the cookie                           | `Secure` is set when `NODE_ENV` is production.                                                                                                                                                                                                       |
| Long-lived stolen cookie                  | A copied cookie works for weeks                                | Default lifetime is 15 minutes. Protected API calls reload the user, so a suspended account stops working immediately.                                                                                                                               |
| Privilege escalation at signup            | A visitor posts `role: super_admin`                            | The register schema has no role field. The service sets `student`.                                                                                                                                                                                   |
| Admin actions by a student                | A student calls `/api/v1/admin`                                | `authenticate` then `requireRole`. User create, update, and delete also require `super_admin`.                                                                                                                                                       |
| Forged admin page                         | A student opens `/admin`                                       | `frontend/src/middleware.ts` verifies the JWT and redirects students to `/rooms`. The API still checks the role.                                                                                                                                     |
| NoSQL operator injection                  | A body such as `{ "email": { "$gt": "" } }` matches every user | Zod requires a string email. `sanitizeInput` drops keys that start with `$` or contain `.`. Mongoose `sanitizeFilter` is enabled. Comparison operators the room service writes are wrapped in `mongoose.trusted()` after Zod has parsed the numbers. |
| Prototype pollution                       | A key named `__proto__` changes object behavior                | Those keys are dropped with `$` and dotted keys.                                                                                                                                                                                                     |
| Password guessing                         | Repeated login attempts                                        | Register, login, forgot password, and reset are limited to 10 requests per 15 minutes per IP.                                                                                                                                                        |
| Verbose errors                            | A stack trace reveals the schema                               | Clients receive a message. Stacks stay in the server log. Production startup refuses the example JWT secret.                                                                                                                                         |
| Audit tampering                           | Someone edits history                                          | Audit hooks reject updates and deletes. New events are inserts.                                                                                                                                                                                      |
| Sensitive data in the audit log           | A meta object contains a password                              | `recordAudit` strips `password`, `passwordHash`, `token`, and `tokenHash`.                                                                                                                                                                           |
| Payment amount tampering                  | The browser sends a tiny amount                                | The payment schema has no amount field. Member 4 must read the fee from the booking.                                                                                                                                                                 |
| Fake M-Pesa callback                      | Anyone posts a success callback                                | The route is public because Daraja calls it. Member 4 must verify the payload before marking a payment successful. The handler is still a 501 stub.                                                                                                  |
| Double booking race                       | Two students book one room together                            | Partial unique index `uniq_active_booking_per_room`.                                                                                                                                                                                                 |
| Secret in git                             | A connection string is committed                               | `.gitignore` excludes `.env`. Only `.env.example` is tracked.                                                                                                                                                                                        |
| Loose CORS                                | Any website can call the API with cookies                      | `origin` is `CLIENT_URL` and `credentials` is true. The browser app uses a same-site proxy by default.                                                                                                                                               |
| Security headers missing                  | Clickjacking or MIME sniffing                                  | `helmet()` is enabled. `x-powered-by` is disabled.                                                                                                                                                                                                   |
| Oversized body                            | A huge JSON payload uses memory                                | JSON is limited to 1 MB.                                                                                                                                                                                                                             |

## 2. Controls that are specified but not finished

These are assigned, not forgotten:

- Password reset must store `tokenHash`, expire it with the TTL index, and write `auth.password_reset`. Owner: Member 4.
- Admin create, update, and delete must call `recordAudit`. Owner: Member 4.
- Booking approve and cancel must call `recordAudit`. Owner: Member 4.
- Payment success and failure must call `recordAudit`. Owner: Member 4.
- The Daraja callback must be authenticated before the payment status changes. Owner: Member 4.
- Member 5 reviews a sample of audit rows before the final demo.

## 3. Demo accounts

The seed passwords are published in the README so the class can sign in. They are safe only on a private database. Production must use different passwords and a unique `JWT_SECRET`.

## 4. Logging

Pino logs method, path, status, and duration. It does not log bodies. Do not add request-body logging without a review, because bodies contain passwords.
