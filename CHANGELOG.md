# Changelog

All notable changes to this project are documented in this file.

The format is based on Keep a Changelog, and this project follows Semantic Versioning.

## [0.1.0] - 2026-10-28

### Added

- npm workspaces for the Next.js frontend and the Express API
- Student registration, login, logout, and the current-user endpoint, with the session stored in an httpOnly cookie
- Room search with hostel, room type, price, availability, and pagination
- Mongoose models for users, hostels, rooms, bookings, payments, audit logs, and password reset tokens
- A partial unique index that blocks two active bookings for the same room
- Role checks, Zod validation, helmet, CORS, auth rate limits, and audit entries for register, login, and logout
- Stub routes for bookings, payments, M-Pesa, admin actions, and reports, each marked for the owning member
- An idempotent seed script with demo staff, students, hostels, and rooms
- Vitest coverage for health, auth, role checks, room filters, validators, and the booking index
- Project documentation, contribution guides, and a GitHub Actions workflow
