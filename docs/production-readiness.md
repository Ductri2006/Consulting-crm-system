# Production Readiness

This document records the production readiness status for the Consulting CRM
System through Phase 22. It documents staging demo hardening, the workspace
tenant foundation, and production
gaps while keeping real provider URLs, credentials, and secrets out of the
repository.

## Current Production Readiness Status

Status: staging portfolio path prepared with fictional demo data; production is
not approved. Do not treat this repository as approved for real sensitive
production data until the known limitations below are resolved or explicitly
accepted.

- Live Neon PostgreSQL verification: PASS.
- Staging deployment checklist: prepared in
  [Staging Deployment Checklist](staging-deployment-checklist.md).
- Vercel/Render/Neon staging guidance and demo-seed runbook are documented
  with placeholders only.
- Frontend build and lint have passed in recent verification.
- Backend build, lint, Prisma generate, and Prisma validation must pass before
  every deployment candidate.
- Step 22 Organization / Workspace foundation is implemented for internal users
  and CRM business data. Current staging/demo uses one default workspace:
  `Advisora Demo Workspace` (`advisora-demo`).
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
  internal users, documents, dashboard, and reporting APIs.
- Organization / Workspace model, default workspace backfill migration, and
  tenant-scoped business APIs.
- Prisma migration, seed, database verification command, and health route.

Admin CRM modules:

- Dashboard.
- Customers.
- Consultation Requests.
- Cases.
- Appointments.
- Tasks.
- Team Members.
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
| `DEFAULT_ORGANIZATION_SLUG` | Workspace slug used by public consultation requests, defaults to `advisora-demo`. |

Client:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Deployed backend API base URL, including `/api`. |

Production rules:

- `DATABASE_URL` must never be committed.
- `JWT_SECRET` must be generated securely, kept private, and rotated if exposed.
- `CLIENT_URL` must match the deployed frontend origin.
- `VITE_API_BASE_URL` must match the deployed backend API URL.
- `DEFAULT_ORGANIZATION_SLUG` must point to an active workspace. In current
  staging, use `advisora-demo`.
- Do not commit `.env`, tokens, local upload files, or generated secrets.

## Database Readiness

- Live Neon PostgreSQL verification: PASS.
- The committed migration is the source of truth for production schema setup.
- Use `npm run prisma:deploy` for shared, staging, and production databases.
- Use `npm run prisma:generate` before building the backend.
- Use `npx prisma validate` before deployment to catch schema issues.
- The workspace migration creates `Organization`, backfills existing internal
  users and CRM records to `Advisora Demo Workspace`, and sets
  `organizationId` as required without resetting data.
- Run seed data carefully. The current demo administrator is for local portfolio
  development and must not be used as a real production credential.
- Use `npm run seed:demo` only for fictional portfolio staging data. When
  `NODE_ENV=production`, the command requires `DEMO_SEED_ENABLED=true` so the
  operator must intentionally create demo accounts and data.
- Do not run `npm run seed` on staging or production unless the legacy local
  credential risk is explicitly accepted.

## Authentication Readiness

- Passwords are hashed with bcryptjs.
- Login and current-user responses use sanitized user projections.
- Login and `/api/auth/me` include safe workspace info:
  `organizationId` and `organization: { id, name, slug }`.
- JWT signing and verification are pinned to `HS256`.
- `passwordHash` must not be returned by login, `/auth/me`, user list/detail, or
  assignable-user endpoints.
- The demo admin password must be changed or replaced before any real
  production use.
- Do not publish high-privilege admin demo credentials for long-lived public
  staging. Prefer manager or staff access for public review, or share admin
  access privately only.
- Bearer tokens must not be logged, printed in docs, or committed.
- The current frontend stores the access token in browser local storage. For
  higher-risk production use, migrate authentication to `HttpOnly`, `Secure`,
  `SameSite` cookies or another reviewed token storage strategy.

### JWT Secret Rotation

Rotate the Render `JWT_SECRET` after screenshots, accidental exposure, or any
credential incident. With the current stateless HS256 token design, rotating
`JWT_SECRET` invalidates all existing access tokens and users must log in
again.

Rotation steps:

1. Generate a new unique staging secret.
2. Update `JWT_SECRET` in the provider secret store only.
3. Restart or redeploy the backend.
4. Confirm old tokens receive `401`.
5. Confirm fresh login and `/api/auth/me` succeed.
6. Review logs and screenshots for leaked tokens, passwords, database URLs, or
   provider credentials.

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
- [ ] Known local credential `admin@advisora.demo` / `password123` is disabled
  outside local development.
- [ ] Demo admin access is not published for long-lived public staging.
- [ ] Token storage risk is accepted or migrated away from browser local
  storage.
- [ ] CORS allowlist matches the deployed frontend origin.
- [ ] `passwordHash` is not returned by auth or user endpoints.
- [ ] Auth responses include the expected current workspace and no other
  workspace data.
- [ ] User management and assignable-user endpoints return same-workspace users
  only.
- [ ] Dashboard and report totals are scoped to the current workspace.
- [ ] Public consultation requests map to `DEFAULT_ORGANIZATION_SLUG`.
- [ ] Public forms have abuse protection or a plan for rate limiting.
- [ ] Logs do not include passwords, tokens, connection strings, or document
  contents.

## Deployment Checklist

- [ ] Complete the staging-specific checklist in
  [Staging Deployment Checklist](staging-deployment-checklist.md).
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
- Staging URLs, provider settings, and credentials are intentionally not
  committed.
- `/api/health` is a liveness endpoint, not a database readiness check.
- File storage is local and development-oriented.
- Render Free may cold start during portfolio staging.
- No refresh tokens or token revocation workflow yet.
- Current frontend token storage uses local storage, not HttpOnly cookies.
- Public contact and appointment forms are validation/demo flows only.
- No password reset or account-management UI yet.
- No public workspace signup, invitation system, billing, or workspace switcher
  yet.
- No production rate limiting, captcha, or dedicated abuse-protection layer yet.
- No centralized production logging, metrics, or alerting yet.
- No automated end-to-end test suite yet.
- No report export to Excel/PDF yet.

## Recommended Next Steps

1. Choose frontend hosting, backend Node runtime, and persistent object storage.
2. Create staging environment variables outside the repository.
3. Complete `docs/staging-deployment-checklist.md`.
4. Run the full verification commands listed in the deployment checklist.
5. Deploy to a staging environment before production.
6. Complete `docs/final-qa-checklist.md` on staging.
7. Replace local/demo credentials with secure production provisioning.
8. Review token storage and consider HttpOnly secure cookies before handling
   real customer data.
9. Add rate limiting, monitoring, backups, and private object storage before
   handling real customer data.
