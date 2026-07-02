# Live Database Verification

## Result

| Item | Result |
| --- | --- |
| Verification status | **PASS** |
| PostgreSQL provider | Neon |
| Database configuration | `DATABASE_URL` is configured in local `server/.env` and is not committed |

The real connection string, database credentials, access token, and other
secrets are intentionally omitted from this record.

## Migration, seed, and data verification

The following commands completed successfully against the live PostgreSQL
database:

```text
npm run prisma:deploy
npm run seed
npm run db:verify
```

The database verification reported:

```text
Users found: 1
Services found: 4
Seeded administrator: OK
Required active services: OK (4/4)
Database verification completed successfully.
```

## API verification

### Health check

`GET /api/health` passed with:

- `success: true`
- `data.status: "ok"`

### Administrator login

`POST /api/auth/login` passed with:

- `success: true`
- `message: "Login successful"`
- An access token was present in the response
- The returned user had the `ADMIN` role
- The returned user did not contain `passwordHash`

The access token and login credentials are not included in this document.

## Secret and artifact handling

- `server/.env` was kept local and was not committed.
- The real `DATABASE_URL` was not committed or copied into documentation.
- The access token was not committed or copied into documentation.
- No uploaded files were committed.
