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
```

`CLIENT_URL` can be a single origin such as `http://localhost:5173` or a
comma-separated allowlist such as
`http://localhost:5173,<frontend-origin>`. Each value must be an origin only:
no paths, queries, hashes, trailing slashes, or wildcard origins. Do not leave
trailing commas.

Do not commit `.env` or use the example database credentials in a shared or production environment.

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

A successful response contains `data.accessToken` and a sanitized `data.user`. Use the access token as a Bearer token for protected requests.

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

### Assignable users

```http
GET /api/users/assignable
Authorization: Bearer <token>
```

This endpoint is available to active `ADMIN` and `MANAGER` users for case
assignment. It returns only active CRM users with the `ADMIN`, `MANAGER`, or
`STAFF` role and exposes only safe profile fields; it never includes
`passwordHash`.

### Admin-only users

```http
GET /api/users
Authorization: Bearer <token>
```

```http
GET /api/users/<user-uuid>
Authorization: Bearer <token>
```

Both endpoints require an active authenticated user with the `ADMIN` role. They are read-only in this phase and never include `passwordHash`. Missing or invalid authentication returns `401`, insufficient permissions returns `403`, and a missing user record returns `404`.

## Core CRM APIs

Public routes do not require an access token. Protected routes require:

```http
Authorization: Bearer <token>
```

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

`serviceId` is optional, but it must identify an active service when supplied. The internal list supports `search`, `status`, `serviceId`, `page`, and `limit`. Status updates accept `NEW`, `CONTACTED`, or `CLOSED`; `CONVERTED` is reserved for the future transactional conversion workflow.

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

Administrators and managers receive global dashboard data. Staff receive only
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

The demo seed is idempotent. It upserts fictional demo users, customers,
consultation requests, cases, appointments, tasks, case history, and activity
logs. It does not reset the database, does not delete non-demo data, and does
not seed physical document files.

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
task management, authenticated document management, and role-aware dashboard
and reporting APIs. The repository also includes production readiness,
deployment, and final QA documentation. It does not include
request-to-customer conversion, OCR, cloud object storage, report exports,
realtime updates, or real production deployment.

## Future phases

- Refresh tokens, token revocation, password recovery, and account management
- Consultation-request conversion
- Cloud object storage, signed file delivery, malware scanning, and OCR
- Extended activity auditing and case-history retention policies
- Public news and project content APIs
- Rate limiting, abuse protection, private file storage, and production observability
- Custom database checks for document ownership and other cross-field rules documented in `../docs/database-design.md`

Customer, service, consultation-request, case-profile workflow, appointment,
task, document-management, dashboard, and reporting APIs are available.
Content-management and other domain workflows remain future work.
