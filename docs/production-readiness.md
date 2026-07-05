# Production Readiness

This document records the production readiness status for the Consulting CRM
System through Step 33. It documents staging demo hardening, the workspace
tenant foundation, customer portal document security, activity feeds, and UI
polish/final QA status while keeping real provider URLs, credentials, and
secrets out of the repository.

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
- Step 28.5 bilingual UI support is implemented for English (`en`) and
  Vietnamese (`vi`). Locale preference is browser-only and stored in
  `advisora_locale`.
- Step 29 customer portal documents are implemented with portal-authenticated
  list/upload/download, hidden-by-default internal documents, Admin/Manager
  customer-visible controls, and no portal file-path exposure.
- Step 29.5 document hardening adds local/S3-compatible storage providers,
  protected streaming downloads, download audit logging, scan-status download
  blocking, and malware/OCR provider abstractions. Real S3, ClamAV, or OCR
  operation requires provider infrastructure and secrets configured outside the
  repository.
- Step 30 Activity Center and Portal Updates are implemented. Internal activity
  is organization-scoped and Admin/Manager-only; portal updates are
  customer-scoped and omit internal notes, raw storage metadata, token/password
  hashes, IP addresses, and user-agent data.
- Step 31 security hardening is implemented for the staging/portfolio path:
  Helmet security headers, `x-powered-by` removal, `1mb` body limits,
  configurable in-memory rate limiting, logging/error redaction, expanded audit
  coverage, tenant verification updates, and a read-only production smoke
  script.
- Step 32 final UI/UX polish standardizes loading, empty, and error states,
  responsive table/card behavior, accessible labels, and bilingual microcopy for
  the demo path without changing backend API contracts or resetting data.
- Step 33 final QA/fix sprint passed local client/server build and lint,
  Prisma validation/generate, EN/VI key parity and static missing-key scans,
  tenant isolation verification, local API health/security-header smoke, and
  localhost production-smoke script readiness including optional rate-limit
  smoke. It also fixes a document access regression so staff users can no longer
  read unrelated customer-portal uploads solely because the document source is
  `CUSTOMER_PORTAL`.
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
- Activity Center for Admin and Manager users.

Bilingual UI:

- English/Vietnamese resources live in the client application.
- Language switchers are available on public, admin, and portal surfaces.
- Core navigation, login flows, common actions, status labels, activity labels,
  portal update labels, and portal case-tracking labels are localized.
- Database values and user-generated content are intentionally not translated.

UI/UX polish:

- Shared loading and page-level error states cover admin and portal initial
  fetches.
- Admin tables keep horizontal containment while allowing long customer-facing
  values to wrap.
- Portal dashboard, cases, documents, updates, and case detail views avoid
  misleading zero-data flashes during initial loading.
- Mobile navigation, retry actions, filter validation messages, and portal
  document metadata labels are covered by bilingual resources.

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
| `WORKSPACE_SIGNUP_ENABLED` | Public workspace signup flag. Defaults to `false`; use `true` only for controlled onboarding QA until production abuse protection and auth hardening are complete. |
| `APP_NAME` | Name used in transactional email templates. |
| `EMAIL_PROVIDER` | Invitation email provider: `disabled`, `console`, or `resend`. Defaults to `console`. |
| `EMAIL_FROM` | Sender identity for invitation emails. Use a verified sender for real Resend delivery. |
| `EMAIL_REPLY_TO` | Optional reply-to address for invitation emails. |
| `RESEND_API_KEY` | Resend API key. Required only when `EMAIL_PROVIDER=resend`; never commit it. |
| `RATE_LIMIT_ENABLED` | Enables in-memory rate limits. Defaults to `true`. |
| `AUTH_RATE_LIMIT_WINDOW_MINUTES` / `AUTH_RATE_LIMIT_MAX` | Auth and invitation limit window/count. Defaults to `15` and `10`. |
| `PUBLIC_RATE_LIMIT_WINDOW_MINUTES` / `PUBLIC_RATE_LIMIT_MAX` | Public intake limit window/count. Defaults to `15` and `50`. |
| `UPLOAD_RATE_LIMIT_WINDOW_MINUTES` / `UPLOAD_RATE_LIMIT_MAX` | Upload limit window/count. Defaults to `15` and `20`. |
| `DOWNLOAD_RATE_LIMIT_WINDOW_MINUTES` / `DOWNLOAD_RATE_LIMIT_MAX` | Download limit window/count. Defaults to `15` and `100`. |

Client:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Deployed backend API base URL, including `/api`. |

Client-side locale preference:

| Key | Purpose |
| --- | --- |
| `advisora_locale` | Browser local-storage key for `en`/`vi` UI language preference. |

Production rules:

- `DATABASE_URL` must never be committed.
- `JWT_SECRET` must be generated securely, kept private, and rotated if exposed.
- `CLIENT_URL` must match the deployed frontend origin.
- `VITE_API_BASE_URL` must match the deployed backend API URL.
- `DEFAULT_ORGANIZATION_SLUG` must point to an active workspace. In current
  staging, use `advisora-demo`.
- `WORKSPACE_SIGNUP_ENABLED` should remain `false` for production unless
  signup abuse protection, monitoring, and token/session hardening are reviewed.
- Current rate limiting is in-memory and IP-based. Use Redis or another shared
  rate-limit store before multi-instance production.
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
- Use `npm run seed:second-workspace` only for tenant-isolation QA in local or
  dedicated staging databases. When `NODE_ENV=production`, the command requires
  `SECOND_WORKSPACE_SEED_ENABLED=true` for that command only. Run
  `npm run verify:tenant-isolation` after seeding to confirm Advisora and
  Northstar demo data remain separated.
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
- Customer portal auth uses separate `CustomerPortalAccount` records and portal
  JWTs with `purpose: "customer_portal"`.
- Internal middleware must reject portal-purpose tokens, and portal middleware
  must reject internal tokens.
- Portal login, `/api/portal/auth/me`, and `/api/portal/me` must never return
  `passwordHash` or internal `User` data.
- Portal case endpoints are read-only, must scope by portal-account
  `organizationId + customerId`, and must not return internal notes, document
  file URLs, staff contact details, password hashes, or token hashes.
- Portal update endpoints must scope by portal-account
  `organizationId + customerId`, validate optional case ownership, and must not
  return raw internal activity descriptions, internal notes, document storage
  metadata, token hashes, password hashes, IP addresses, or user-agent data.
- Internal Activity Center endpoints must require Admin/Manager internal auth,
  scope by `request.user.organizationId`, and sanitize descriptions before
  returning them.
- The demo admin password must be changed or replaced before any real
  production use.
- Do not publish high-privilege admin demo credentials for long-lived public
  staging. Prefer manager or staff access for public review, or share admin
  access privately only.
- Bearer tokens must not be logged, printed in docs, or committed.
- The current frontend stores internal and portal access tokens in browser
  local storage using separate keys. For higher-risk production use, migrate
  authentication to `HttpOnly`, `Secure`, `SameSite` cookies or another
  reviewed token storage strategy.

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

## Security Headers And Rate Limiting

- API responses should not include `x-powered-by`.
- Helmet should emit `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, and `Referrer-Policy: no-referrer`.
- Production-mode deployments should also emit HSTS through Helmet.
- Rate-limited routes should return `429` with the generic message
  `Too many requests. Please try again later.`.
- The current limiter is process-local and IP-based. Treat it as staging/demo
  protection, not distributed production abuse defense.
- Before real production, use Redis/shared storage, verify proxy IP handling,
  consider captcha or WAF controls for public forms, and add monitoring for
  repeated 429/auth failures.

## Production Smoke Script

Run the read-only smoke script only with sanitized staging/production-like
credentials stored outside the repository:

```bash
cd server
npm run smoke:production
```

Required variables:

- `SMOKE_API_BASE_URL`
- `SMOKE_ADMIN_EMAIL`
- `SMOKE_ADMIN_PASSWORD`
- `SMOKE_PORTAL_WORKSPACE_SLUG`
- `SMOKE_PORTAL_EMAIL`
- `SMOKE_PORTAL_PASSWORD`

Optional:

- `SMOKE_RATE_LIMIT_CHECK=true` intentionally sends invalid login attempts
  until a `429` is observed. Use it only during a planned smoke window.

Step 33 local verification confirmed that the smoke script compiles and passes
against localhost with sanitized demo credentials, including
`SMOKE_RATE_LIMIT_CHECK=true`. A live production smoke run was skipped because
no `SMOKE_*` variables were available in the shell.

## File Upload Limitation

Local file uploads work for development and single-instance testing.

Production risk:

- Local upload folders are not safe on ephemeral hosts.
- Local folders are not suitable for multi-instance deployments.
- Uploaded files must not be committed.

Production document requirements:

- Use a private persistent S3-compatible bucket with no public ACL/policy.
- Keep downloads authenticated through backend-protected routes or short-lived
  signed URLs issued only after authorization.
- Configure scanner/OCR infrastructure outside the repository when real
  customer documents are handled.
- Retain `DocumentDownloadAudit` records according to the compliance policy.

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
- [ ] Helmet security headers are present and `x-powered-by` is absent.
- [ ] Rate limits are enabled or a documented staging exception is accepted.
- [ ] `429` responses use generic messaging and do not expose user, email,
  workspace, or token data.
- [ ] Request logs, error responses, 404 paths, and activity descriptions
  redact tokens, secrets, signed URLs, storage keys, and local paths.
- [ ] `passwordHash` is not returned by auth or user endpoints.
- [ ] Auth responses include the expected current workspace and no other
  workspace data.
- [ ] User management and assignable-user endpoints return same-workspace users
  only.
- [ ] Dashboard and report totals are scoped to the current workspace.
- [ ] `/api/activity` is Admin/Manager-only and scoped to the current workspace.
- [ ] `/api/portal/updates` returns only the authenticated portal customer's
  safe updates and no internal notes, storage metadata, tokens, password hashes,
  IP addresses, or user-agent data.
- [ ] Optional second workspace QA seed has passed
  `npm run verify:tenant-isolation` when staging tenant-isolation evidence is
  required.
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
- [ ] Run `npm run smoke:production` when smoke credentials are available.
- [ ] Complete the final QA checklist.

## Known Limitations

- No real production deployment has been performed yet.
- Staging URLs, provider settings, and credentials are intentionally not
  committed.
- `/api/health` is a liveness endpoint, not a database readiness check.
- File storage defaults to local for development. S3-compatible private storage
  is implemented but must be configured with provider secrets outside the repo.
- Render Free may cold start during portfolio staging.
- No refresh tokens or token revocation workflow yet.
- No separate JWT signing secrets per token family yet; current separation uses
  payload purpose checks and middleware boundaries.
- Current frontend token storage uses local storage for both internal and
  customer portal sessions, not HttpOnly cookies.
- Workspace signup exists for controlled staging/local onboarding tests and is
  gated by `WORKSPACE_SIGNUP_ENABLED`; keep it disabled for production until
  abuse protection and session hardening are reviewed.
- Public contact and appointment forms are validation/demo flows only.
- Bilingual UI is frontend-only. Backend API response localization, email
  template localization, and automatic translation of user-generated data are
  not implemented.
- No password reset or account-management UI yet.
- Workspace invitations include email delivery abstraction and Resend support,
  but real delivery depends on provider DNS/sender setup and secrets configured
  outside the repository. Invite URLs are still returned once at create/resend
  as a manual fallback.
- Workspace settings allow administrator-only profile edits and slug changes.
  Public consultation requests still resolve `DEFAULT_ORGANIZATION_SLUG`; keep
  that environment value aligned with the intended default workspace.
- Workspace logo management is URL-only in this step; there is no logo upload
  pipeline yet.
- Customer portal supports login/dashboard/profile, read-only case tracking, and
  customer document upload/download with safe scan status and download
  availability plus safe recent updates. Messages, billing, realtime/push
  notifications, notification preferences, and self-registration remain future
  work.
- No billing, workspace switcher, or workspace-specific public intake URL yet.
- Second workspace creation is manual QA seed data only; it is not a production
  tenant onboarding flow.
- Basic in-memory rate limiting is implemented for sensitive endpoints, but
  distributed production-grade rate limiting, captcha, and dedicated
  abuse-protection monitoring are not implemented yet.
- No centralized production logging, metrics, or alerting yet.
- No automated end-to-end test suite yet.
- No report export to Excel/PDF yet.

## Recommended Next Steps

1. Choose frontend hosting, backend Node runtime, and private persistent object storage.
2. Create staging environment variables outside the repository.
3. Complete `docs/staging-deployment-checklist.md`.
4. Run the full verification commands listed in the deployment checklist.
5. Deploy to a staging environment before production.
6. Complete `docs/final-qa-checklist.md` on staging.
7. Replace local/demo credentials with secure production provisioning.
8. Review token storage and consider HttpOnly secure cookies before handling
   real customer data.
9. Add rate limiting, monitoring, backups, and production object-storage
   credentials before handling real customer data.
