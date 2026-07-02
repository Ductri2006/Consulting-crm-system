# Consulting CRM API

Backend API for the Consulting CRM System. It provides a secure, typed Express application, environment validation, a standard API response format, centralized error handling, a health endpoint, the Prisma data model, JWT-based authentication and role authorization, and the core CRM, appointment, and task APIs.

## Tech stack

- Node.js 20 or later
- Express 5 and TypeScript
- PostgreSQL and Prisma ORM 6
- Zod environment validation
- Helmet, CORS, and Morgan
- bcryptjs for password hashing
- JSON Web Tokens for stateless Bearer authentication

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
| `CLIENT_URL` | Yes | Allowed frontend origin for CORS |
| `JWT_SECRET` | Yes | Secret used to sign access tokens; use at least 32 characters |
| `JWT_EXPIRES_IN` | Yes | Access-token lifetime, for example `7d` |

Example:

```dotenv
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/consulting_crm_system?schema=public"
CLIENT_URL="http://localhost:5173"
JWT_SECRET="replace-this-with-a-secure-secret-of-at-least-32-characters"
JWT_EXPIRES_IN="7d"
```

Do not commit `.env` or use the example database credentials in a shared or production environment.

## Run locally

From the `server` directory:

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run dev
```

In Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp` if no `cp` alias is available.

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

## Prisma commands

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
npm run seed
```

- `prisma:generate` generates the type-safe Prisma Client.
- `prisma:migrate` creates and applies a development migration. Review generated SQL before applying it to shared environments.
- `prisma:studio` opens the local data browser.
- `seed` upserts the local demo administrator and four initial consulting services.

A running PostgreSQL database is required for migrations and seeding. Generating the client only requires a syntactically valid `DATABASE_URL`.

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

## Implementation status

Phase 7 includes customer and service management, consultation-request triage,
protected case-profile workflows, appointment scheduling, and internal task
management with role-aware lists, assignments, status transitions, and
deadline queries. It does not include request-to-customer conversion, document
management, or file uploads.

## Future phases

- Refresh tokens, token revocation, password recovery, and account management
- Consultation-request conversion
- Document APIs and private file uploads
- Extended activity auditing and case-history retention policies
- Public news and project content APIs
- Rate limiting, abuse protection, private file storage, and production observability
- Custom database checks for document ownership and other cross-field rules documented in `docs/database-design.md`

Customer, service, consultation-request, case-profile workflow, appointment,
and task APIs are available. Document and other domain workflows remain future
work.
