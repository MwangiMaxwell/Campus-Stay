# Test plan

## 1. Scope

This plan covers FR1 to FR5 and NFR1 to NFR3. The automated suite protects the skeleton: health, registration, login, logout, role checks, room filters, validators, and the booking index. Flows that still return 501 are specified here so Member 5 can add tests as Members 3 and 4 finish them.

Out of scope for the automated suite: visual design, the five-minute usability timing, and a full 100-user load test. Those are manual or late-project checks.

## 2. Test types

| Type       | Where                                                               | Notes                                                      |
| ---------- | ------------------------------------------------------------------- | ---------------------------------------------------------- |
| Unit       | `frontend/src/lib/auth.test.ts`, `backend/tests/validators.test.ts` | Pure rules and Zod schemas                                 |
| API        | `backend/tests` with Supertest                                      | Hits the Express app and an in-memory MongoDB              |
| Database   | `backend/tests/booking-index.test.ts`                               | Proves the partial unique index                            |
| Route gate | `decideAccess` unit tests                                           | Student pages and `/admin`                                 |
| Manual     | Browser, recorded in the user manual                                | Register, login, logout, and the student block on `/admin` |
| Usability  | Member 1 times a new student                                        | NFR2, after booking exists                                 |
| Load       | Member 5, before the demo                                           | NFR3, at least 100 concurrent users                        |

CI runs `npm run test`. It does not need Atlas credentials.

## 3. Cases by requirement

| ID     | Case                                                     | Expected                                                          | Automated now             |
| ------ | -------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------- |
| FR1-1  | Register with a valid body                               | 201, role is student, cookie is HttpOnly, password hash is absent | Yes                       |
| FR1-2  | Register again with the same email                       | 409                                                               | Yes                       |
| FR1-3  | Register with a weak password                            | 400 and field errors                                              | Yes                       |
| FR1-4  | Register while posting `role: super_admin`               | Stored role is still student                                      | Yes                       |
| FR1-5  | Login with the right password                            | 200 and `GET /auth/me` returns the user                           | Yes                       |
| FR1-6  | Login with the wrong password                            | 401, generic message, failed-login audit                          | Yes                       |
| FR1-7  | Login to a suspended account                             | 403                                                               | Yes                       |
| FR1-8  | Logout, then call `/auth/me`                             | 200 then 401, logout audit exists                                 | Yes                       |
| FR1-9  | Forgot password with a valid email                       | 501 until Member 4 sends the message                              | Route only                |
| FR1-10 | Guest opens `/admin`                                     | Redirect to login                                                 | Unit test of the decision |
| FR1-11 | Student opens `/admin`                                   | Redirect to `/rooms`, API returns 403                             | Yes for the API           |
| FR2-1  | List rooms with no filter                                | Every seeded room, with pagination                                | Yes                       |
| FR2-2  | `roomType=single`                                        | Only single rooms                                                 | Yes                       |
| FR2-3  | `minPrice` and `maxPrice`                                | Rooms inside the range                                            | Yes                       |
| FR2-4  | `available=true`                                         | Only available rooms                                              | Yes                       |
| FR2-5  | `hostel` id                                              | Only that hostel                                                  | Yes                       |
| FR2-6  | `page` and `limit`                                       | The requested slice and `totalPages`                              | Yes                       |
| FR2-7  | Unknown room type                                        | 400                                                               | Yes                       |
| FR2-8  | Student search page shows the results                    | Placeholder today                                                 | No                        |
| FR3-1  | Guest posts a booking                                    | 401                                                               | Yes                       |
| FR3-2  | Student posts an invalid booking                         | 400                                                               | Yes                       |
| FR3-3  | Student posts a valid booking                            | 501 until implemented, then 201                                   | Route only                |
| FR3-4  | Second active booking for the same room                  | Duplicate key 11000                                               | Yes, at the model         |
| FR3-5  | After cancel, a new pending booking is allowed           | Insert succeeds                                                   | Yes, at the model         |
| FR3-6  | Admin approves, then the audit log has `booking.approve` | 501 until implemented                                             | No                        |
| FR4-1  | Student starts a payment without a phone                 | 400                                                               | Not yet                   |
| FR4-2  | Amount in the body is ignored                            | Server uses the booking fee                                       | Not yet                   |
| FR4-3  | Callback with result 0                                   | Payment `success`, unique receipt, audit                          | Not yet                   |
| FR4-4  | Callback with a failure code                             | Payment `failed` and audit                                        | Not yet                   |
| FR4-5  | Duplicate receipt number                                 | 409                                                               | Not yet                   |
| FR5-1  | Admin lists users                                        | 501, not 403                                                      | Yes                       |
| FR5-2  | Admin deletes a user                                     | 403                                                               | Yes                       |
| FR5-3  | Super admin deletes a user                               | 501                                                               | Yes                       |
| FR5-4  | Admin creates a room with a negative price               | 400                                                               | Not yet                   |
| FR5-5  | Reports include date, `ORG_NAME`, and `ORG_LOGO_URL`     | 501 until Member 5                                                | No                        |
| NFR1-1 | Login body `{ "email": { "$gt": "" } }`                  | 400, not a query                                                  | Yes                       |
| NFR1-2 | Sanitize strips `$` keys and dotted keys                 | Clean object                                                      | Yes                       |
| NFR1-3 | Register writes `auth.register`                          | One audit document                                                | Yes                       |
| NFR1-4 | Audit update is rejected                                 | Append-only error                                                 | Not yet                   |
| NFR2-1 | First booking in under 5 minutes                         | Timed script in the manual                                        | Manual, later             |
| NFR2-2 | Failed login shows a clear sentence                      | Message is `Invalid email or password`                            | Yes                       |
| NFR3-1 | Room list is bounded by `limit`                          | Max 50                                                            | Yes, validator            |
| NFR3-2 | 100 concurrent users, pages under 3 seconds              | Record the result                                                 | Manual, later             |

## 4. Acceptance criteria for the skeleton

The skeleton is acceptable when all of the following are true:

1. `npm install` completes, and `npm run dev` serves the website and the API.
2. `GET /api/v1/health` returns `ok` when `MONGODB_URI` points at a reachable database.
3. A new student can register, log in, and log out in the browser.
4. A student who opens `/admin` is not shown the admin screens.
5. `npm run seed` can be run twice without duplicate-key failures.
6. `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` pass.
7. No `.env` file with real secrets is committed.

## 5. How to run

```bash
npm run test
npm run test -w backend
npm run test -w frontend
```

Backend tests start MongoDB Memory Server. The first run downloads a binary and can take a few minutes. Later runs reuse it.

## 6. Remaining work for Member 5

Add API tests beside each `TODO(member-4)` and `TODO(member-5)` as those handlers stop returning 501. Review a sample of audit documents after the admin and payment flows exist, and confirm they store who, what, and when, and never a password.
