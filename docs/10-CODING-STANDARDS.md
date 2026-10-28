# Coding standards

These rules keep five people's changes readable. Prettier and ESLint enforce layout. This document covers the choices those tools do not make.

## 1. Language and layout

- TypeScript strict mode in both packages.
- Import application code with the `@/` alias. `@/` maps to `frontend/src` or `backend/src`.
- Prefer `const`. Do not use `any`. Use `unknown` and narrow it.
- Name files in camel case for code (`room.service.ts`) and the existing docs numbering for specifications (`01-SRS.md`).
- React components are PascalCase. Functions and variables are camelCase. Types and interfaces are PascalCase. The Mongoose interfaces are `IUser`, `IHostel`, `IRoom`, `IBooking`, `IPayment`, `IAuditLog`, and `IPasswordResetToken`.
- Environment variables are `SCREAMING_SNAKE_CASE`.

## 2. Folder rules

| Path                      | Put it here                                                 | Do not put it here                     |
| ------------------------- | ----------------------------------------------------------- | -------------------------------------- |
| `backend/src/routes`      | URL, middleware, and which controller runs                  | Database queries                       |
| `backend/src/controllers` | Read the validated input, call a service, send the response | Business rules                         |
| `backend/src/services`    | Rules, transactions, calls to M-Pesa                        | `req` and `res`                        |
| `backend/src/models`      | Schema, indexes, model interfaces                           | HTTP status codes                      |
| `backend/src/validators`  | Zod schemas                                                 | Queries                                |
| `frontend/src/app`        | Routes and layouts                                          | Direct `fetch` scattered in every file |
| `frontend/src/components` | Shared UI                                                   | API base URLs                          |
| `frontend/src/lib`        | The API client, schemas, and pure helpers                   | JSX pages                              |

Unfinished work carries a comment the team can search for:

```ts
// TODO(member-4): book an available room for the signed-in student.
```

Use the member number from `TEAM-AREAS.md`. Do not leave a bare `TODO`.

## 3. API and errors

- Return `{ success: true, data }` or `{ success: false, error: { message, details? } }`.
- Throw `AppError` with the HTTP status. The error handler sends the JSON.
- Validate `body`, `query`, and `params` with Zod before the controller uses them.
- Do not pass `req.body` or `req.query` into Mongoose.
- Do not return `passwordHash`. Build user JSON with `toPublicUser`.
- A feature that is specified but not built returns 501. Do not return a fake success.

## 4. Data and security

- Hash passwords with bcrypt cost 12.
- Sign the session in `signToken` and set it only through `setAuthCookie`.
- Call `recordAudit` when you implement register-like, admin, booking, or payment actions. Do not put passwords in `meta`.
- New queries that need a filter should get an index in the model and a line in `docs/03-DATABASE-DESIGN.md`. Member 2 reviews that change.

## 5. Tests

- Add or extend a Vitest file when you change a rule.
- API tests use Supertest and the in-memory database. Do not point tests at Atlas.
- A bug fix needs a test that failed before the fix.

## 6. Commits and reviews

Follow `CONTRIBUTING.md`. Conventional commit subjects, small pull requests into `develop`, and one approval from another member.

Reviewers check:

- The change matches one task
- Validation and role checks are still in front of the handler
- No secret was added
- The docs still match the route or the screen

## 7. Comments

Comment why a rule exists when the code cannot say it, as with the partial booking index. Do not comment what a line already says. Do not use an em dash in comments or documents. Use a period, a comma, a colon, or a hyphen.
