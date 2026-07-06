# Consulting CRM API

Backend API for the Consulting CRM System. It provides a secure, typed Express application, environment validation, a standard API response format, centralized error handling, a health endpoint, the Prisma data model, JWT-based authentication and role authorization, and the core CRM, scheduling, document, dashboard, and reporting APIs.

## Portfolio Release Summary

The backend is a modular Express API for the portfolio/staging demo path:

- Public routes: health, public services, public consultation intake, workspace
  signup, and invitation preview/accept.
- Internal CRM routes: auth, workspace, users, customers, services,
  consultation requests, cases, appointments, tasks, documents, dashboard,
  reports, and Activity Center.
- Customer portal routes: portal auth, profile, cases, documents, and updates.
- Infrastructure services: Prisma ORM, document storage abstraction,
  scanner/OCR provider abstraction, email provider abstraction, security
  headers, rate limits, and redaction helpers.

For diagrams and release context, see [Architecture](../docs/architecture.md)
and [Release Notes](../docs/release-notes.md).

## Tech stack

- Node.js 20 or later
- Express 5 and TypeScript
- PostgreSQL and Prisma ORM 6
- Zod environment validation
- Helmet, CORS, and Morgan
- bcryptjs for password hashing
- JSON Web Tokens for stateless Bearer authentication
- Multer for authenticated local-development file uploads

## Folder structure

```text
server/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── config/
│   ├── constants/
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── utils/
│   ├── app.ts
│   └── server.ts
├── .env.example
├── package.json
└── tsconfig.json
```

## Environment variables

Copy `.env.example` to `.env` and adjust the values for your local environment.

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | Yes | HTTP port, defaults to the example value `5000` |
| `NODE_ENV` | Yes | `development`, `test`, or `production` |
| `DATABASE_URL` | Yes | PostgreSQL connection URL used by Prisma |
| `CLIENT_URL` | Yes | Allowed frontend origin for CORS, or comma-separated allowed origins |
| `JWT_SECRET` | Yes | Secret used to sign access tokens; use at least 32 characters |
| `JWT_EXPIRES_IN` | Yes | Access-token lifetime, for example `7d` |
| `UPLOAD_DIR` | No | Local-development upload directory, defaults to `uploads` |
| `MAX_FILE_SIZE_MB` | No | Per-file upload limit from 1 to 50 MB, defaults to `10` |
| `DOCUMENT_STORAGE_PROVIDER` | No | `local` by default; set `s3` for private S3-compatible storage |
| `DOCUMENT_STORAGE_BUCKET` | S3 only | Private S3 bucket name |
| `DOCUMENT_STORAGE_REGION` | S3 only | S3 region |
| `DOCUMENT_STORAGE_ENDPOINT` | No | Optional S3-compatible endpoint |
| `DOCUMENT_STORAGE_ACCESS_KEY_ID` | S3 only | S3 access key id; never commit real values |
| `DOCUMENT_STORAGE_SECRET_ACCESS_KEY` | S3 only | S3 secret access key; never commit real values |
| `DOCUMENT_STORAGE_FORCE_PATH_STYLE` | No | `true` by default for S3-compatible providers |
| `DOCUMENT_SIGNED_URL_EXPIRES_SECONDS` | No | Short-lived signed URL TTL, defaults to `300` |
| `DOCUMENT_MALWARE_SCANNER` | No | `disabled`, `mock`, or `clamav`; defaults to `disabled` |
| `DOCUMENT_ALLOW_DOWNLOAD_WHEN_SCAN_SKIPPED` | No | Defaults to `true` for local/demo compatibility |
| `DOCUMENT_ALLOW_DOWNLOAD_WHEN_SCAN_FAILED` | No | Defaults to `false` |
| `CLAMAV_HOST`, `CLAMAV_PORT` | ClamAV only | Optional ClamAV connection settings |
| `DOCUMENT_OCR_PROVIDER` | No | `disabled`, `mock`, or `tesseract`; defaults to `disabled` |
| `DOCUMENT_OCR_MAX_FILE_SIZE_MB` | No | OCR size limit, defaults to `10` |
| `DOCUMENT_OCR_ENABLED_MIME_TYPES` | No | Optional comma-separated OCR MIME allowlist |
| `DEFAULT_ORGANIZATION_SLUG` | No | Workspace slug used by public consultation requests, defaults to `advisora-demo` |
| `WORKSPACE_SIGNUP_ENABLED` | No | Enables public `POST /api/workspaces/signup` only when set to `true`; defaults to `false` |
| `CONSULTATION_AUTOMATION_ENABLED` | No | Enables consultation workflow automation; defaults to `true` |
| `CONSULTATION_AUTO_TASK_ENABLED` | No | Enables automatic follow-up task creation; defaults to `true` |
| `CONSULTATION_AUTO_EMAIL_ENABLED` | No | Enables consultation follow-up email attempts; defaults to `true` |
| `CONSULTATION_FOLLOW_UP_DUE_HOURS` | No | Follow-up task due offset in hours, from 1 to 720; defaults to `24` |
| `APP_NAME` | No | Name used in email templates; defaults to `Advisora CRM` |
| `EMAIL_PROVIDER` | No | Email provider for invitations and consultation automation: `disabled`, `console`, or `resend`; defaults to `console` |
| `EMAIL_FROM` | No | Sender identity for outbound emails |
| `EMAIL_REPLY_TO` | No | Optional reply-to address for outbound emails |
| `RESEND_API_KEY` | No | Resend API key, required only when `EMAIL_PROVIDER=resend`; never commit it |
| `RATE_LIMIT_ENABLED` | No | Enables in-memory rate limits, defaults to `true` |
| `AUTH_RATE_LIMIT_WINDOW_MINUTES` | No | Auth/invitation rate-limit window, defaults to `15` |
| `AUTH_RATE_LIMIT_MAX` | No | Auth/invitation requests per window, defaults to `10` |
| `PUBLIC_RATE_LIMIT_WINDOW_MINUTES` | No | Public intake rate-limit window, defaults to `15` |
| `PUBLIC_RATE_LIMIT_MAX` | No | Public intake requests per window, defaults to `50` |
| `UPLOAD_RATE_LIMIT_WINDOW_MINUTES` | No | Upload rate-limit window, defaults to `15` |
| `UPLOAD_RATE_LIMIT_MAX` | No | Upload requests per window, defaults to `20` |
| `DOWNLOAD_RATE_LIMIT_WINDOW_MINUTES` | No | Download rate-limit window, defaults to `15` |
| `DOWNLOAD_RATE_LIMIT_MAX` | No | Download requests per window, defaults to `100` |

Example:

```dotenv
PORT=5000
NODE_ENV=development
DATABASE_URL="<postgres-connection-url>"
CLIENT_URL="http://localhost:5173"
JWT_SECRET="<strong-private-secret-at-least-32-characters>"
JWT_EXPIRES_IN="7d"
UPLOAD_DIR="uploads"
MAX_FILE_SIZE_MB=10
DOCUMENT_STORAGE_PROVIDER=local
DOCUMENT_STORAGE_BUCKET=
DOCUMENT_STORAGE_REGION=
DOCUMENT_STORAGE_ENDPOINT=
DOCUMENT_STORAGE_ACCESS_KEY_ID=
DOCUMENT_STORAGE_SECRET_ACCESS_KEY=
DOCUMENT_STORAGE_FORCE_PATH_STYLE=true
DOCUMENT_SIGNED_URL_EXPIRES_SECONDS=300
DOCUMENT_MALWARE_SCANNER=disabled
DOCUMENT_ALLOW_DOWNLOAD_WHEN_SCAN_SKIPPED=true
DOCUMENT_ALLOW_DOWNLOAD_WHEN_SCAN_FAILED=false
CLAMAV_HOST=
CLAMAV_PORT=
DOCUMENT_OCR_PROVIDER=disabled
DOCUMENT_OCR_MAX_FILE_SIZE_MB=10
DOCUMENT_OCR_ENABLED_MIME_TYPES=
DEFAULT_ORGANIZATION_SLUG="advisora-demo"
WORKSPACE_SIGNUP_ENABLED=false
CONSULTATION_AUTOMATION_ENABLED=true
CONSULTATION_AUTO_TASK_ENABLED=true
CONSULTATION_AUTO_EMAIL_ENABLED=true
CONSULTATION_FOLLOW_UP_DUE_HOURS=24
APP_NAME="Advisora CRM"
EMAIL_PROVIDER=console
EMAIL_FROM="Advisora CRM <no-reply@advisora.test>"
EMAIL_REPLY_TO=
RESEND_API_KEY=
RATE_LIMIT_ENABLED=true
AUTH_RATE_LIMIT_WINDOW_MINUTES=15
AUTH_RATE_LIMIT_MAX=10
PUBLIC_RATE_LIMIT_WINDOW_MINUTES=15
PUBLIC_RATE_LIMIT_MAX=50
UPLOAD_RATE_LIMIT_WINDOW_MINUTES=15
UPLOAD_RATE_LIMIT_MAX=20
DOWNLOAD_RATE_LIMIT_WINDOW_MINUTES=15
DOWNLOAD_RATE_LIMIT_MAX=100
```

`CLIENT_URL` can be a single origin such as `http://localhost:5173` or a
comma-separated allowlist such as
`http://localhost:5173,<frontend-origin>`. Each value must be an origin only:
no paths, queries, hashes, trailing slashes, or wildcard origins. Do not leave
trailing commas.

Do not commit `.env`, real email provider API keys, or verified sender
credentials in a shared or production environment.

## Security hardening

Step 31 configures Helmet security headers in `src/app.ts`, disables
`x-powered-by`, keeps CORS restricted to `CLIENT_URL`, and limits JSON and
URL-encoded bodies to `1mb`. Upload routes still use multer and
`MAX_FILE_SIZE_MB` separately.

The app uses reusable in-memory rate limiters for:

- `POST /api/auth/login`
- `POST /api/portal/auth/login`
- `POST /api/workspaces/signup`
- `POST /api/public/consultation-requests`
- `POST /api/invitations`
- `POST /api/invitations/:id/resend`
- `GET /api/invitations/public/:token`
- `POST /api/invitations/public/:token/accept`
- `POST /api/documents/upload`
- `POST /api/portal/documents`
- `GET /api/documents/:id/download`
- `GET /api/portal/documents/:id/download`

Rate-limit failures return `429` with the generic message
`Too many requests. Please try again later.` and do not expose email,
workspace, user, or token details. The limiter is process-local and IP-based,
so use Redis or another shared store before multi-instance production.

`src/utils/redact.ts` redacts Bearer tokens, invitation URLs, token/password/key
query parameters, storage URLs, environment secret assignments, `/uploads/...`
paths, and local Windows paths. Request logs, non-production error details,
not-found paths, and Activity Center descriptions use this helper.

Internal access tokens are now signed with `purpose: "internal"` while older
internal tokens without a purpose remain accepted for compatibility. Customer
portal tokens still require `purpose: "customer_portal"`. Internal middleware
rejects portal tokens, and portal middleware rejects internal tokens.

See [Security Hardening](../docs/security-hardening.md) and
[Security RBAC Matrix](../docs/security-rbac-matrix.md) for the full Step 31
review.

## Run with a real database

Choose and configure either local PostgreSQL or Supabase/Neon by following
[the database setup guide](docs/database-setup.md). From the `server`
directory in Windows PowerShell:

```powershell
npm install
Copy-Item .env.example .env
# Edit .env and set DATABASE_URL before continuing.
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run db:verify
npm run dev
```

`prisma:migrate`, `seed`, and `db:verify` require a reachable PostgreSQL
database. `db:verify` confirms that the demo administrator and all four seeded
services exist; it does not print the connection string or password.

The committed migration, seed, database verification, health check, and
administrator login have passed against a live Neon PostgreSQL database. See
the sanitized [live database verification record](docs/live-database-verification.md).
The real connection URL remains in local `server/.env` and is not committed.

Do not commit `.env`. Managed PostgreSQL providers may require
`sslmode=require` and a direct/non-transaction-pooled URL for migrations;
follow the provider's connection instructions. When applying the already
committed migrations to a shared or managed database, use
`npm run prisma:deploy` instead of the development migration command.

Build and run the compiled application:

```bash
npm run build
npm run start
```

The development server runs at `http://localhost:5000` with the example configuration.

## CI Checks

The GitHub Actions CI workflow validates the backend with safe dummy
environment values. Prisma generate and schema validation do not require a live
database connection.

CI commands:

```bash
npm ci
npm run prisma:generate
npx prisma validate
npm run lint
npm run build
```

CI intentionally does not run `prisma:migrate`, `prisma:deploy`,
`prisma:reset`, `seed`, `seed:demo`, `seed:second-workspace`, or
`verify:tenant-isolation`. Tenant isolation verification requires a real
`DATABASE_URL` with seeded Advisora and Northstar data, so it remains a local or
staging verification command until a dedicated CI database is configured.

The manual `Production Smoke` GitHub Actions workflow can run
`npm run smoke:production` only through `workflow_dispatch` and only when the
required `SMOKE_*` repository secrets are configured.

## Health check

```http
GET /api/health
```

Expected response:

```json
{
  "success": true,
  "message": "Backend service is healthy.",
  "data": {
    "service": "Consulting CRM API",
    "status": "ok",
    "timestamp": "2026-01-01T00:00:00.000Z"
  }
}
```

The timestamp is generated at request time.

This endpoint is a liveness check for the API process. It does not verify
database connectivity or storage readiness.

## Authentication and authorization

Authentication uses an access token in the HTTP `Authorization` header:

```http
Authorization: Bearer <token>
```

### Log in

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "admin@advisora.demo",
  "password": "password123"
}
```

A successful response contains `data.accessToken` and a sanitized `data.user`.
The user payload includes `organizationId` and safe workspace info as
`organization: { id, name, slug }`. Use the access token as a Bearer token for
protected requests.

### Get the current user

```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Log out

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

Logout acknowledges the client request. Tokens are stateless in this phase, so the client must remove its stored access token.

Authentication reloads the user and organization from the database on each
protected request. Inactive users or inactive workspaces are denied. Tokens
created before the workspace foundation do not crash the app; if they still
verify, the middleware derives the user's current organization from the
database.

## Customer portal foundation

Step 27 adds a separate customer portal auth boundary. Customer portal users
are stored in `CustomerPortalAccount`, not `User`, and portal JWTs carry
`purpose: "customer_portal"`. Internal auth rejects portal-purpose tokens, and
portal middleware rejects internal tokens.

Portal login:

```http
POST /api/portal/auth/login
Content-Type: application/json
```

```json
{
  "workspaceSlug": "advisora-demo",
  "email": "customer@example.com",
  "password": "Portal-Password-2026!"
}
```

Successful login returns `accessToken`, safe `portalAccount`, safe `customer`,
and safe `organization`. Failed portal login uses the generic message
`Invalid workspace, email, or password.`. Portal responses never include
`passwordHash` or internal `User` data.

Portal session/profile:

```http
GET /api/portal/auth/me
Authorization: Bearer <portal-token>
```

```http
GET /api/portal/me
Authorization: Bearer <portal-token>
```

Internal admins and managers can manage portal access for existing customers:

```http
GET /api/customers/<customer-uuid>/portal-account
POST /api/customers/<customer-uuid>/portal-account
PATCH /api/customers/<customer-uuid>/portal-account/password
PATCH /api/customers/<customer-uuid>/portal-account/deactivate
PATCH /api/customers/<customer-uuid>/portal-account/activate
Authorization: Bearer <internal-admin-or-manager-token>
```

Create and password reset accept an optional `password`; when omitted, the API
generates a temporary password and returns it once as `temporaryPassword`.
STAFF users are blocked from portal-account management. Activity logs record
create, password reset, deactivate, and activate actions without storing raw
passwords.

Step 28 adds read-only portal case tracking. Step 29 adds customer portal
documents, and Step 30 adds customer-safe portal updates. These endpoints
require a portal token and scope every query by the portal account's
`organizationId` and `customerId`; the client cannot override either value.

```http
GET /api/portal/cases/summary
GET /api/portal/cases?page=1&limit=10&status=PROCESSING&search=CASE
GET /api/portal/cases/<case-uuid>
Authorization: Bearer <portal-token>
```

Portal case detail returns safe case overview, customer summary, service
summary, assigned staff summary, status timeline, appointment safe fields,
portal-visible document metadata, and task summary. It never returns
`CaseProfile.note`, `CaseHistory.note`, staff email/phone, `Document.fileUrl`,
raw storage paths, password hashes, or token hashes. Cases outside the portal
account's customer or workspace return a generic `404`.

Portal documents use separate `/api/portal/documents` routes and never reuse the
internal `/api/documents/:id/download` route. Existing internal documents
default to `source=INTERNAL` and `visibility=INTERNAL_ONLY`; an Admin or Manager
must mark them `CUSTOMER_VISIBLE` before a portal account can list or download
them. Customer portal uploads are stored as `source=CUSTOMER_PORTAL` and
`visibility=CUSTOMER_VISIBLE`, scoped to the authenticated portal account's
organization and customer. Portal download checks database ownership and
visibility before streaming the local file and returns a generic `404` for
out-of-scope documents.

Portal updates use `/api/portal/updates` and `/api/portal/updates/summary`.
They are normalized from safe case-history status/action fields, appointments,
customer-visible documents, current portal-account download audits, and account
readiness. They do not expose raw internal `ActivityLog` rows, internal notes,
staff contact details, storage metadata, token hashes, password hashes, IP
addresses, or user-agent data.

## Workspace signup

Step 23 adds guarded public workspace onboarding:

```http
POST /api/workspaces/signup
Content-Type: application/json
```

`WORKSPACE_SIGNUP_ENABLED` defaults to `false`. When the flag is not exactly
`true`, the backend returns `403` with:

```text
Workspace signup is currently disabled.
```

When enabled, the endpoint:

- Normalizes or generates a unique workspace slug.
- Creates a new `Organization`.
- Creates the first active owner user with role `ADMIN`.
- Hashes the password with bcrypt.
- Records a `WORKSPACE_CREATED` activity log.
- Returns `accessToken`, sanitized `user`, and safe `organization` info.

Example request:

```json
{
  "workspaceName": "Acme Advisory Workspace",
  "ownerFullName": "Acme Demo Owner",
  "ownerEmail": "owner.demo@acme.test",
  "password": "Acme-Demo-Owner-2026!",
  "confirmPassword": "Acme-Demo-Owner-2026!"
}
```

Example response data:

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "<user-id>",
    "organizationId": "<organization-id>",
    "fullName": "Acme Demo Owner",
    "email": "owner.demo@acme.test",
    "role": "ADMIN",
    "organization": {
      "id": "<organization-id>",
      "name": "Acme Advisory Workspace",
      "slug": "acme-advisory-workspace"
    }
  },
  "organization": {
    "id": "<organization-id>",
    "name": "Acme Advisory Workspace",
    "slug": "acme-advisory-workspace"
  }
}
```

The endpoint rejects client-supplied `role`, `organizationId`, `isActive`, and
`passwordHash`. `User.email` is still globally unique in Step 23, so an owner
email cannot be reused in another workspace. Public consultation requests
continue to map to `DEFAULT_ORGANIZATION_SLUG`; signup does not create a
workspace-specific public portal or intake URL.

This is a portfolio/staging Bearer-token flow. Do not treat it as production
auth hardening until token storage, refresh/revocation, captcha or stronger
abuse protection, and production observability are reviewed.

## Workspace settings

Step 26 adds current-workspace profile endpoints:

```http
GET /api/workspace/me
Authorization: Bearer <token>
```

```http
PATCH /api/workspace/me
Authorization: Bearer <admin-token>
Content-Type: application/json
```

`GET /api/workspace/me` is available to active `ADMIN`, `MANAGER`, and `STAFF`
users. It returns only safe organization fields: `id`, `name`, `slug`,
`industry`, `website`, `phone`, `email`, `address`, `logoUrl`, `isActive`,
`createdAt`, and `updatedAt`.

`PATCH /api/workspace/me` requires an active `ADMIN`. It updates only the
authenticated user's current workspace from `request.user.organizationId`;
clients cannot send `organizationId`, `id`, `isActive`, or timestamp fields.
Allowed fields are `name`, `slug`, `industry`, `website`, `email`, `phone`,
`address`, and `logoUrl`. Empty optional fields are stored as `null`.

Slug updates are normalized and validated with lowercase letters, numbers, and
hyphens only, length 3-50. A slug already used by another organization returns
`409`; sending the current slug is allowed. Successful updates write a
`WORKSPACE_UPDATED` activity log for the current organization. Logo management
is URL-only in this step; file upload for logos, custom domains, billing,
workspace switching, and multi-membership remain future roadmap scope.

Public consultation requests still resolve the default workspace through
`DEFAULT_ORGANIZATION_SLUG`; changing a workspace slug does not update that
environment variable.

### Assignable users

```http
GET /api/users/assignable
Authorization: Bearer <token>
```

This endpoint is available to active `ADMIN` and `MANAGER` users for case
assignment. It returns only active CRM users with the `ADMIN`, `MANAGER`, or
`STAFF` role in the current workspace and exposes only safe profile fields; it
never includes `passwordHash`.

### Admin-only users

```http
GET /api/users
Authorization: Bearer <token>
```

```http
GET /api/users/<user-uuid>
Authorization: Bearer <token>
```

```http
POST /api/users
Authorization: Bearer <token>
```

```http
PATCH /api/users/<user-uuid>
Authorization: Bearer <token>
```

```http
PATCH /api/users/<user-uuid>/password
Authorization: Bearer <token>
```

These endpoints require an active authenticated user with the `ADMIN` role.
They manage internal CRM users only: `ADMIN`, `MANAGER`, and `STAFF`. Public
visitors and customer portal accounts are outside this module.
Administrators can manage only users in their own workspace. User creation
assigns the current workspace on the server; clients cannot submit
`organizationId`.

The user list supports `page`, `limit`, `search`, `role`, and `isActive` query
parameters. User create accepts `fullName`, unique `email`, optional `phone`,
`role`, `password` or `temporaryPassword`, optional `avatarUrl`, and optional
`isActive`. User update accepts `fullName`, `phone`, `avatarUrl`, `role`, and
`isActive`. Password reset accepts `newPassword`.

User responses never include `passwordHash`. Hard delete is intentionally not
available; deactivate users with `isActive=false` instead. The API prevents the
last active administrator from being deactivated or demoted.

Missing or invalid authentication returns `401`, insufficient permissions
returns `403`, validation errors return `400`, duplicate email returns `409`,
and a missing user record returns `404`.

### Admin-only workspace invitations

```http
GET /api/invitations
Authorization: Bearer <token>
```

```http
POST /api/invitations
Authorization: Bearer <token>
```

```http
POST /api/invitations/<invitation-uuid>/resend
Authorization: Bearer <token>
```

```http
PATCH /api/invitations/<invitation-uuid>/revoke
Authorization: Bearer <token>
```

These endpoints require an active authenticated `ADMIN` in the current
workspace. Invitation create accepts a unique email, `ADMIN`, `MANAGER`, or
`STAFF` role, optional `expiresInDays` from 1 to 30, and optional
`sendEmail` defaulting to `true`. Existing account emails and duplicate
unexpired pending invitations return `409`.

The API stores only a SHA-256 `tokenHash`. Admin list, create, and revoke
responses never include `tokenHash`. Create and resend return a one-time
`inviteUrl` so an administrator can copy the link if email delivery is disabled
or fails. Old invitation list rows cannot recover the link.

Email delivery is configured with `EMAIL_PROVIDER`:

- `console` is the default for local and staging. It logs a masked preview with
  a redacted accept URL and returns `emailDelivery.status = MOCK_SENT`.
- `disabled` does not send email and returns `DISABLED`.
- `resend` uses the Resend REST API via Node `fetch`. It requires
  `RESEND_API_KEY` and `EMAIL_FROM` to be supplied through environment
  variables outside the repository. Missing or rejected provider config returns
  `FAILED` in `emailDelivery` without deleting the invitation.

Resend rotates the invitation token, sets the invitation back to `PENDING`,
updates the expiry, and invalidates older links immediately. Accepted and
revoked invitations cannot be resent.

Consultation automation uses the same email provider. When
`CONSULTATION_AUTO_EMAIL_ENABLED=true` and a same-workspace manager/admin is
assigned to the generated follow-up task, the backend sends that user a safe
summary of the public request. Email failure writes
`CONSULTATION_AUTOMATION_EMAIL_FAILED` activity and never rolls back the saved
consultation request or follow-up task.

```http
GET /api/invitations/public/<invite-token>
```

```http
POST /api/invitations/public/<invite-token>/accept
```

Public preview returns only the invited email, role, expiry, and safe workspace
identity. Public accept validates full name, optional phone, password, and
password confirmation. The accepted user is created in the invitation's
workspace with the invitation's role; clients cannot submit `organizationId` or
`role`. Successful accept returns an access token and safe user payload for
auto-login. Invalid, expired, revoked, or accepted invitation tokens do not use
`401`; they return a generic public error without leaking `tokenHash`.

## Core CRM APIs

Public routes do not require an access token. Protected routes require:

```http
Authorization: Bearer <token>
```

Step 22 adds the Organization / Workspace tenant foundation. Protected CRM
routes scope customers, consultation requests, cases, appointments, tasks,
documents, dashboard data, reports, and internal users by
`request.user.organizationId`. Requests that include unknown fields such as a
client-supplied `organizationId` fail validation instead of selecting a tenant
from the browser. Services remain a global catalog in this step.

### Customers

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/customers` | `ADMIN`, `MANAGER`, `STAFF` |
| `GET` | `/api/customers/:id` | `ADMIN`, `MANAGER`, `STAFF` |
| `POST` | `/api/customers` | `ADMIN`, `MANAGER`, `STAFF` |
| `PATCH` | `/api/customers/:id` | `ADMIN`, `MANAGER`, `STAFF` |
| `DELETE` | `/api/customers/:id` | `ADMIN`, `MANAGER` |

The list endpoint supports `search`, `page`, and `limit`. The maximum page size is 100.

### Services

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/public/services` | Public |
| `GET` | `/api/services` | `ADMIN`, `MANAGER`, `STAFF` |
| `GET` | `/api/services/:id` | `ADMIN`, `MANAGER`, `STAFF` |
| `POST` | `/api/services` | `ADMIN`, `MANAGER` |
| `PATCH` | `/api/services/:id` | `ADMIN`, `MANAGER` |
| `DELETE` | `/api/services/:id` | `ADMIN` |

Only active services appear in the public response. Internal service lists support `search`, `isActive`, `page`, and `limit`.

### Consultation requests

| Method | Endpoint | Access |
| --- | --- | --- |
| `POST` | `/api/public/consultation-requests` | Public |
| `GET` | `/api/consultation-requests` | `ADMIN`, `MANAGER`, `STAFF` |
| `GET` | `/api/consultation-requests/:id` | `ADMIN`, `MANAGER`, `STAFF` |
| `PATCH` | `/api/consultation-requests/:id/status` | `ADMIN`, `MANAGER`, `STAFF` |

Example public submission:

```json
{
  "fullName": "Nguyen Van A",
  "phone": "0909000000",
  "email": "customer@example.com",
  "serviceId": "00000000-0000-0000-0000-000000000000",
  "message": "I need legal consulting support."
}
```

`serviceId` is optional, but it must identify an active service when supplied.
After the request is saved, rule-based automation can create a follow-up task,
record ActivityLog entries, and optionally send an assignee email. The public
response stays the same and never exposes tenant IDs, task IDs, provider
responses, or automation internals.

### Consultation workflow automation

Step 36 adds inline CRM automation for public consultation intake:

- `CONSULTATION_REQUEST_CREATED` is written after the request is saved.
- If `CONSULTATION_AUTOMATION_ENABLED` and `CONSULTATION_AUTO_TASK_ENABLED` are
  true, a HIGH-priority `TODO` task is created with a safe request summary.
- Assignment is same-tenant only: first active `MANAGER` in the request
  organization, then first active `ADMIN`; if no manager/admin exists, the task
  is left unassigned.
- `CONSULTATION_FOLLOW_UP_DUE_HOURS` controls the task deadline offset and
  defaults to 24 hours.
- If `CONSULTATION_AUTO_EMAIL_ENABLED` is true and an assignee has an email,
  the existing email abstraction sends a safe summary through `console`,
  `resend`, or skips when `EMAIL_PROVIDER=disabled`.
- Email delivery failures are non-blocking and recorded as activity; task
  creation failure is logged safely and does not delete the request.

The automation is rule-based and inline. It is not AI, realtime messaging, a
background job queue, or a configurable workflow builder.
Public submissions are assigned to the active organization configured by
`DEFAULT_ORGANIZATION_SLUG`, falling back to `advisora-demo`. The internal list
supports `search`, `status`, `serviceId`, `page`, and `limit`. Status updates
accept `NEW`, `CONTACTED`, or `CLOSED`; `CONVERTED` is reserved for the future
transactional conversion workflow.

List responses use a consistent pagination envelope:

```json
{
  "items": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

Public consultation submissions use the Step 31 public rate limiter. Distributed
rate limiting, captcha, and abuse monitoring remain future production
hardening. Protected CRM routes enforce authorization on the server; hiding
controls in a client is not a security boundary.

### Case profiles

All case-profile routes require an access token:

```http
Authorization: Bearer <token>
```

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/cases` | `ADMIN`, `MANAGER`, assigned `STAFF` |
| `GET` | `/api/cases/overdue` | `ADMIN`, `MANAGER`, assigned `STAFF` |
| `GET` | `/api/cases/:id` | `ADMIN`, `MANAGER`, assigned `STAFF` |
| `POST` | `/api/cases` | `ADMIN`, `MANAGER`, `STAFF` |
| `PATCH` | `/api/cases/:id` | `ADMIN`, `MANAGER`, assigned `STAFF` |
| `PATCH` | `/api/cases/:id/status` | `ADMIN`, `MANAGER`, assigned `STAFF` |
| `PATCH` | `/api/cases/:id/assign` | `ADMIN`, `MANAGER` |
| `GET` | `/api/cases/:id/history` | `ADMIN`, `MANAGER`, assigned `STAFF` |
| `DELETE` | `/api/cases/:id` | `ADMIN`, `MANAGER` |

Administrators and managers can manage all case profiles. Staff members can
create cases but can only read or update cases assigned to them; staff cannot
reassign or delete cases. List, overdue, and history endpoints are paginated.
Deleting a case is rejected when it has related documents, tasks, or
appointments.

The supported forward workflow is:

```text
RECEIVED -> VERIFYING -> PROPOSING_SOLUTION -> PROCESSING -> COMPLETED
```

Any non-terminal status can transition to `CANCELLED`. `COMPLETED` and
`CANCELLED` are terminal states, backward transitions are rejected, and status
changes are recorded in case history.

### Appointments

All appointment routes require an access token:

```http
Authorization: Bearer <token>
```

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/appointments` | `ADMIN`, `MANAGER`, assigned `STAFF` |
| `GET` | `/api/appointments/today` | `ADMIN`, `MANAGER`, assigned `STAFF` |
| `GET` | `/api/appointments/:id` | `ADMIN`, `MANAGER`, assigned `STAFF` |
| `POST` | `/api/appointments` | `ADMIN`, `MANAGER`, `STAFF` for self |
| `PATCH` | `/api/appointments/:id` | `ADMIN`, `MANAGER`, assigned `STAFF` |
| `PATCH` | `/api/appointments/:id/status` | `ADMIN`, `MANAGER`, assigned `STAFF` |
| `DELETE` | `/api/appointments/:id` | `ADMIN`, `MANAGER`, eligible assigned `STAFF` |

Administrators and managers can manage all appointments. Staff members only
see and manage appointments assigned to them. When staff list appointments or
today's appointments, the API enforces their own user ID even if another
`staffId` is supplied. Staff-created appointments are assigned to the actor and
cannot be reassigned to another user. Staff can delete their own appointments
only while they are `PENDING` or `CANCELLED`; completed appointments cannot be
deleted by any role.

The appointment list supports `search`, `status`, `method`, `customerId`,
`caseProfileId`, `staffId`, `date`, `fromDate`, `toDate`, `page`, and `limit`.
The today endpoint returns non-cancelled appointments whose appointment date is
the current server date and optionally filters by `staffId` for administrators
and managers. Appointment responses include basic customer, case-profile, and
sanitized staff information.

The supported appointment workflow is:

```text
PENDING -> CONFIRMED -> COMPLETED
       \-> CANCELLED
CONFIRMED -> CANCELLED
```

`COMPLETED` and `CANCELLED` are terminal states. Repeating the current status is
rejected with `400`, while any other unsupported transition is rejected with
`409`.

### Tasks

All task routes require an access token:

```http
Authorization: Bearer <token>
```

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/tasks` | `ADMIN`, `MANAGER`, related `STAFF` |
| `GET` | `/api/tasks/overdue` | `ADMIN`, `MANAGER`, assigned `STAFF` |
| `GET` | `/api/tasks/:id` | `ADMIN`, `MANAGER`, related `STAFF` |
| `POST` | `/api/tasks` | `ADMIN`, `MANAGER`, `STAFF` for self |
| `PATCH` | `/api/tasks/:id` | `ADMIN`, `MANAGER`, assigned `STAFF` |
| `PATCH` | `/api/tasks/:id/status` | `ADMIN`, `MANAGER`, assigned `STAFF` |
| `DELETE` | `/api/tasks/:id` | `ADMIN`, `MANAGER`, eligible related `STAFF` |

Administrators and managers can manage all tasks and assign them to any active
CRM user. Staff members can list and view tasks that they created or that are
assigned to them, but they can update task fields and statuses only when they
are the assignee. Staff-created tasks are self-assigned, and a linked case must
also be assigned to that staff member. Staff can delete a task when they are
its creator or assignee and it is not `DONE`; completed tasks cannot be deleted
by any role.

The task list supports `search`, `status`, `priority`, `assignedToId`,
`createdById`, `caseProfileId`, `page`, and `limit`. The overdue endpoint
returns paginated tasks whose deadline is before the current time and whose
status is neither `DONE` nor `CANCELLED`; staff only receive overdue tasks
assigned to them. Task responses include basic case-profile information and
sanitized assignee and creator information.

The supported task workflow is:

```text
TODO -> IN_PROGRESS -> DONE
    \-> CANCELLED
IN_PROGRESS -> CANCELLED
```

`DONE` and `CANCELLED` are terminal states. Repeating the current status is
rejected with `400`, while any other unsupported transition is rejected with
`409`.

### Documents

All document routes require an access token:

```http
Authorization: Bearer <token>
```

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/documents` | `ADMIN`, `MANAGER`, authorized `STAFF` |
| `GET` | `/api/documents/:id` | `ADMIN`, `MANAGER`, authorized `STAFF` |
| `GET` | `/api/documents/:id/download` | `ADMIN`, `MANAGER`, authorized `STAFF` |
| `POST` | `/api/documents/upload` | `ADMIN`, `MANAGER`, scoped `STAFF` |
| `PATCH` | `/api/documents/:id/portal-visibility` | `ADMIN`, `MANAGER` |
| `DELETE` | `/api/documents/:id` | `ADMIN`, `MANAGER`, eligible uploader `STAFF` |

The upload endpoint accepts `multipart/form-data` with these fields:

| Field | Required | Description |
| --- | --- | --- |
| `file` | Yes | PDF, JPEG, PNG, WebP, Word, or Excel file |
| `customerId` | Conditional | Customer UUID; either this field or `caseProfileId` is required |
| `caseProfileId` | Conditional | Case-profile UUID; either this field or `customerId` is required |
| `fileType` | No | A `DocumentType` value; defaults to `OTHER` |

When only `caseProfileId` is supplied, the document automatically receives the
case's `customerId`. When both relation IDs are supplied, the customer must
match the case's customer. The authenticated user is recorded as the uploader.
Internal uploads default to `source=INTERNAL` and `visibility=INTERNAL_ONLY`.

Administrators and managers can list, view, upload, and delete documents across
the CRM. Staff can view documents they uploaded or documents attached to cases
assigned to them. Staff can upload to an assigned case or create a
customer-only document as its uploader. Staff can delete only their own
documents, and cannot delete one attached to another staff member's case.

The document list supports `search`, `fileType`, `customerId`,
`caseProfileId`, `uploadedById`, `page`, and `limit`. Staff queries remain
scoped to documents they are authorized to access. Responses include basic
customer and case-profile data, sanitized uploader data, `source`, and
`visibility`; they never include `passwordHash` or an absolute filesystem path.
The protected internal download endpoint applies the same access rules and
returns `404` when the metadata or physical file is missing.

The portal visibility endpoint accepts:

```json
{
  "visibility": "CUSTOMER_VISIBLE"
}
```

Allowed values are `INTERNAL_ONLY` and `CUSTOMER_VISIBLE`. It does not change
customer, case, organization, or file metadata. Visibility changes are audited
with `DOCUMENT_PORTAL_VISIBILITY_UPDATED`.

### Customer portal documents

Portal document routes require a customer portal JWT whose payload has
`purpose: "customer_portal"`:

```http
Authorization: Bearer <portal-token>
```

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/portal/documents` | Authenticated portal account |
| `POST` | `/api/portal/documents` | Authenticated portal account |
| `GET` | `/api/portal/documents/:id/download` | Authenticated portal account |

`GET /api/portal/documents` supports `page`, `limit`, `search`, `caseId`,
`fileType`, and `source`. Every result must match the portal
account's `organizationId` and `customerId`, and case-linked documents are
included only when the case belongs to the same customer and organization.
Results must have `visibility=CUSTOMER_VISIBLE` and include safe metadata,
source/visibility labels, related case summary, upload label, and
`downloadAvailable`; they do not include `fileUrl`, raw paths, staff email, or
internal-only documents.

`POST /api/portal/documents` accepts `multipart/form-data` with required `file`
and optional `caseProfileId` and `fileType`. The customer and organization come
only from the portal session. Uploads are saved with
`source=CUSTOMER_PORTAL`, `visibility=CUSTOMER_VISIBLE`, and
`uploadedByPortalAccountId`, then audited with
`CUSTOMER_PORTAL_DOCUMENT_UPLOADED`.

`GET /api/portal/documents/:id/download` queries the database with the portal
scope and visibility predicates before resolving the local file. Unauthorized,
cross-customer, cross-workspace, hidden, or missing files return a generic
`404`; the response streams the file without exposing the storage path.

#### Document storage and security

`DOCUMENT_STORAGE_PROVIDER=local` is the default. Local objects are stored under
`UPLOAD_DIR`, which keeps development and portfolio demos working without cloud
credentials. `DOCUMENT_STORAGE_PROVIDER=s3` enables private S3-compatible object
storage using `DOCUMENT_STORAGE_BUCKET`, `DOCUMENT_STORAGE_REGION`, optional
`DOCUMENT_STORAGE_ENDPOINT`, and access keys supplied only through environment
variables. Buckets must remain private; the API does not create public document
links.

All new object keys are server-generated in the form
`documents/{organizationId}/{documentId}/{uuid}-{safeFilename}`. Legacy
`fileUrl` remains in the database for backward compatibility, but admin and
portal JSON responses do not expose raw storage keys, bucket names, object
paths, or local filesystem paths.

The upload pipeline checks extension, declared MIME type, size, and basic magic
bytes for supported PDFs, images, Word, and Excel files. It rejects executable
and script formats, stores the object through the configured provider, records a
SHA-256 checksum, and persists scan/OCR metadata.

`DOCUMENT_MALWARE_SCANNER` supports `disabled`, `mock`, and `clamav`. Disabled
mode records `SKIPPED` and is allowed by default for local/demo compatibility.
Mock mode marks files clean unless their names include test markers such as
`infected` or `scan-failed`. The ClamAV provider is a fail-safe interface unless
external ClamAV infrastructure is configured. Portal and internal downloads are
blocked for `INFECTED` and, by default, `FAILED` scan results.

`DOCUMENT_OCR_PROVIDER` supports `disabled`, `mock`, and `tesseract`. OCR is
optional and does not block upload success. The current build includes disabled
and mock behavior; real OCR requires infrastructure configuration. Admin
responses include OCR status and preview text when available; portal responses
include safe status/preview only and never expose full storage metadata.

Internal and portal downloads remain protected API routes. The backend checks
auth, tenant/customer/case scope, visibility, scan policy, and object existence
before streaming the object. Each successful stream writes a
`DocumentDownloadAudit` row and updates `downloadCount` plus
`lastDownloadedAt`.

### Activity Center

Step 30 adds `/api/activity` for the internal Admin/Manager Activity Center.
The route uses internal JWT auth and `ADMIN`/`MANAGER` authorization; `STAFF`
users are blocked from this audit surface. Clients cannot pass an
`organizationId`; every source query is scoped to `request.user.organizationId`.

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/activity` | `ADMIN`, `MANAGER` |
| `GET` | `/api/activity/summary` | `ADMIN`, `MANAGER` |

`GET /api/activity` supports `page`, `limit` up to 100, `action`,
`entityType`, `actorUserId`, `search`, `fromDate`, `toDate`, and `sort`
(`newest` or `oldest`). It normalizes safe activity items from `ActivityLog`,
`CaseHistory`, `Appointment`, `Task`, `Document`, and `DocumentDownloadAudit`.
Responses include safe actor summary, action, entity type/id, description, and
timestamp. Descriptions are sanitized to avoid returning tokens, passwords,
secrets, storage keys, signed URLs, raw upload paths, or local file paths.

`GET /api/activity/summary` returns today's total, case/document/portal event
counts, and the latest five normalized activity items. The Activity Center is
read-only. Step 36 adds consultation automation activity actions such as
`CONSULTATION_REQUEST_CREATED`, `CONSULTATION_FOLLOW_UP_TASK_CREATED`,
`CONSULTATION_AUTOMATION_EMAIL_SENT`,
`CONSULTATION_AUTOMATION_EMAIL_SKIPPED`, and
`CONSULTATION_AUTOMATION_EMAIL_FAILED`. Realtime websocket, push
notifications, notification preferences, and a background job queue remain out
of scope.

### Dashboard and reporting

All dashboard routes require an access token:

```http
Authorization: Bearer <token>
```

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/api/dashboard/overview` | `ADMIN`, `MANAGER`, scoped `STAFF` |
| `GET` | `/api/dashboard/cases-by-status` | `ADMIN`, `MANAGER`, scoped `STAFF` |
| `GET` | `/api/dashboard/cases-by-month` | `ADMIN`, `MANAGER`, scoped `STAFF` |
| `GET` | `/api/dashboard/upcoming-deadlines` | `ADMIN`, `MANAGER`, scoped `STAFF` |
| `GET` | `/api/dashboard/staff-performance` | `ADMIN`, `MANAGER` |
| `GET` | `/api/dashboard/recent-activities` | `ADMIN`, `MANAGER`, scoped `STAFF` |

Administrators and managers receive dashboard data for their workspace. Staff receive only
metrics and records related to their assigned cases and appointments, tasks
they created or that are assigned to them, and documents they uploaded or that
belong to an assigned case. Staff cannot access the staff-performance report.
Dashboard responses use sanitized user projections and never include
`passwordHash`.

The overview reports customer, case, overdue-case, today's-appointment, task,
overdue-task, document, and new-consultation-request totals. Cases by status
includes every case status, including statuses whose count is zero. Staff
results for both endpoints are restricted to their own operational scope.

`cases-by-month` accepts optional ISO calendar-date `fromDate` and `toDate`
query parameters and reports created and completed cases by month. When no
range is supplied, it defaults to the most recent six months. Date ranges are
inclusive and `fromDate` must not be after `toDate`.

`upcoming-deadlines` combines open case and task deadlines with non-cancelled
appointment dates, sorts them chronologically, and accepts `days` from 1 to 30
(default 7) and `limit` up to 50 (default 10).

`staff-performance` accepts optional `fromDate`, `toDate`, and `limit` query
parameters and defaults to the most recent 30 days when no date range is
provided. It reports assigned and completed cases, completed tasks, and
completed appointments for active CRM users, ordered by completion metrics.
This endpoint is restricted to administrators and managers.

`recent-activities` accepts `limit` up to 50 (default 10). The dashboard helper
remains scoped by role and case assignment. Step 30's broader Admin/Manager
Activity Center is available separately through `/api/activity` and the
`/admin/activity` frontend page.

## Prisma commands

```powershell
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:reset
npm run prisma:studio
npm run seed
npm run seed:demo
npm run seed:second-workspace
npm run db:verify
npm run verify:tenant-isolation
npm run smoke:production
```

- `prisma:generate` generates the type-safe Prisma Client.
- `prisma:migrate` creates and applies a development migration. Review generated SQL before applying it to shared environments.
- `prisma:deploy` applies committed migrations to staging or production
  without creating a new migration.
- `prisma:reset` destroys and recreates the configured database, then reapplies
  committed migrations. Use it only for disposable development databases and
  run `npm run seed` afterward.
- `prisma:studio` opens the local data browser.
- `seed` upserts the legacy local demo administrator and four initial
  consulting services.
- `seed:demo` upserts fictional portfolio staging data and safer demo
  admin/manager/staff accounts. In `NODE_ENV=production`, run it with
  `DEMO_SEED_ENABLED=true`.
- `seed:second-workspace` upserts the fictional Northstar QA workspace for
  tenant-isolation checks. In `NODE_ENV=production`, run it with
  `SECOND_WORKSPACE_SEED_ENABLED=true`.
- `db:verify` checks connectivity, the seeded administrator, and the four
  expected service slugs.
- `verify:tenant-isolation` is a read-only QA script for the Advisora and
  Northstar demo workspaces. It checks users, customers, cases, requests,
  appointments, tasks, case history, activity logs, documents, document
  downloads, portal accounts, and cross-tenant relation leaks.
- `smoke:production` is a read-only HTTP smoke script for a deployed API. It
  requires `SMOKE_API_BASE_URL`, `SMOKE_ADMIN_EMAIL`,
  `SMOKE_ADMIN_PASSWORD`, `SMOKE_PORTAL_WORKSPACE_SLUG`,
  `SMOKE_PORTAL_EMAIL`, and `SMOKE_PORTAL_PASSWORD`. Set
  `SMOKE_RATE_LIMIT_CHECK=true` only when intentionally stress-checking invalid
  login attempts until `429`.

Step 33 confirmed that build/lint/Prisma checks, tenant-isolation verification,
i18n key checks, and localhost smoke-script readiness pass, including
`SMOKE_RATE_LIMIT_CHECK=true`. A live production smoke run still requires
deployed `SMOKE_*` values supplied outside the repository.

A running PostgreSQL database is required for migrations and seeding. Generating the client only requires a syntactically valid `DATABASE_URL`.

After the database check passes, use the
[real-database API checklist](docs/api-smoke-test.md) or its
[compact PowerShell curl version](docs/curl-smoke-test.md) to verify login,
core workflows, upload/download, and dashboard data.

## Local demo account

After running `npm run seed`:

```text
Email: admin@advisora.demo
Password: password123
Role: ADMIN
```

This account is only for local development. The seed hashes the password with bcryptjs before storage; no plaintext password is written to the database.

Use the demo email and password with `POST /api/auth/login`, then copy the returned `accessToken` into the Bearer header for `/api/auth/me` and `/api/users`.

> Security warning: never enable this known credential in staging or production. Replace bootstrap credentials with secrets supplied through a secure account-provisioning process, rotate exposed credentials, and keep password hashes and customer identity data out of API responses and logs.

JWT secrets must be unique, randomly generated, and supplied through environment configuration. Never commit secrets, passwords, or access tokens; never log login bodies or Bearer tokens. Inactive users are denied access, login failures use a generic response, and authorization is enforced on the backend.

## Portfolio staging demo seed

After migrations are applied to a dedicated staging database:

```bash
DEMO_SEED_ENABLED=true npm run seed:demo
```

For local PowerShell:

```powershell
$env:DEMO_SEED_ENABLED = "true"
npm run seed:demo
```

The demo seed is idempotent. It upserts the `Advisora Demo Workspace` and
fictional demo users, customers, consultation requests, cases, appointments,
tasks, case history, and activity logs assigned to that workspace. It does not
reset the database, does not delete non-demo data, and does not seed physical
document files.

Intentional portfolio demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin.demo@advisora.test` | `Advisora-Demo-Admin-2026!` |
| Manager | `manager.demo@advisora.test` | `Advisora-Demo-Manager-2026!` |
| Staff | `staff.demo@advisora.test` | `Advisora-Demo-Staff-2026!` |

The demo seed disables `admin@advisora.demo` when it exists so staging does not
depend on the known `password123` credential. Because `npm run db:verify`
checks the legacy local account, use it for local verification only and do not
treat it as staging sign-off after running `seed:demo`.

### Second workspace tenant-isolation seed

Step 22.5 adds a manual second workspace seed for QA:

```text
Name: Northstar Legal Workspace
Slug: northstar-legal
```

It creates fictional demo users, customers, consultation requests, cases,
appointments, tasks, case history, activity logs, document metadata, download
audit metadata, and portal accounts under `northstar-legal`. It does not
create physical document files, reset the database, delete existing data, or add
public workspace signup or invitations.

Run it after migrations and the main demo seed:

```bash
SECOND_WORKSPACE_SEED_ENABLED=true npm run seed:second-workspace
npm run verify:tenant-isolation
```

For local PowerShell:

```powershell
$env:SECOND_WORKSPACE_SEED_ENABLED = "true"
npm run seed:second-workspace
Remove-Item Env:SECOND_WORKSPACE_SEED_ENABLED
npm run verify:tenant-isolation
```

When `NODE_ENV=production`, `seed:second-workspace` refuses to run unless
`SECOND_WORKSPACE_SEED_ENABLED=true` is set for that command. Keep this flag
out of permanent runtime configuration. The verification script checks that
`advisora-demo` and `northstar-legal` have separate users, customers, cases,
requests, appointments, tasks, case history, activity logs, documents, document
download audits, and portal accounts, and that Northstar demo records are not
assigned to Advisora.

## Implementation status

Phase 17 records production readiness and final QA preparation. Phase 10.5
records a successful live Neon PostgreSQL verification. The
committed migration deployed successfully, the idempotent seed completed, and
`db:verify` confirmed one seeded administrator and all four required active
services. The health endpoint and administrator login also passed, with a
sanitized user response that did not expose `passwordHash`. The full sanitized
result is available in the
[live database verification record](docs/live-database-verification.md).

The backend includes customer and service management, consultation-request
triage, protected case-profile workflows, appointment scheduling, internal
task management, authenticated document management, workspace invitations, and
role-aware dashboard and reporting APIs. Step 22 adds the Organization /
Workspace tenant foundation using a single default `Advisora Demo Workspace`;
billing remains future work. Step 22.5
adds a `Northstar Legal Workspace` seed plus `verify:tenant-isolation` for
staging tenant QA. Step 23 adds guarded public workspace signup/onboarding for
creating a new internal CRM workspace and first owner admin. Step 24 adds
admin-only workspace invitations with hashed one-time tokens and public accept
auto-login. Step 25 adds invitation email delivery with console and Resend
providers, `sendEmail` control, delivery result reporting, and resend token
rotation. Step 26 adds current-workspace profile reads and administrator-only
workspace settings updates with slug uniqueness checks and `WORKSPACE_UPDATED`
activity logs. Step 27 adds separate customer portal accounts, portal-purpose
JWTs, portal login/session/profile endpoints, and admin/manager portal access
controls for existing customers. Step 28 adds portal case tracking, Step 28.5
adds bilingual UI support, and Step 29 adds customer portal document listing,
upload, protected download, and admin-controlled customer visibility. Step 29.5
adds local/S3-compatible storage providers, malware/OCR abstractions,
scan-based download blocking, protected streaming downloads, and download audit
logging. Step 30 adds an Admin/Manager Activity Center and customer-safe Portal
Updates built from existing audit, case, appointment, document, download, and
portal account data without exposing internal notes or storage/secret fields.
Step 31 adds security headers, request body limits, configurable in-memory rate
limits, redacted logging/error output, internal token purpose signing, expanded
user/document audit events, tenant-isolation verification for documents and
portal accounts, and the read-only production smoke script. The repository also
includes production readiness, deployment, final QA, security hardening, and
RBAC matrix documentation. It does not include request-to-customer conversion,
configured live scanner/OCR infrastructure, report exports, realtime/push
notifications, distributed rate limiting, or real production deployment.

## Future phases

- Refresh tokens, token revocation, password recovery, and account management
- Customer self-service profile updates
- Consultation-request conversion
- Live OCR/scanner infrastructure and production object-storage operations
- Realtime notifications, notification preferences, and activity retention
  policies
- Public news and project content APIs
- Distributed rate limiting, captcha/abuse protection, private file storage
  operations, and production observability
- Custom database checks for document ownership and other cross-field rules documented in `../docs/database-design.md`

Customer, service, consultation-request, case-profile workflow, appointment,
task, document-management, dashboard, and reporting APIs are available.
Content-management and other domain workflows remain future work.
