# Consulting CRM API

Backend API for the Consulting CRM System. It provides a secure, typed Express application, environment validation, a standard API response format, centralized error handling, a health endpoint, the initial Prisma data model, JWT-based authentication and role authorization, and the first core CRM APIs.

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

Phase 5 includes customer and service management, public active-service discovery, public consultation submission, and protected consultation-request triage. It does not include request-to-customer conversion, case workflows, appointments, tasks, documents, or file uploads.

## Future phases

- Refresh tokens, token revocation, password recovery, and account management
- Consultation-request conversion and case-profile workflows
- Appointment, task, and document APIs
- Case-history transactions and activity auditing
- Public news and project content APIs
- Rate limiting, abuse protection, private file storage, and production observability
- Custom database checks for document ownership and other cross-field rules documented in `docs/database-design.md`

Customer, service, and consultation-request APIs are available. Case, appointment, task, document, and other domain workflows remain future work.
