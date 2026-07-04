# Staging Deployment Checklist

Use this checklist to prepare and validate a staging deployment for the
Consulting CRM System. It is provider-neutral and intentionally uses
placeholders only. Do not paste real URLs, database connection strings, JWT
secrets, access tokens, provider credentials, or uploaded files into this
document.

For the concrete Vercel frontend, Render backend, and Neon database staging
path, use [Vercel + Render + Neon Staging Guide](vercel-render-staging-guide.md)
alongside this checklist.

## Staging Goal

The staging environment should prove that the frontend, backend, database,
authentication, CORS, file upload flow, and smoke-test path work outside local
development before any real production deployment.

Staging is not approved for real customer data unless the known limitations are
explicitly accepted and the required security controls are in place.

## Staging Run Record

Complete this section for each staging run. Use placeholders or sanitized
labels only.

| Field | Value |
| --- | --- |
| Commit SHA |  |
| Frontend origin |  |
| Backend API base URL |  |
| Database target | Sanitized staging database label only |
| Deployment provider(s) |  |
| Tester |  |
| Date |  |
| Go/no-go result |  |
| Accepted limitations |  |

Evidence rules:

- Do not paste `DATABASE_URL`, `JWT_SECRET`, access tokens, provider tokens,
  private keys, passwords, or raw upload contents.
- Record only sanitized command results, screenshots without secrets, and
  pass/fail notes.
- If a command prints a secret, redact it before storing evidence outside the
  private provider console.

## Recommended Architecture

- Frontend: static React/Vite build served from a staging frontend host.
- Backend: Node-compatible runtime serving the Express API.
- Database: dedicated staging Neon PostgreSQL database or another dedicated
  staging PostgreSQL database.
- Files: current local `UPLOAD_DIR` storage only for limited staging smoke
  tests; use private persistent object storage before real document handling.
- Network: HTTPS for both frontend and backend.
- Isolation: staging must not share the production database, production JWT
  secret, or production provider credentials.

Recommended placeholder shape:

```text
Frontend origin: <staging-frontend-origin>
Backend API: <staging-backend-origin>/api
Database: <staging-postgres-database>
```

## Required Accounts And Providers

- Frontend static hosting account.
- Backend Node runtime account.
- Dedicated staging PostgreSQL or Neon project/database.
- Secure environment-variable storage in the hosting providers.
- Optional persistent object-storage provider before handling real documents.
- Access to deployment logs for backend and frontend.
- A secure staging admin account provisioning plan.
- Optional monitoring/log access for staging smoke-test triage.

Do not use local demo secrets or local demo credentials as long-lived staging
credentials.

## Environment Variables

### Backend

| Variable | Required staging value | Rule |
| --- | --- | --- |
| `PORT` | Provider-supplied port or `5000` when required | Do not hard-code a port if the provider injects one. |
| `NODE_ENV` | `production` | Staging should run production-mode server behavior. |
| `DATABASE_URL` | `<staging-postgres-connection-url>` | Must point to the staging database only. Never commit it. |
| `CLIENT_URL` | `<staging-frontend-origin>` | Must exactly match the staging frontend origin allowed by CORS. |
| `JWT_SECRET` | `<unique-staging-jwt-secret>` | Must be generated for staging and not reused from local or production. |
| `JWT_EXPIRES_IN` | `7d` or another reviewed value | Keep explicit and documented. |
| `UPLOAD_DIR` | `uploads` or provider writable path | Local disk is only for limited staging smoke tests. |
| `MAX_FILE_SIZE_MB` | `10` or another reviewed value from 1 to 50 | Must match the expected staging upload limit. |
| `DEFAULT_ORGANIZATION_SLUG` | `advisora-demo` unless intentionally changed | Public consultation requests are assigned to this active workspace. |

Backend rules:

- `CLIENT_URL` must be an origin, not a full route. Use
  `<staging-frontend-origin>`, not `<staging-frontend-origin>/admin/login`.
- `CLIENT_URL` must not use `*` for authenticated traffic.
- Use comma-separated `CLIENT_URL` values only when multiple staging preview
  origins are intentionally allowed.
- `DATABASE_URL` must be the staging database, not local or production.
- `JWT_SECRET` must be unique for staging and at least 32 characters.
- `DEFAULT_ORGANIZATION_SLUG` must resolve to an active `Organization`. The
  current staging/demo workspace is `Advisora Demo Workspace`
  (`advisora-demo`).
- Do not reuse local demo secrets.

One-time demo seed flag:

| Variable | Required value | Rule |
| --- | --- | --- |
| `DEMO_SEED_ENABLED` | `true` | Use only for the one command that runs `npm run seed:demo` in `NODE_ENV=production`; do not keep it as a permanent runtime dependency. |
| `SECOND_WORKSPACE_SEED_ENABLED` | `true` | Use only for the one command that runs `npm run seed:second-workspace` in `NODE_ENV=production`; do not keep it as a permanent runtime dependency. |

### Frontend

| Variable | Required staging value | Rule |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `<staging-backend-origin>/api` | Must include `/api`. |

Frontend rules:

- Do not hard-code the staging API URL in source files.
- Rebuild the frontend after changing `VITE_API_BASE_URL`.
- The browser origin used for testing must match backend `CLIENT_URL`.
- A staging frontend build must not call `localhost` or `127.0.0.1` unless it
  is an intentional local-only test build.

## Backend Deployment Checklist

- [ ] Confirm the backend working directory is `server`.
- [ ] Configure all backend staging environment variables in the provider UI or
  secret store.
- [ ] Confirm `NODE_ENV=production`.
- [ ] Confirm `DATABASE_URL` points to the staging database.
- [ ] Confirm `CLIENT_URL` exactly matches the staging frontend origin.
- [ ] Confirm `JWT_SECRET` is unique for staging.
- [ ] Confirm `DEFAULT_ORGANIZATION_SLUG=advisora-demo` or document the
  intentional replacement workspace.
- [ ] Confirm `UPLOAD_DIR` is writable if document smoke testing is planned.
- [ ] Install dependencies with `npm install`.
- [ ] Generate Prisma Client with `npm run prisma:generate`.
- [ ] Validate schema with `npx prisma validate`.
- [ ] Build with `npm run build`.
- [ ] Lint with `npm run lint`.
- [ ] Apply committed migrations with `npm run prisma:deploy`.
- [ ] Start with `npm run start`.
- [ ] Verify `GET <staging-backend-origin>/api/health`.
- [ ] Review backend logs for startup errors without printing secrets.
- [ ] Confirm login and public endpoints have a rate-limiting or accepted-risk
  decision recorded before exposing staging publicly.

## Frontend Deployment Checklist

- [ ] Confirm the frontend working directory is `client`.
- [ ] Configure `VITE_API_BASE_URL=<staging-backend-origin>/api`.
- [ ] Confirm the configured API URL includes `/api`.
- [ ] Install dependencies with `npm install`.
- [ ] Build with `npm run build`.
- [ ] Lint with `npm run lint`.
- [ ] Deploy the `dist` output directory.
- [ ] Open `<staging-frontend-origin>`.
- [ ] Confirm the public routes load from the staging deployment.
- [ ] Confirm admin routes call the staging backend, not localhost.
- [ ] Confirm the browser console does not show calls to `localhost`,
  `127.0.0.1`, or a local API base URL.

## Database Migration Checklist

- [ ] Confirm the target database is the dedicated staging database.
- [ ] Confirm no production database URL is present in staging environment
  variables.
- [ ] Run `npx prisma validate` before applying migrations.
- [ ] Run `npm run prisma:deploy` to apply committed migrations.
- [ ] Confirm the Organization / Workspace migration is included.
- [ ] Confirm existing users, customers, consultation requests, cases,
  appointments, tasks, documents, case histories, and activity logs are
  backfilled to `Advisora Demo Workspace`.
- [ ] Confirm `organizationId` is required after backfill.
- [ ] Do not run `npm run prisma:migrate` against staging.
- [ ] Do not run `npm run prisma:reset` against staging unless the database is
  disposable and the reset is intentional.
- [ ] Run seed data only when intentional.
- [ ] Use `npm run seed:demo` for fictional portfolio data, not destructive
  reset commands.
- [ ] If running `seed:demo` while `NODE_ENV=production`, set
  `DEMO_SEED_ENABLED=true` for that command only.
- [ ] If tenant-isolation QA is planned, run `npm run seed:second-workspace`
  only after `seed:demo` and set `SECOND_WORKSPACE_SEED_ENABLED=true` for that
  command only when `NODE_ENV=production`.
- [ ] Run `npm run verify:tenant-isolation` after seeding the second workspace.
- [ ] Do not run `npm run seed` on staging unless intentionally creating the
  legacy local admin and documenting that risk.
- [ ] Confirm the known local demo admin credential is disabled, replaced, or
  limited to a private short-lived demo window.
- [ ] Prefer manager or staff credentials for public review; share admin
  credentials privately only.
- [ ] Treat `npm run db:verify` as a local/demo verification helper because it
  checks the known demo admin account. Do not use it as staging sign-off if the
  demo admin has been disabled or replaced.
- [ ] Record a sanitized migration result without database URLs or credentials.

## Staging Demo Seed

Run after migrations, only against the dedicated staging database:

```bash
cd server
npm run prisma:deploy
DEMO_SEED_ENABLED=true npm run seed:demo
```

Expected behavior:

- Creates or updates fictional admin, manager, and staff demo users.
- Creates or updates `Advisora Demo Workspace`.
- Creates or updates fictional customers, consultation requests, case profiles,
  appointments, tasks, case history, and activity logs.
- Assigns all demo CRM records to `Advisora Demo Workspace`.
- Uses fixed IDs and upserts so repeated runs do not duplicate the demo set.
- Does not reset the database.
- Does not delete non-demo data.
- Does not seed physical document files; upload a tiny fictional file manually
  during smoke testing if document evidence is needed.
- Disables `admin@advisora.demo` if it exists so staging does not depend on the
  known `password123` account.

Demo credentials are intentional portfolio credentials, not real secrets:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin.demo@advisora.test` | `Advisora-Demo-Admin-2026!` |
| Manager | `manager.demo@advisora.test` | `Advisora-Demo-Manager-2026!` |
| Staff | `staff.demo@advisora.test` | `Advisora-Demo-Staff-2026!` |

Do not use these accounts with real customer data. Do not publish high-privilege
admin access for long-lived public staging.

## Second Workspace Tenant-Isolation Seed

Step 22.5 adds an optional second workspace seed for QA:

```text
Name: Northstar Legal Workspace
Slug: northstar-legal
```

Run after migrations and the main Advisora demo seed, only against the
dedicated staging database:

```bash
cd server
SECOND_WORKSPACE_SEED_ENABLED=true npm run seed:second-workspace
npm run verify:tenant-isolation
```

For local PowerShell:

```powershell
cd server
$env:SECOND_WORKSPACE_SEED_ENABLED = "true"
npm run seed:second-workspace
Remove-Item Env:SECOND_WORKSPACE_SEED_ENABLED
npm run verify:tenant-isolation
```

Expected behavior:

- Creates or updates fictional Northstar admin, manager, and staff demo users.
- Creates or updates three fictional customers: Aurora Legal Group, Pacific
  Compliance Studio, and Meridian Contract Partners.
- Creates or updates Northstar consultation requests, cases, appointments,
  tasks, case history, and activity logs.
- Assigns every Northstar CRM record to `northstar-legal`.
- Uses fixed IDs and upserts so repeated runs do not duplicate the demo set.
- Does not reset the database.
- Does not delete or mutate Advisora demo data.
- Does not seed physical document files.
- Does not add public workspace signup, invitations, customer portal access, or
  a workspace switcher.

Northstar demo credentials are fictional portfolio credentials:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin.demo@northstar.test` | `Northstar-Demo-Admin-2026!` |
| Manager | `manager.demo@northstar.test` | `Northstar-Demo-Manager-2026!` |
| Staff | `staff.demo@northstar.test` | `Northstar-Demo-Staff-2026!` |

Manual tenant-isolation checklist:

- [ ] Login as `admin.demo@advisora.test`.
- [ ] Dashboard shows Advisora data only.
- [ ] Team Members does not show Northstar users.
- [ ] Customers does not show Northstar customers.
- [ ] Consultation Requests, Cases, Appointments, Tasks, and Reports show
  Advisora-scoped data only.
- [ ] Logout.
- [ ] Login as `admin.demo@northstar.test`.
- [ ] Topbar shows `Northstar Legal Workspace`.
- [ ] Dashboard shows Northstar data only.
- [ ] Team Members does not show Advisora users.
- [ ] Customers does not show Advisora customers.
- [ ] Consultation Requests, Cases, Appointments, Tasks, and Reports show
  Northstar-scoped data only.
- [ ] Public consultation form still creates requests under
  `DEFAULT_ORGANIZATION_SLUG`, which defaults to `advisora-demo`.
- [ ] No passwords, tokens, database URLs, or uploaded files are staged in Git.

## CORS Checklist

- [ ] Backend `CLIENT_URL` equals the staging frontend origin exactly.
- [ ] Frontend `VITE_API_BASE_URL` points to the staging backend API and
  includes `/api`.
- [ ] No wildcard CORS origin is used.
- [ ] No localhost origin remains in staging backend configuration unless it is
  intentionally included for a temporary test window.
- [ ] Browser requests from the staging frontend do not fail CORS preflight.
- [ ] Protected API calls from `/admin/*` work from the staging frontend.
- [ ] Direct API calls from an unlisted origin are rejected by CORS.

## JWT Secret Rotation Checklist

Rotate the Render `JWT_SECRET` after screenshots, accidental exposure, or any
demo credential incident.

- [ ] Generate a new unique staging `JWT_SECRET`.
- [ ] Update the secret in Render environment variables only.
- [ ] Restart or redeploy the Render service.
- [ ] Confirm an old Bearer token now receives `401`.
- [ ] Confirm a fresh login succeeds.
- [ ] Confirm users understand they need to log in again after rotation.
- [ ] Review logs and screenshots for leaked tokens, passwords, database URLs,
  or provider credentials.

## File Upload Warning

The current document module stores files in `UPLOAD_DIR` on local disk.

For staging:

- Use only tiny fictional test files.
- Delete uploaded smoke-test files after verification.
- Confirm uploaded files are ignored by Git.
- Confirm no upload files are staged or committed.
- Treat local disk upload storage as a staging limitation on ephemeral or
  multi-instance hosts.

Before real customer documents:

- Use private persistent object storage.
- Keep downloads authenticated or use short-lived signed URLs.
- Add malware scanning.
- Add retention and deletion policies.

## Smoke Test Checklist

### Backend

- [ ] `GET <staging-backend-origin>/api/health` returns success.
- [ ] Invalid admin login returns a generic failure.
- [ ] Valid admin login succeeds with a staging-safe account.
- [ ] Login response does not include `passwordHash`.
- [ ] Login response includes `organizationId` and
  `organization: { id, name, slug }` for the current workspace.
- [ ] `GET /api/auth/me` returns a sanitized user with workspace info.
- [ ] `GET /api/dashboard/overview` returns data.
- [ ] Dashboard overview reflects current-workspace data only.
- [ ] `npm run verify:tenant-isolation` prints
  `Tenant isolation verification: PASS` after the optional second workspace
  seed is run.
- [ ] At least one database-backed API call succeeds, such as
  `GET /api/customers` or `GET /api/public/services`.

### Frontend

- [ ] Public home page loads.
- [ ] Public services page loads.
- [ ] Public consultation form validates required fields.
- [ ] Public consultation form submits to the staging backend.
- [ ] Public consultation request appears under `Advisora Demo Workspace`.
- [ ] Admin login page loads.
- [ ] Admin login succeeds with a staging-safe account.
- [ ] Refreshing a protected deep link preserves or restores the session.
- [ ] Dashboard loads.
- [ ] Customers page loads.
- [ ] Consultation requests page loads.
- [ ] Cases page loads.
- [ ] Appointments page loads.
- [ ] Tasks page loads.
- [ ] Team Members page loads for admin users.
- [ ] Manager and staff users cannot access Team Members directly.
- [ ] Documents page loads.
- [ ] Reports page loads.
- [ ] Logout clears the client session.

### Documents

- [ ] Upload a tiny fictional PDF or image.
- [ ] View document detail.
- [ ] Download through the protected endpoint.
- [ ] Delete the test document.
- [ ] Confirm no downloaded or uploaded test file is staged or committed.

### Security

- [ ] `git status --short` shows no `.env`, token, secret, database URL, or
  upload file staged.
- [ ] Secret scan over tracked files finds no real provider credentials.
- [ ] `passwordHash` is not returned by auth, users, dashboard, or assignment
  endpoints.
- [ ] User create, edit, password reset, activate, and deactivate responses do
  not include `passwordHash`.
- [ ] User create assigns the current workspace automatically; no frontend
  organization picker or submitted `organizationId` is used.
- [ ] `/api/users` and `/api/users/assignable` return current-workspace users
  only.
- [ ] Customers, consultation requests, cases, appointments, tasks, documents,
  dashboard, and reports are scoped to the current workspace.
- [ ] Deactivated users cannot log in.
- [ ] The last active admin cannot be deactivated or demoted.
- [ ] CORS allows only the staging frontend origin or intentional preview
  origins.
- [ ] Browser console does not log access tokens, passwords, consultation form
  payloads, or other PII.
- [ ] Backend logs do not print passwords, Bearer tokens, database URLs, or
  uploaded file contents.
- [ ] The known local demo admin credential is disabled, replaced, or explicitly
  limited to a private demo window.
- [ ] The known legacy login `admin@advisora.demo` / `password123` fails on
  staging unless a short-lived private exception was intentionally recorded.
- [ ] Admin demo credentials are not published for long-lived public staging;
  manager or staff access is used for public review when possible.
- [ ] Browser-readable Bearer token storage risk is explicitly accepted for
  portfolio staging, or authentication has been migrated to an HttpOnly cookie
  strategy before real customer data.
- [ ] Login and public consultation abuse-protection risk is accepted for a
  private portfolio staging run, or rate limiting is active before public
  exposure.

## Rollback Checklist

- [ ] Record the currently deployed frontend artifact or commit.
- [ ] Record the currently deployed backend artifact or commit.
- [ ] Confirm how to redeploy the previous frontend artifact.
- [ ] Confirm how to redeploy the previous backend artifact.
- [ ] Confirm whether the staging database can be restored from a snapshot.
- [ ] Prefer a forward migration fix if a migration has already been applied
  and rollback is risky.
- [ ] If upload smoke tests created files, delete test files during rollback or
  cleanup.
- [ ] Re-run smoke tests after rollback.

## Go/No-Go Decision

Choose one:

- [ ] Go: staging is ready for reviewer testing.
- [ ] Go with accepted limitations: staging is usable for portfolio review, but
  the limitations below are accepted.
- [ ] No-go: staging is blocked.

Required go conditions:

- Backend and frontend build/lint pass.
- Prisma generate and validate pass.
- Committed migrations apply to staging.
- `GET /api/health` passes.
- Admin login and `/api/auth/me` pass with sanitized responses.
- Staging frontend can call the staging backend without CORS errors.
- Core CRM pages load.
- Public consultation form reaches the staging backend.
- No secrets, `.env` files, tokens, provider credentials, upload files, or
  downloaded files are committed.
- The known local demo admin credential is not enabled as a long-lived public
  staging credential.

Choose `Go with accepted limitations`, not full `Go`, when:

- Browser-readable Bearer token storage remains in use.
- Login and public form rate limiting is not active yet.
- Local disk upload storage is used only for tiny fictional smoke-test files.
- The staging environment is private or short-lived portfolio review only.

Known staging limitations to acknowledge:

- No real production deployment has been performed yet.
- Render Free may cold start, so the first staging API call can be slow.
- Local disk upload storage is not suitable for real multi-instance document
  handling.
- Access tokens are stored in browser local storage in this portfolio phase.
- Public contact and appointment forms are validation/demo flows only.
- No production rate limiting, captcha, centralized monitoring, alerting,
  refresh-token revocation, malware scanning, report export, or automated E2E
  suite yet.
