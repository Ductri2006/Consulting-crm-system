# Consulting CRM API

Backend foundation for the Consulting CRM System. It provides a secure, typed Express application, environment validation, a standard API response format, centralized error handling, a health endpoint, and the initial Prisma data model. Authentication and domain CRUD APIs are intentionally reserved for later phases.

## Tech stack

- Node.js 20 or later
- Express 5 and TypeScript
- PostgreSQL and Prisma ORM 6
- Zod environment validation
- Helmet, CORS, and Morgan
- bcryptjs for password hashing

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

Example:

```dotenv
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/consulting_crm_system?schema=public"
CLIENT_URL="http://localhost:5173"
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

> Security warning: never enable this known credential in staging or production. Replace bootstrap credentials with secrets supplied through a secure account-provisioning process, rotate exposed credentials, and keep password hashes and customer identity data out of API responses and logs.

## Future phases

- Authentication, session or token management, and role-based authorization
- Consultation-request conversion workflows
- Customer, case, appointment, task, and document APIs
- Case-history transactions and activity auditing
- Public news and project content APIs
- Rate limiting, abuse protection, private file storage, and production observability
- Custom database checks for document ownership and other cross-field rules documented in `docs/database-design.md`

This foundation does not yet expose full CRUD, authentication, customer, case, or task APIs.
