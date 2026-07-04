# Deployment Guide

This guide describes a provider-neutral production deployment path for the
Consulting CRM System. It intentionally uses placeholders and does not include
real URLs, tokens, or connection strings.

For a staging-specific environment matrix, checklist, smoke test, rollback
plan, and go/no-go decision record, use the
[Staging Deployment Checklist](staging-deployment-checklist.md).

For the concrete Vercel frontend, Render backend, and Neon database staging
path, use the [Vercel + Render + Neon Staging Guide](vercel-render-staging-guide.md).

## Deployment Architecture

- Frontend: static React/Vite app served from a frontend hosting platform.
- Backend: Node.js/Express API served from a Node-compatible runtime.
- Database: Neon PostgreSQL or another managed PostgreSQL database.
- Files: current local upload storage for development only; persistent private
  object storage is recommended before real production document handling.

## Prerequisites

- Node.js 20 or later.
- npm.
- A PostgreSQL database connection string.
- Separate server and client environment variables.
- A production-grade `JWT_SECRET`.
- For staging, a dedicated staging database, staging JWT secret, and exact
  staging frontend/backend origins.

## Frontend Deployment Requirements

Working directory:

```bash
cd client
```

Install command:

```bash
npm install
```

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

Required environment variable:

```dotenv
VITE_API_BASE_URL=<api-base-url>/api
```

`VITE_API_BASE_URL` must point to the deployed backend API base path, including
`/api`.

## Backend Deployment Requirements

Working directory:

```bash
cd server
```

Install command:

```bash
npm install
```

Generate Prisma client:

```bash
npm run prisma:generate
```

Build command:

```bash
npm run build
```

Start command:

```bash
npm run start
```

Required environment variables:

```dotenv
PORT=<provider-port-or-local-5000>
NODE_ENV=production
DATABASE_URL=<postgres-connection-url>
CLIENT_URL=<frontend-origin>
JWT_SECRET=<strong-private-secret>
JWT_EXPIRES_IN=7d
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=10
```

`CLIENT_URL` may contain one allowed frontend origin or a comma-separated
allowlist:

```dotenv
CLIENT_URL=<frontend-origin>,<preview-origin>
```

Do not use wildcard CORS origins for authenticated production traffic.

Provider note: local development commonly uses `PORT=5000`, but hosted Node
providers may inject their own port. For Render-specific settings, use the
[Vercel + Render + Neon Staging Guide](vercel-render-staging-guide.md).

## Database Deployment

Use the managed PostgreSQL `DATABASE_URL` supplied by the database provider.
Keep it outside the repository.

Validate the Prisma schema:

```bash
npx prisma validate
```

Apply committed migrations:

```bash
npm run prisma:deploy
```

Do not use `npm run prisma:migrate` for shared, staging, or production
databases. That command is for local development migration creation.

Seed guidance:

- Run `npm run seed` only for local legacy demo setup unless you intentionally
  accept its known credential risk.
- Run `npm run seed:demo` only for fictional portfolio staging data after
  migrations. In `NODE_ENV=production`, set `DEMO_SEED_ENABLED=true` for that
  one command so the action is explicit.
- Do not rely on known public demo passwords in production.
- Prefer a secure production account-provisioning process.

Example staging demo seed command:

```bash
cd server
DEMO_SEED_ENABLED=true npm run seed:demo
```

## CORS

Set backend `CLIENT_URL` to the deployed frontend origin.

Examples:

```dotenv
CLIENT_URL=<frontend-origin>
CLIENT_URL=<frontend-origin>,<preview-origin>
```

Set frontend `VITE_API_BASE_URL` to the deployed backend API URL:

```dotenv
VITE_API_BASE_URL=<api-base-url>/api
```

The browser URL used by testers must match one of the allowed backend CORS
origins exactly.

For staging, do not leave localhost in `CLIENT_URL` unless it is intentionally
allowed for a short test window. `CLIENT_URL` should normally be the exact
staging frontend origin, and `VITE_API_BASE_URL` should be the staging backend
API URL including `/api`.

## Authentication Note

The current admin client uses Bearer access tokens stored in browser local
storage. This is acceptable for local portfolio testing, but a real
customer-data production deployment should explicitly accept that risk or move
to a reviewed session strategy such as `HttpOnly`, `Secure`, `SameSite`
cookies.

Rotate the deployed `JWT_SECRET` after screenshots, accidental exposure, or a
credential incident. Current tokens are stateless, so rotation forces existing
sessions to log in again.

## File Uploads

The current document module stores files in `UPLOAD_DIR` on local disk. This is
acceptable for local development and limited single-instance testing, but it is
not safe for ephemeral or multi-instance production hosting.

Before handling real production documents:

- Use private persistent object storage.
- Keep downloads authenticated or short-lived.
- Add malware scanning.
- Add retention and deletion policies.

## Health Check

Liveness endpoint:

```http
GET /api/health
```

This confirms that the API process can respond. It does not prove that the
database is reachable.

## Smoke Test

After deployment, verify the items below. For a staging go/no-go pass, use the
full [Staging Deployment Checklist](staging-deployment-checklist.md). For
Vercel/Render/Neon staging, also follow
[Vercel + Render + Neon Staging Guide](vercel-render-staging-guide.md).

- `GET /api/health`.
- Admin login.
- Session refresh through `/admin/reports` or another protected deep link.
- Dashboard data loads.
- Customers list loads.
- Cases list, detail, status update, and assignment work.
- Appointments list and status update work.
- Tasks list and status update work.
- Documents upload, detail, protected download, and delete work.
- Reports overview, status chart, monthly trend, deadlines, staff performance,
  and recent activities load.
- Public website routes load.
- Public consultation form submits successfully.
- Public contact and appointment forms validate locally as documented demo
  flows.

## Rollback Notes

- Frontend rollback: redeploy the previous static artifact.
- Backend rollback: redeploy the previous backend artifact.
- Database rollback: avoid destructive rollback unless a tested migration
  rollback plan exists.
- If a migration is already applied, assess whether a forward fix is safer than
  rolling back schema changes.

## Troubleshooting

- CORS errors: confirm the browser origin exactly matches `CLIENT_URL`.
- Failed login: confirm `JWT_SECRET`, database connectivity, and seed/account
  provisioning.
- Prisma errors: run `npx prisma validate` and confirm `DATABASE_URL`.
- Upload failures: confirm `UPLOAD_DIR` is writable and the file is within
  `MAX_FILE_SIZE_MB`.
- Frontend API errors: confirm `VITE_API_BASE_URL` includes `/api`.
