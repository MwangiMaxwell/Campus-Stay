# Architecture

## 1. System context

CampusStay has three runtime parts:

1. A Next.js website that students and staff use in the browser.
2. An Express API that owns accounts, rooms, bookings, payments, and the audit log.
3. MongoDB Atlas, which stores the data.

Safaricom Daraja is an external system. The API will call it for an STK push, and Daraja will call the API callback. That call is specified and not implemented yet.

```mermaid
flowchart LR
  student[Student browser]
  staff[Staff browser]
  web[Next.js on port 3000]
  api[Express on port 4000]
  db[(MongoDB Atlas)]
  mpesa[Safaricom Daraja]
  student --> web
  staff --> web
  web -->|proxies /api| api
  api --> db
  api --> mpesa
  mpesa --> api
```

## 2. Components

```mermaid
flowchart TB
  subgraph browser [Browser]
    pages[App Router pages]
    gate[middleware.ts]
  end
  subgraph api [Express API]
    routes[Routes and role middleware]
    services[Services]
    models[Mongoose models]
  end
  pages --> gate
  pages -->|fetch with credentials| routes
  routes --> services
  services --> models
  models --> atlas[(MongoDB)]
```

| Component                    | Responsibility                                                               |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `frontend/src/app`           | Pages. Public auth screens work. Student and admin screens are placeholders. |
| `frontend/src/middleware.ts` | Blocks guests from student pages and blocks students from `/admin`.          |
| `frontend/src/lib/api.ts`    | `fetch` wrapper that sends cookies and throws typed errors.                  |
| `backend/src/app.ts`         | Helmet, CORS, JSON, cookies, logging, rate limit, routes, errors.            |
| `backend/src/services`       | Business rules. Auth and room listing are implemented.                       |
| `backend/src/models`         | Collections, indexes, and the append-only audit log.                         |

## 3. Request flow

```mermaid
sequenceDiagram
  participant Browser
  participant Next as Next.js
  participant API as Express
  participant DB as MongoDB
  Browser->>Next: GET /api/v1/rooms?roomType=single
  Next->>API: Rewrite to the API
  API->>API: Zod validates the query
  API->>DB: Find rooms with the parsed filters
  DB-->>API: Page of rooms
  API-->>Browser: success true and data
```

A bad query never reaches MongoDB. The error handler turns a Zod failure into HTTP 400 with `error.details.fieldErrors`.

## 4. Auth flow

```mermaid
sequenceDiagram
  participant Browser
  participant Next as Next.js
  participant API as Express
  participant DB as MongoDB
  Browser->>Next: POST /api/v1/auth/login
  Next->>API: Proxy the JSON body
  API->>DB: Load the user and the password hash
  API->>API: bcrypt compare, then sign a short-lived JWT
  API-->>Browser: Set-Cookie token, HttpOnly, SameSite=Lax
  Browser->>Next: GET /rooms
  Next->>Next: middleware verifies the JWT
  Next-->>Browser: Student page, or redirect to login
```

The API loads the user from the database on every protected call. A suspended account loses access even if the cookie has not expired. The website checks the cookie so it can redirect before rendering. The API remains the authority.

Public registration always stores `role: student`.

## 5. Booking sequence

This is the target flow. The handlers return 501 until Member 4 implements them. The database rule is already active.

```mermaid
sequenceDiagram
  participant Student
  participant API as Express
  participant DB as MongoDB
  Student->>API: POST /api/v1/bookings
  API->>API: Require role student and validate dates
  API->>DB: Insert booking with status pending
  alt Another pending or approved booking exists
    DB-->>API: Duplicate key on uniq_active_booking_per_room
    API-->>Student: 409 Room already booked
  else Insert succeeds
    DB-->>API: Booking id
    API-->>Student: 201 Pending booking
  end
```

An admin later calls `PATCH /api/v1/admin/bookings/:id/approve` or `.../cancel`. Approval stores `approvedBy` and `approvedAt` and writes `booking.approve` to the audit log.

## 6. M-Pesa payment sequence

```mermaid
sequenceDiagram
  participant Student
  participant API as Express
  participant DB as MongoDB
  participant Daraja as Daraja
  Student->>API: POST /api/v1/mpesa/stk-push
  API->>DB: Read the booking fee
  API->>DB: Insert payment status pending
  API->>Daraja: STK push
  Daraja-->>Student: Phone prompt
  Daraja->>API: POST /api/v1/mpesa/callback
  API->>DB: Set success or failed, store receipt
  API->>DB: Audit payment.success or payment.failure
  API-->>Student: Confirmation on the payments page
```

Member 4 must verify the callback before trusting it, ignore an amount sent by the browser, and keep `mpesaReceiptNo` unique.

## 7. Technology decisions

| Decision                          | Reason                                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| npm workspaces                    | One install, one lint command, and a clean root for five contributors.                                             |
| JWT in an httpOnly cookie         | Browser script cannot read the token. The Next.js proxy keeps the cookie on the website, so middleware can see it. |
| Short expiry, default 15 minutes  | A stolen cookie is useful for a short time. The user signs in again.                                               |
| Zod at the edge of the API        | Handlers receive typed data. MongoDB operators cannot be smuggled in as field names.                               |
| Partial unique index for bookings | Two concurrent requests cannot both win. Application checks alone are not enough.                                  |
| Mongoose `sanitizeFilter`         | A second line of defense if a future query spreads a request object.                                               |
| In-memory MongoDB for tests       | CI does not need an Atlas password.                                                                                |
| Stubs return 501                  | The route, schema, and role are agreed before the feature is written. `TODO(member-N)` shows who owns the rest.    |

## 8. Trust boundaries

- The browser is untrusted. Hidden fields and disabled buttons are not security.
- Next.js middleware improves navigation. It is not a substitute for `authenticate` and `requireRole`.
- The M-Pesa callback is untrusted until Member 4 checks the payload.
- Atlas credentials, the JWT secret, and Daraja keys stay in the environment.
