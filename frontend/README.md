# CampusStay website

The frontend is the Next.js App Router site. Students and staff use it in the browser. It proxies `/api` to the Express API so the session cookie stays on this origin.

## Structure

```text
frontend/
  src/
    app/
      (public)/       Home, login, register, forgot password
      (student)/      Rooms, bookings, payments, profile
      admin/          Sidebar layout and admin placeholders
    middleware.ts     Protects student pages and /admin
    components/       ui, layout, and auth forms
    hooks/            useAuth and useRooms
    lib/              API client, schemas, access rules
    types/            DTOs that mirror the API
  public/logo.svg     Mark used in the header
```

The `@/` alias points at `src/`. Next.js 16 prints a notice that `middleware.ts` is deprecated in favor of `proxy.ts`. This project keeps `middleware.ts`, and the production build still runs it as the route gate.

## Setup

From the repository root, after `npm install`:

```bash
Copy-Item frontend/.env.example frontend/.env   # Windows
# cp frontend/.env.example frontend/.env        # macOS and Linux
```

Leave `NEXT_PUBLIC_API_URL` empty. Set `API_PROXY_TARGET` to the API origin, default `http://localhost:4000`. Set `JWT_SECRET` to the same string as the API.

```bash
npm run dev -w frontend
```

The site uses port 3000. The API CORS origin expects that port.

## Scripts

| Script                          | Purpose                                  |
| ------------------------------- | ---------------------------------------- |
| `npm run dev -w frontend`       | Next.js dev server on port 3000          |
| `npm run build -w frontend`     | Production build                         |
| `npm run start -w frontend`     | Serve the production build               |
| `npm run lint -w frontend`      | ESLint                                   |
| `npm run typecheck -w frontend` | `tsc --noEmit`                           |
| `npm run test -w frontend`      | Vitest for access rules and form schemas |

## Environment

| Variable              | Role                                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Browser prefix for API calls. Empty means same-origin `/api`, which is what the cookie design needs. |
| `API_PROXY_TARGET`    | Where Next.js forwards `/api`. Not exposed to the browser.                                           |
| `JWT_SECRET`          | Verifies the session cookie in `middleware.ts`. Must match the API.                                  |

## Conventions

- Pages in `(student)` and `admin` that are not built yet render `PlaceholderPage` and carry `TODO(member-3)` or `TODO(member-5)`.
- Call the API through `apiRequest` in `src/lib/api.ts`. It sends cookies and throws `ApiError`.
- Forms use React Hook Form and the Zod schemas in `src/lib/schemas.ts`. Keep those rules aligned with `backend/src/validators`.
- `decideAccess` in `src/lib/auth.ts` is the pure rule behind `middleware.ts`. Test it when you change who may open a path.
- `useRooms` is the example data hook for the room search page. It is ready to use and is not wired to the placeholder.

## Add a page

1. Add `page.tsx` under the right group: `(public)`, `(student)`, or `admin`.
2. If the page needs a signed-in student, put it under `(student)` so middleware already matches the path. New prefixes must be added in `decideAccess` and in the middleware `matcher`.
3. Load data in a client hook or a server component that calls the API. Do not talk to MongoDB from the website.
4. Show `formatApiError` when a request fails, in a sentence a student can act on.
5. Add a line to the user manual outline when the screen is part of the demo path.

Login and registration already run end to end. Build the next screen on that pattern rather than inventing a second auth store.
