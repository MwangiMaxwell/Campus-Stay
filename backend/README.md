# CampusStay API

The backend is the Express and MongoDB half of CampusStay. It authenticates students and staff, lists rooms, and exposes the routes the rest of the team will finish.

## Structure

```text
backend/
  src/
    server.ts          Process entry: database, HTTP, shutdown
    app.ts             Express app used by the server and by tests
    config/            Zod-validated environment and the Mongoose connection
    models/            Collections and indexes
    routes/            URL map
    controllers/       Thin handlers
    services/          Business rules
    middleware/        Auth, roles, validation, rate limits, errors
    validators/        Zod schemas
    utils/             Responses, errors, cookies, sanitizing
    types/             Shared DTO types
  scripts/seed.ts      Idempotent demo data
  tests/               Vitest and Supertest
```

Import from `src` with `@/`, for example `@/models`.

## Setup

From the repository root:

```bash
npm install
Copy-Item backend/.env.example backend/.env   # Windows
# cp backend/.env.example backend/.env        # macOS and Linux
```

Set `MONGODB_URI` to your Atlas string. `JWT_SECRET` must match `frontend/.env` if you want the website gate to accept the cookie. The committed example value is fine for local development and is rejected when `NODE_ENV` is production.

## Scripts

| Script                         | Purpose                                          |
| ------------------------------ | ------------------------------------------------ |
| `npm run dev -w backend`       | Restart the API on file changes                  |
| `npm run build -w backend`     | Compile to `dist/` and rewrite `@/` imports      |
| `npm run start -w backend`     | Run the compiled API                             |
| `npm run lint -w backend`      | ESLint                                           |
| `npm run typecheck -w backend` | `tsc --noEmit` for `src`, `tests`, and `scripts` |
| `npm run test -w backend`      | Vitest against an in-memory MongoDB              |
| `npm run seed -w backend`      | Upsert demo users, hostels, and rooms            |

The API listens on `PORT`, default 4000.

## Environment

Every variable is commented in `.env.example`. The process throws at startup when a required value is missing or invalid. M-Pesa keys may be empty until that feature is implemented. `assertMpesaConfigured` in `src/services/mpesa.service.ts` is the check Member 4 should call before a live STK push.

## Conventions

- Controllers call services. Services throw `AppError`. They do not touch `req` or `res`.
- `validate()` runs Zod and strips dangerous keys before the controller reads `req.validated`.
- Protected routes use `authenticate` and `requireRole`.
- A stub throws `AppError(501)` and has a `TODO(member-N)` comment.
- Add an index in the model, not only in a query, when you add a new filter.
- Tests must keep using the in-memory server. `globalSetup` writes `.test-mongo-uri`, which is gitignored.

## Add a route

1. Add a Zod schema in `src/validators`.
2. Add a service function. If it changes data, call `recordAudit`.
3. Add a thin controller that sends `sendSuccess`.
4. Mount it in `src/routes` with the role middleware.
5. Add a row to `docs/04-API-SPECIFICATION.md`.
6. Add a Supertest case.

Do not spread the raw request into a Mongoose query.
