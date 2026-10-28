# Deployment

This guide takes CampusStay from a laptop to a hosted demo. Do it only after `npm run test` and `npm run build` pass locally.

## 1. MongoDB Atlas

1. Create a free or shared cluster in the Atlas UI.
2. Create a database user with a long password. Do not use the seed passwords.
3. Network access: allow the host that will run the API. For a first demo you may allow `0.0.0.0/0`, then tighten it to the host's addresses.
4. Database name: `campusstay`.
5. Copy the SRV connection string into `MONGODB_URI`. Replace the user, password, and database name.

The API fails fast when `MONGODB_URI` is missing or does not start with `mongodb://` or `mongodb+srv://`.

After the API is up, run the seed once against that database:

```bash
npm run seed
```

Then change the demo passwords, or skip the seed and create a real super admin with a private script. Do not leave `SuperAdmin#2026` on a public server.

## 2. Backend

Any Node 22 host works. Render, Railway, or a small virtual machine are enough for the course demo.

Build and start:

```bash
npm run build -w backend
npm run start -w backend
```

`start` runs `node dist/server.js`. Set `NODE_ENV=production`.

Required environment:

| Variable                | Production note                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| `PORT`                  | The host often sets this. The app reads it.                                                |
| `MONGODB_URI`           | Atlas string. Never log it.                                                                |
| `JWT_SECRET`            | At least 32 random characters. The example value is rejected in production.                |
| `JWT_EXPIRES_IN`        | Keep a short value such as `15m`.                                                          |
| `CLIENT_URL`            | The exact website origin, for example `https://campusstay.example`.                        |
| `MPESA_ENV`             | `sandbox` until Safaricom approves a live shortcode.                                       |
| `MPESA_CONSUMER_KEY`    | Daraja app key.                                                                            |
| `MPESA_CONSUMER_SECRET` | Daraja app secret.                                                                         |
| `MPESA_SHORTCODE`       | Paybill or till used for Lipa Na M-Pesa.                                                   |
| `MPESA_PASSKEY`         | Lipa Na M-Pesa passkey.                                                                    |
| `MPESA_CALLBACK_URL`    | Public HTTPS URL ending in `/api/v1/mpesa/callback`. Localhost will not receive callbacks. |
| `ORG_NAME`              | Printed on reports.                                                                        |
| `ORG_LOGO_URL`          | Absolute HTTPS URL of the logo.                                                            |

The process handles `SIGINT` and `SIGTERM` by closing HTTP and then disconnecting Mongoose.

Health check for the host: `GET /api/v1/health`. Treat 503 as "not ready".

## 3. Frontend

Build the Next.js app with the API origin it should proxy to:

```bash
npm run build -w frontend
npm run start -w frontend
```

| Variable              | Production note                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Leave empty when the site and the proxy share one origin. That keeps the cookie first-party. |
| `API_PROXY_TARGET`    | The public or private URL of the Express API, with no trailing path.                         |
| `JWT_SECRET`          | The same value as the API, so `middleware.ts` can verify the cookie.                         |

If the website and the API are on different sites and the browser calls the API directly, `SameSite=Lax` cookies will not be sent. Prefer the Next.js rewrite so the browser only talks to the website.

Set the same `JWT_SECRET` at build time if the host inlines environment variables for middleware. Restart the site after rotating it.

## 4. M-Pesa sandbox

1. Create an app on the Safaricom Daraja portal.
2. Use the sandbox shortcode and passkey in the API environment.
3. Expose the API callback with the host's HTTPS URL.
4. Complete a sandbox STK push only after Member 4 replaces the 501 handler.
5. Do not point `MPESA_ENV=production` at the sandbox keys.

## 5. Release checklist

- [ ] `main` matches the commit you are deploying
- [ ] `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` passed
- [ ] Production `JWT_SECRET` is unique and matches on the API and the website
- [ ] `CLIENT_URL` matches the website origin exactly
- [ ] Atlas user is not an admin of other projects, and the password is not in git
- [ ] Demo seed passwords have been changed or the seed was not run
- [ ] `MPESA_CALLBACK_URL` is HTTPS and reachable from the internet
- [ ] `GET /api/v1/health` returns `ok`
- [ ] A student can register and log in, and `/admin` redirects that student away
- [ ] An admin can open `/admin`
- [ ] Logs do not print passwords or the connection string

## 6. Rollback

Keep the previous build. If a release fails the health check, start the previous process again and point the site back at it. Atlas data is not rolled back by a code rollback. Avoid destructive migrations. This project does not use them in 0.1.0.
