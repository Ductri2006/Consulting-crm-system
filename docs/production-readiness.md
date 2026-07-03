# Production Readiness

This document records the production readiness status for the Consulting CRM
System after Phase 17. It prepares the project for a future deployment, but it
does not perform a real production deployment.

## Current Production Readiness Status

Status: ready for deployment preparation and final QA, not yet deployed. Do not
treat this repository as approved for real sensitive production data until the
known limitations below are resolved or explicitly accepted.

- Live Neon PostgreSQL verification: PASS.
- Frontend build and lint have passed in recent verification.
- Backend build, lint, Prisma generate, and Prisma validation must pass before
  every deployment candidate.
- `GET /api/health` is available as a liveness check. It does not prove database
  readiness by itself.
- Real production URLs, credentials, tokens, and connection strings are not
  committed.

## Completed Features

Public website:

- Home, services, service detail, projects, news, news detail, contact,
  consultation form, and appointment form.

Backend API:

- Authentication and role authorization.
- Customers, services, consultation requests, cases, appointments, tasks,
  documents, dashboard, and reporting APIs.
- Prisma migration, seed, database verification command, and health route.

Admin CRM modules:

- Dashboard.
- Customers.
- Consultation Requests.
- Cases.
- Appointments.
- Tasks.
- Documents.
- Reports.

## Required Environment Variables

Server:

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port for the Node/Express API. |
| `NODE_ENV` | Runtime mode: `development`, `test`, or `production`. |
| `DATABASE_URL` | PostgreSQL connection URL for Prisma. Never commit it. |
| `CLIENT_URL` | Allowed frontend origin for CORS, or comma-separated allowed origins. |
| `JWT_SECRET` | Strong private signing secret, at least 32 characters. |
| `JWT_EXPIRES_IN` | Access-token lifetime, for example `7d`. |
| `UPLOAD_DIR` | Local upload directory used by the current document module. |
| `MAX_FILE_SIZE_MB` | Per-file upload limit from 1 to 50 MB. |

Client:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Deployed backend API base URL, including `/api`. |

Production rules:

- `DATABASE_URL` must never be committed.
- `JWT_SECRET` must be generated securely, kept private, and rotated if exposed.
- `CLIENT_URL` must match the deployed frontend origin.
- `VITE_API_BASE_URL` must match the deployed backend API URL.
- Do not commit `.env`, tokens, local upload files, or generated secrets.

## Database Readiness

- Live Neon PostgreSQL verification: PASS.
- The committed migration is the source of truth for production schema setup.
- Use `npm run prisma:deploy` for shared, staging, and production databases.
- Use `npm run prisma:generate` before building the backend.
- Use `npx prisma validate` before deployment to catch schema issues.
- Run seed data carefully. The current demo administrator is for local portfolio
  development and must not be used as a real production credential.

## Authentication Readiness

- Passwords are hashed with bcryptjs.
- Login and current-user responses use sanitized user projections.
- JWT signing and verification are pinned to `HS256`.
- `passwordHash` must not be returned by login, `/auth/me`, user list/detail, or
  assignable-user endpoints.
- The demo admin password must be changed or replaced before any real
  production use.
- Bearer tokens must not be logged, printed in docs, or committed.
- The current frontend stores the access token in browser local storage. For
  higher-risk production use, migrate authentication to `HttpOnly`, `Secure`,
  `SameSite` cookies or another reviewed token storage strategy.

## CORS Readiness

- The backend allows only configured origins from `CLIENT_URL`.
- `CLIENT_URL` can be a single origin such as `<frontend-origin>` or a
  comma-separated allowlist such as `<frontend-origin>,<preview-origin>`.
- Do not use wildcard origins for authenticated production traffic.
- Keep `VITE_API_BASE_URL` aligned with the deployed backend API URL.

## File Upload Limitation

Local file uploads work for development and single-instance testing.

Production risk:

- Local upload folders are not safe on ephemeral hosts.
- Local folders are not suitable for multi-instance deployments.
- Uploaded files must not be committed.

Recommended later upgrade:

- Move documents to private persistent object storage.
- Keep downloads authenticated or use short-lived signed URLs.
- Add malware scanning and retention policies before handling real customer
  documents.

## Security Checklist

- [ ] No `.env` files committed.
- [ ] No `DATABASE_URL` committed.
- [ ] No JWT secret committed.
- [ ] No access token committed.
- [ ] No upload files committed.
- [ ] Production `JWT_SECRET` is strong and private.
- [ ] Demo admin credential is disabled, changed, or replaced.
- [ ] Token storage risk is accepted or migrated away from browser local
  storage.
- [ ] CORS allowlist matches the deployed frontend origin.
- [ ] `passwordHash` is not returned by auth or user endpoints.
- [ ] Public forms have abuse protection or a plan for rate limiting.
- [ ] Logs do not include passwords, tokens, connection strings, or document
  contents.

## Deployment Checklist

- [ ] Configure production `DATABASE_URL`.
- [ ] Configure production `JWT_SECRET`.
- [ ] Configure server `CLIENT_URL`.
- [ ] Configure client `VITE_API_BASE_URL`.
- [ ] Run backend `npm run prisma:generate`.
- [ ] Run backend `npx prisma validate`.
- [ ] Run backend `npm run build`.
- [ ] Run backend `npm run lint`.
- [ ] Run client `npm run build`.
- [ ] Run client `npm run lint`.
- [ ] Run `npm run prisma:deploy` against the target database.
- [ ] Verify `GET /api/health`.
- [ ] Complete the final QA checklist.

## Known Limitations

- No real production deployment has been performed yet.
- `/api/health` is a liveness endpoint, not a database readiness check.
- File storage is local and development-oriented.
- No refresh tokens or token revocation workflow yet.
- Current frontend token storage uses local storage, not HttpOnly cookies.
- Public contact and appointment forms are validation/demo flows only.
- No password reset or account-management UI yet.
- No production rate limiting, captcha, or dedicated abuse-protection layer yet.
- No centralized production logging, metrics, or alerting yet.
- No automated end-to-end test suite yet.
- No report export to Excel/PDF yet.

## Recommended Next Steps

1. Choose frontend hosting, backend Node runtime, and persistent object storage.
2. Create production environment variables outside the repository.
3. Run the full verification commands listed in the deployment checklist.
4. Deploy to a staging environment before production.
5. Complete `docs/final-qa-checklist.md` on staging.
6. Replace local/demo credentials with secure production provisioning.
7. Review token storage and consider HttpOnly secure cookies before handling
   real customer data.
8. Add rate limiting, monitoring, backups, and private object storage before
   handling real customer data.
