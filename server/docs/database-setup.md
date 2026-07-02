# PostgreSQL setup, migration, and seed verification

This guide supports a local PostgreSQL database and a managed PostgreSQL
database such as Supabase or Neon. Run all application commands from the
`server` directory.

Do not commit `.env`, database credentials, access tokens, or files under
`uploads`.

## Prerequisites

- Node.js 20 or later and npm
- A supported PostgreSQL instance, either local or managed
- A database user allowed to create tables and indexes

## Option A: local PostgreSQL

Install PostgreSQL using the installer for your operating system, keep the
database service running, and make sure `psql` is available. Create the
development database from `psql`:

```sql
CREATE DATABASE consulting_crm_system;
```

For example:

```powershell
psql -U postgres
# Run CREATE DATABASE consulting_crm_system; at the psql prompt, then \q.
```

From the `server` directory, create the untracked environment file:

```powershell
Copy-Item .env.example .env
```

Set `DATABASE_URL` in `.env`. This local-only example assumes the development
user and password are both `postgres`:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/consulting_crm_system?schema=public"
```

Use your own local password if it differs. Do not use this example credential
in a shared or production environment.

## Option B: Supabase or Neon

1. Create a project and PostgreSQL database in the provider console.
2. Copy the provider's PostgreSQL connection string.
3. Copy `.env.example` to `.env` with `Copy-Item .env.example .env`.
4. Set `DATABASE_URL` to that connection string.
5. Preserve the provider's SSL parameters. If its instructions require SSL,
   the URL normally includes `sslmode=require`.

A redacted shape is:

```dotenv
DATABASE_URL="postgresql://DB_USER:URL_ENCODED_PASSWORD@DB_HOST:5432/DB_NAME?schema=public&sslmode=require"
```

Never paste a real connection string into documentation, source code, terminal
output shared publicly, or Git. URL-encode reserved characters in passwords.
For schema migrations, use the provider's direct/non-transaction-pooled
connection URL when its documentation distinguishes migration and runtime
connections. A transaction-pooler URL may not support every Prisma migration
operation. `prisma migrate dev` can also require shadow-database privileges.
Use `prisma migrate deploy` when applying the repository's already committed
migrations to a shared or managed database.

## Install and validate

```powershell
npm install
npm run prisma:generate
npx prisma validate
```

Client generation and schema validation do not prove that PostgreSQL is
reachable. The remaining commands require a live database connection.

## Apply migrations

For a development database:

```powershell
npm run prisma:migrate
```

If a new schema change needs a named development migration:

```powershell
npm run prisma:migrate -- --name descriptive_change_name
```

Review generated SQL before committing or applying it to shared environments.
Do not use `prisma db push` as a replacement for versioned migrations.

For a shared, managed, staging, or production database, apply already
committed migrations without creating a new migration:

```powershell
npm run prisma:deploy
```

Check migration state:

```powershell
npx prisma migrate status
```

## Seed and verify

```powershell
npm run seed
npm run db:verify
```

The idempotent seed upserts:

- `admin@advisora.demo` with the local-development password `password123`
- Four active consulting services

The password is hashed with bcryptjs before it is stored. The known demo
credential must never be enabled in staging or production.

`db:verify` checks database connectivity, the demo administrator, and the four
seeded service slugs. It does not print `DATABASE_URL` or the password.

After verification, start the API:

```powershell
npm run dev
```

Then follow [api-smoke-test.md](./api-smoke-test.md) to verify authentication,
core workflows, local upload/download, and dashboard queries against the same
database.

## Troubleshooting

- Connection refused: verify the PostgreSQL service, host, port, firewall, and
  provider network policy.
- Authentication failed: verify the database user/password and URL-encoding.
- SSL error: use the SSL parameters required by the provider.
- Migration permission error: use a database role allowed to create and alter
  tables, indexes, and enum types.
- `db:verify` reports missing seed data: run `npm run seed`, then retry.
- Port `5000` is occupied: stop the other process or change `PORT` in `.env`.

## Verification record

The repository contains the setup, migration, seed, and verification workflow.
A successful live PostgreSQL migration/seed run has not been recorded from the
current development environment. The operator must run the live-database
commands above and complete the API checklist before claiming that a specific
database instance has been verified.
