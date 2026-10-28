# API specification

Base URL in development: `http://localhost:4000/api/v1`.

The website calls the same paths on its own origin. Next.js proxies them to the API.

## Response shape

Success:

```json
{ "success": true, "data": {} }
```

Failure:

```json
{
  "success": false,
  "error": { "message": "Check the form and try again", "details": { "fieldErrors": {} } }
}
```

`details` is omitted when there is nothing extra to say. Validation errors use HTTP 400 and `details.fieldErrors`.

## Authentication

The login and register responses set a cookie named `token`. The cookie is `HttpOnly`, `SameSite=Lax`, and `Secure` when `NODE_ENV` is production. Send it with `credentials: include`. Clients do not put the token in `Authorization`.

Roles used below:

| Value       | Meaning                            |
| ----------- | ---------------------------------- |
| Public      | No cookie required                 |
| User        | Any active signed-in user          |
| Student     | `role` is `student`                |
| Admin       | `role` is `admin` or `super_admin` |
| Super admin | `role` is `super_admin`            |

A missing or invalid session returns 401. A signed-in user with the wrong role returns 403. A stub that passed validation and the role check returns 501 with message `Not implemented`.

## Endpoints

| Method | Path                          | Auth        | Request                                                                                  | Success                                                      | Other codes                   |
| ------ | ----------------------------- | ----------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------- |
| GET    | `/health`                     | Public      | None                                                                                     | 200 `data.status` is `ok` and `data.database` is `connected` | 503 when the database is down |
| POST   | `/auth/register`              | Public      | `fullName`, `email`, `phone`, `password`, optional `studentRegNo`                        | 201 `{ user }` and session cookie                            | 400, 409, 429                 |
| POST   | `/auth/login`                 | Public      | `email`, `password`                                                                      | 200 `{ user }` and session cookie                            | 400, 401, 403 suspended, 429  |
| POST   | `/auth/logout`                | Public      | None                                                                                     | 200 `{ message }` and the cookie is cleared                  |                               |
| GET    | `/auth/me`                    | User        | None                                                                                     | 200 `{ user }`                                               | 401                           |
| POST   | `/auth/forgot-password`       | Public      | `email`                                                                                  | Stub 501                                                     | 400, 429                      |
| POST   | `/auth/reset-password`        | Public      | `token`, `password`                                                                      | Stub 501                                                     | 400, 429                      |
| GET    | `/rooms`                      | Public      | Query below                                                                              | 200 `{ rooms, pagination }`                                  | 400                           |
| GET    | `/rooms/:id`                  | Public      | `id` ObjectId                                                                            | Stub 501                                                     | 400                           |
| POST   | `/bookings`                   | Student     | `roomId`, `checkInDate`, `checkOutDate`                                                  | Stub 501                                                     | 400, 401, 403                 |
| GET    | `/bookings`                   | Student     | None                                                                                     | Stub 501                                                     | 401, 403                      |
| GET    | `/bookings/:id`               | Student     | `id`                                                                                     | Stub 501                                                     | 400, 401, 403                 |
| PATCH  | `/bookings/:id/cancel`        | Student     | `id`                                                                                     | Stub 501                                                     | 400, 401, 403                 |
| POST   | `/payments`                   | Student     | `bookingId`, `phoneNumber`                                                               | Stub 501                                                     | 400, 401, 403                 |
| GET    | `/payments`                   | Student     | None                                                                                     | Stub 501                                                     | 401, 403                      |
| GET    | `/payments/:id`               | Student     | `id`                                                                                     | Stub 501                                                     | 400, 401, 403                 |
| POST   | `/mpesa/stk-push`             | Student     | `bookingId`, `phoneNumber`                                                               | Stub 501                                                     | 400, 401, 403                 |
| POST   | `/mpesa/callback`             | Public      | Daraja `Body.stkCallback` object                                                         | Stub 501                                                     | 400                           |
| GET    | `/admin/users`                | Admin       | Optional `role`, `status`, `page`, `limit`                                               | Stub 501                                                     | 400, 401, 403                 |
| POST   | `/admin/users`                | Super admin | User fields plus `role` and `password`                                                   | Stub 501                                                     | 400, 401, 403                 |
| GET    | `/admin/users/:id`            | Admin       | `id`                                                                                     | Stub 501                                                     | 400, 401, 403                 |
| PATCH  | `/admin/users/:id`            | Super admin | Any subset of the create fields                                                          | Stub 501                                                     | 400, 401, 403                 |
| DELETE | `/admin/users/:id`            | Super admin | `id`                                                                                     | Stub 501                                                     | 400, 401, 403                 |
| GET    | `/admin/rooms`                | Admin       | Optional `page`, `limit`                                                                 | Stub 501                                                     | 400, 401, 403                 |
| POST   | `/admin/rooms`                | Admin       | `hostelId`, `roomNumber`, `roomType`, `price`, `capacity`, optional `availabilityStatus` | Stub 501                                                     | 400, 401, 403                 |
| GET    | `/admin/rooms/:id`            | Admin       | `id`                                                                                     | Stub 501                                                     | 400, 401, 403                 |
| PATCH  | `/admin/rooms/:id`            | Admin       | Any subset of the room fields                                                            | Stub 501                                                     | 400, 401, 403                 |
| DELETE | `/admin/rooms/:id`            | Admin       | `id`                                                                                     | Stub 501                                                     | 400, 401, 403                 |
| GET    | `/admin/bookings`             | Admin       | None                                                                                     | Stub 501                                                     | 401, 403                      |
| PATCH  | `/admin/bookings/:id/approve` | Admin       | `id`                                                                                     | Stub 501                                                     | 400, 401, 403                 |
| PATCH  | `/admin/bookings/:id/cancel`  | Admin       | `id`                                                                                     | Stub 501                                                     | 400, 401, 403                 |
| GET    | `/admin/payments`             | Admin       | None                                                                                     | Stub 501                                                     | 401, 403                      |
| GET    | `/admin/payments/:id`         | Admin       | `id`                                                                                     | Stub 501                                                     | 400, 401, 403                 |
| GET    | `/admin/reports/bookings`     | Admin       | Optional `from`, `to`, `status`, `hostelId`                                              | Stub 501                                                     | 400, 401, 403                 |
| GET    | `/admin/reports/payments`     | Admin       | Optional `from`, `to`, `status`                                                          | Stub 501                                                     | 400, 401, 403                 |
| GET    | `/admin/reports/occupancy`    | Admin       | Optional `from`, `to`, `hostelId`                                                        | Stub 501                                                     | 400, 401, 403                 |

## Room query

| Query                  | Rule                                                                |
| ---------------------- | ------------------------------------------------------------------- |
| `hostel`               | 24 character hex id                                                 |
| `roomType`             | `single`, `double`, `triple`, or `bedsitter`                        |
| `minPrice`, `maxPrice` | Numbers, as query strings                                           |
| `available`            | `true` or `false`. `true` means `availabilityStatus` is `available` |
| `page`                 | Whole number, default 1                                             |
| `limit`                | Whole number from 1 to 50, default 10                               |

`pagination` contains `page`, `limit`, `total`, and `totalPages`. Each room includes its hostel `id`, `name`, `location`, and `contactPhone`.

## User object

The API never returns `passwordHash`.

```json
{
  "id": "665f0b0b0b0b0b0b0b0b0b0b",
  "fullName": "Amina Wanjiku",
  "email": "amina.wanjiku@campusstay.test",
  "phone": "+254711000001",
  "role": "student",
  "status": "active",
  "studentRegNo": "SCT-1001",
  "createdAt": "2026-10-28T00:00:00.000Z",
  "updatedAt": "2026-10-28T00:00:00.000Z"
}
```

## Password rules

Registration and reset passwords need 8 to 72 characters, with at least one letter and one number. Login only checks that a password was sent, so a future policy change does not lock out older accounts.

## Status codes used by the skeleton

| Code | When                                                                                            |
| ---- | ----------------------------------------------------------------------------------------------- |
| 200  | Read or login or logout succeeded                                                               |
| 201  | Registration succeeded                                                                          |
| 400  | Validation failed or the JSON is invalid                                                        |
| 401  | Authentication required                                                                         |
| 403  | Signed in, wrong role, or the account is suspended                                              |
| 404  | No route matches                                                                                |
| 409  | Duplicate email, or a future duplicate booking                                                  |
| 429  | Auth rate limit: 10 requests per 15 minutes per IP. The general API limit is 300 per 15 minutes |
| 500  | Unexpected error. The body does not include a stack trace                                       |
| 501  | The route is agreed but the handler is not written                                              |
| 503  | Health check and the database is not connected                                                  |

Rate limits are relaxed while `NODE_ENV` is `test` so the suite can create many accounts.
