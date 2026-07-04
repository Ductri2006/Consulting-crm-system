# Consulting CRM API

Backend API for the Consulting CRM System. It provides a secure, typed Express application, environment validation, a standard API response format, centralized error handling, a health endpoint, the Prisma data model, JWT-based authentication and role authorization, and the core CRM, scheduling, document, dashboard, and reporting APIs.

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
| `DEFAULT_ORGANIZATION_SLUG` | No | Workspace slug used by public consultation requests, defaults to `advisora-demo` |
| `WORKSPACE_SIGNUP_ENABLED` | No | Enables public `POST /api/workspaces/signup` only when set to `true`; defaults to `false` |
| `APP_NAME` | No | Name used in invitation email templates; defaults to `Advisora CRM` |
| `EMAIL_PROVIDER` | No | Invitation email provider: `disabled`, `console`, or `resend`; defaults to `console` |
| `EMAIL_FROM` | No | Sender identity for invitation emails |
| `EMAIL_REPLY_TO` | No | Optional reply-to address for invitation emails |
| `RESEND_API_KEY` | No | Resend API key, required only when `EMAIL_PROVIDER=resend`; never commit it |

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
DEFAULT_ORGANIZATION_SLUG="advisora-demo"
WORKSPACE_SIGNUP_ENABLED=false
APP_NAME="Advisora CRM"
EMAIL_PROVIDER=console
EMAIL_FROM="Advisora CRM <no-reply@advisora.test>"
EMAIL_REPLY_TO=
RESEND_API_KEY=
```

`CLIENT_URL` can be a single origin such as `http://localhost:5173` or a
comma-separated allowlist such as
`http://localhost:5173,<frontend-origin>`. Each value must be an origin only:
no paths, queries, hashes, trailing slashes, or wildcard origins. Do not leave
trailing commas.

Do not commit `.env`, real email provider API keys, or verified sender
credentials in a shared or production environment.

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

Public form submissions are validated but should additionally receive production rate limiting and abuse protection before deployment. Protected CRM routes enforce authorization on the server; hiding controls in a client is not a security boundary.

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

Administrators and managers can list, view, upload, and delete documents across
the CRM. Staff can view documents they uploaded or documents attached to cases
assigned to them. Staff can upload to an assigned case or create a
customer-only document as its uploader. Staff can delete only their own
documents, and cannot delete one attached to another staff member's case.

The document list supports `search`, `fileType`, `customerId`,
`caseProfileId`, `uploadedById`, `page`, and `limit`. Staff queries remain
scoped to documents they are authorized to access. Responses include basic
customer and case-profile data and sanitized uploader data; they never include
`passwordHash` or an absolute filesystem path. The protected download endpoint
applies the same access rules and returns `404` when the metadata or physical
file is missing.

#### Local file storage and security

Development uploads are stored under `server/uploads` by default. The upload
directory and maximum file size are configured with `UPLOAD_DIR` and
`MAX_FILE_SIZE_MB`. Relative `UPLOAD_DIR` values are resolved from the server
process working directory. Uploaded files are ignored by Git and must not be
committed.

The upload pipeline checks both the extension and declared MIME type, rejects
executable and script formats, generates a randomized physical filename, and
does not log file contents or expose local absolute paths. If metadata
validation or database persistence fails, the already-written local file is
removed.

Local disk is intended for development only. Production deployments should use
private persistent object storage, together with authenticated or short-lived
signed access. Local upload folders are not safe for ephemeral or multi-instance
hosting. OCR and cloud storage integration are outside this phase.

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

`recent-activities` accepts `limit` up to 50 (default 10). Recent activity is
currently based on case-history records because general activity logging is
not yet populated consistently. Administrators and managers receive all case
history; staff receive history only for cases assigned to them. Each item
contains safe actor and basic case-profile information.

## Prisma commands

```powershell
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:reset
npm run prisma:studio
npm run seed
npm run seed:demo
npm run db:verify
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
- `db:verify` checks connectivity, the seeded administrator, and the four
  expected service slugs.

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
appointments, tasks, case history, and activity logs under `northstar-legal`.
It does not create physical document files, reset the database, delete existing
data, or add public workspace signup or invitations.

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
requests, appointments, tasks, case history, and activity logs, and that
Northstar demo records are not assigned to Advisora.

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
controls for existing customers. The repository also includes production readiness,
deployment, and final QA documentation. It does not include
request-to-customer conversion, portal case tracking, customer document upload,
OCR, cloud object storage, report exports, realtime updates, or real
production deployment.

## Future phases

- Refresh tokens, token revocation, password recovery, and account management
- Portal case tracking, customer document upload, and customer self-service profile updates
- Consultation-request conversion
- Cloud object storage, signed file delivery, malware scanning, and OCR
- Extended activity auditing and case-history retention policies
- Public news and project content APIs
- Rate limiting, abuse protection, private file storage, and production observability
- Custom database checks for document ownership and other cross-field rules documented in `../docs/database-design.md`

Customer, service, consultation-request, case-profile workflow, appointment,
task, document-management, dashboard, and reporting APIs are available.
Content-management and other domain workflows remain future work.
