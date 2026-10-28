# Security policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |

Only the current `main` branch receives security fixes during the course.

## Reporting a vulnerability

Email `security@campusstay.test` with the subject `CampusStay vulnerability`. Replace that address with the team lead's real address before the first public demo.

Include:

- The affected route, page, or file
- What an attacker can do
- Steps to reproduce, using demo data only
- The impact you expect

Do not open a public GitHub issue for a security report. Do not include real student records, live M-Pesa credentials, or a production connection string.

We will acknowledge a report within five days and tell you when a fix is merged. If you cannot reach the team, contact the course instructor.

## Secrets

Passwords, API keys, and the MongoDB connection string belong in `backend/.env` and `frontend/.env`. Commit only the `.env.example` files. The API refuses to start in production when `JWT_SECRET` is still the example value.

See [docs/06-SECURITY.md](docs/06-SECURITY.md) for the threats this project addresses.
