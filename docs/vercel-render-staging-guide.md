# Vercel + Render + Neon Staging Guide

This guide prepares a real staging deployment path for the Consulting CRM
System using:

- Frontend: Vercel.
- Backend: Render Web Service.
- Database: Neon PostgreSQL.

It is an operator runbook, not a record of a completed deployment. Do not paste
real `DATABASE_URL`, `JWT_SECRET`, provider tokens, access tokens, private
keys, passwords, screenshots containing secrets, or upload files into this
repository.

Use this guide for provider setup. Use
[Staging Deployment Checklist](staging-deployment-checklist.md) to record each
staging run and go/no-go decision, and use
[Deployment Guide](deployment-guide.md) as the provider-neutral reference.

## Staging Targets

Use placeholders until the provider URLs exist:

```text
Vercel frontend origin: https://<project-name>.vercel.app
Render backend origin: https://<render-service-name>.onrender.com
Render backend API base URL: https://<render-service-name>.onrender.com/api
Render health check: https://<render-service-name>.onrender.com/api/health
Neon database: <staging-neon-project-or-branch-label>
```

Record the real values only in the private provider dashboards or in a
sanitized staging run record. Never commit provider credentials or connection
strings.

## Preflight

- [ ] GitHub repository is pushed and current.
- [ ] Local working tree is clean.
- [ ] No `.env`, token, secret, database URL, provider credential, upload file,
  downloaded file, `dist`, or `server/dist` file is staged.
- [ ] Staging Neon database or branch is dedicated to staging.
- [ ] Staging admin account plan is defined.
- [ ] Known local demo credential is disabled, replaced, or limited to a
  private short-lived staging window.
- [ ] Browser-readable Bearer token storage, missing rate limiting, and local
  upload storage are accepted risks for portfolio staging only.
- [ ] Public internet staging is no-go until the known demo admin, auth-route
  rate limiting, and local-disk upload limitations are either fixed or
  explicitly accepted for a private portfolio review window.

Local verification before provider setup:

```bash
cd server
npm run prisma:generate
npx prisma validate
npm run build
npm run lint

cd ../client
npm run build
npm run lint
```

## Render Backend

Backend deployment target:

| Setting | Value |
| --- | --- |
| Provider | Render |
| Service type | Web Service |
| Root directory | `server` |
| Runtime | Node |
| Install command | `npm install` |
| Build command | `npm run prisma:generate && npm run build` |
| Pre-deploy command | `npm run prisma:deploy` |
| Start command | `npm run start` |
| Health check path | `/api/health` |

Render UI note:

- If the Render service form only gives you a single Build Command field, use
  `npm install && npm run prisma:generate && npm run build`.
- If it has a separate Install Command field, use `npm install` there and keep
  Build Command as `npm run prisma:generate && npm run build`.
- Render's Pre-deploy Command is the preferred place for Prisma migrations. If
  your Render plan does not support Pre-deploy Command, use
  `npm run prisma:deploy && npm run start` as a temporary staging start-command
  fallback and record that migrations run on every service start.

Render environment variables:

| Variable | Staging value | Notes |
| --- | --- | --- |
| `NODE_ENV` | `production` | Required for production-mode behavior. |
| `DATABASE_URL` | `<staging-neon-postgres-url>` | Store only in Render. Never commit. |
| `CLIENT_URL` | `<vercel-frontend-origin>` | Exact origin only, no path. |
| `JWT_SECRET` | `<strong-staging-secret-at-least-32-characters>` | Unique for staging. Do not reuse local or production secrets. |
| `JWT_EXPIRES_IN` | `7d` | Adjust only after review. |
| `UPLOAD_DIR` | `uploads` | Local disk only; smoke-test files only. |
| `MAX_FILE_SIZE_MB` | `10` | Must match expected upload limit. |

`PORT` note:

- Render expects a web service to bind to the port from `process.env.PORT`.
- This backend already reads `PORT` from environment configuration.
- Render defaults web services to port `10000` when no `PORT` is supplied.
- Do not force `PORT=5000` on Render unless you intentionally configure the
  service to use that port.

Render deployment steps:

1. Open Render Dashboard.
2. Create a new Web Service.
3. Connect the GitHub repository.
4. Select the branch to deploy from, normally `main`.
5. Set Root Directory to `server`.
6. Set Runtime to Node.
7. Set the install/build/pre-deploy/start commands above.
8. Add the Render environment variables.
9. Create the service and watch the deploy logs.
10. Open `https://<render-service-name>.onrender.com/api/health`.

Do not paste a real Render service URL into source code. Use placeholders in
docs and environment variables in providers.

## Vercel Frontend

Frontend deployment target:

| Setting | Value |
| --- | --- |
| Provider | Vercel |
| Framework preset | Vite |
| Root directory | `client` |
| Install command | `npm install` |
| Build command | `npm run build` |
| Output directory | `dist` |

Vercel environment variable:

| Variable | Staging value | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `https://<render-service-name>.onrender.com/api` | Must include `/api`. Must not point to localhost. |

Vercel deployment steps:

1. Open Vercel Dashboard.
2. Import the GitHub repository.
3. Set Framework Preset to Vite.
4. Set Root Directory to `client`.
5. Confirm Install Command is `npm install`.
6. Confirm Build Command is `npm run build`.
7. Confirm Output Directory is `dist`.
8. Add `VITE_API_BASE_URL` with the Render backend API base URL including
   `/api`.
9. Deploy.
10. Open `https://<project-name>.vercel.app`.

After changing `VITE_API_BASE_URL`, redeploy the Vercel project. A successful
build can still call the wrong backend if the environment variable was missing
or stale during the build.

This repo includes `client/vercel.json` so Vercel serves `index.html` for
React Router deep links such as `/admin/dashboard` and `/admin/reports`.

## CORS Order

Use this order to avoid the classic Vercel/Render CORS loop:

1. Deploy the Render backend with a temporary `CLIENT_URL` if the Vercel URL is
   not known yet, or use the expected Vercel origin if known.
2. Deploy the Vercel frontend.
3. Copy the exact Vercel frontend origin.
4. Update Render `CLIENT_URL` to that exact origin.
5. Restart or redeploy the Render service.
6. Test frontend login and authenticated API calls from the Vercel URL.

Important examples:

```text
Correct CLIENT_URL:
https://<project-name>.vercel.app

Wrong CLIENT_URL:
https://<project-name>.vercel.app/admin/login
https://<project-name>.vercel.app/
*
```

If you intentionally allow preview deployments, use a comma-separated allowlist
and document why each origin is allowed.

## Neon Database

Use a dedicated staging Neon project, branch, or database. Staging must not
share the production database.

Neon guidance:

- Copy the staging connection string into Render `DATABASE_URL`.
- Keep the connection string only in Render and Neon dashboards.
- Prefer provider guidance for pooled vs direct URLs.
- This repo's current Prisma schema uses only `DATABASE_URL`. If migrations
  fail through a pooled URL, use a Neon direct connection string for the
  migration step or add a reviewed `DIRECT_URL` migration flow in a future
  change.
- Run committed migrations with `npm run prisma:deploy`.
- Do not run `npm run prisma:migrate` on staging.
- Do not run `npm run prisma:reset` on staging unless the database is
  explicitly disposable.
- Run `npm run seed:demo` only when intentional and only against the dedicated
  staging database.
- Do not run `npm run seed` on staging unless intentionally creating the legacy
  local admin and documenting that short-lived risk.
- If `NODE_ENV=production`, `seed:demo` requires `DEMO_SEED_ENABLED=true`.
- If using the known local demo admin, keep staging private and short-lived or
  replace it with staging-safe credentials.

Migration options:

| Option | When to use |
| --- | --- |
| Render start command `npm run prisma:deploy && npm run start` | Simple staging path; migrations run before each service start and are idempotent. |
| Render Shell `npm run prisma:deploy` | Use when you want to run migrations manually before restart. |
| Separate one-off job | Use later if staging needs stricter deploy control. |

## Demo Seed

After Render has the staging `DATABASE_URL` and migrations have been applied,
run the non-destructive portfolio demo seed from Render Shell or a one-off job:

```bash
cd server
DEMO_SEED_ENABLED=true npm run seed:demo
```

The seed upserts fictional demo users, customers, consultation requests, cases,
appointments, tasks, case history, and activity logs. It does not reset the
database and does not seed document files. Upload a tiny fictional PDF or image
manually during smoke testing if document evidence is needed.

Demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin.demo@advisora.test` | `Advisora-Demo-Admin-2026!` |
| Manager | `manager.demo@advisora.test` | `Advisora-Demo-Manager-2026!` |
| Staff | `staff.demo@advisora.test` | `Advisora-Demo-Staff-2026!` |

These are intentional portfolio credentials. Prefer manager or staff access
for public review and share admin access privately only. Do not use these
accounts with real customer data.

If screenshots, recordings, logs, or browser history expose a token or demo
credential, rotate Render `JWT_SECRET`, redeploy the backend, and ask reviewers
to log in again. Old tokens should receive `401` after rotation.

## Staging Smoke Test

Backend:

- [ ] `GET https://<render-service-name>.onrender.com/api/health`.
- [ ] Invalid admin login returns a generic failure.
- [ ] Admin login succeeds with a staging-safe account.
- [ ] `GET /api/auth/me` returns a sanitized user.
- [ ] `GET /api/dashboard/overview` returns data.
- [ ] At least one database-backed endpoint succeeds, such as
  `GET /api/public/services` or `GET /api/customers`.

Frontend:

- [ ] Open `https://<project-name>.vercel.app`.
- [ ] Public home page loads.
- [ ] Public services page loads.
- [ ] Public consultation form submits to the Render backend.
- [ ] Admin login page loads.
- [ ] Admin login succeeds.
- [ ] Dashboard loads.
- [ ] Customers page loads.
- [ ] Consultation requests page loads.
- [ ] Cases page loads.
- [ ] Appointments page loads.
- [ ] Tasks page loads.
- [ ] Documents page loads.
- [ ] Reports page loads.
- [ ] Refreshing a protected deep link still renders the app.
- [ ] Logout clears the browser session.

Documents:

- [ ] Upload a tiny fictional PDF or image.
- [ ] View document detail.
- [ ] Download through the protected endpoint.
- [ ] Delete the test document.
- [ ] Confirm no downloaded or uploaded test file is staged or committed.

Security:

- [ ] Browser console does not call `localhost` or `127.0.0.1`.
- [ ] No CORS error appears in the browser console.
- [ ] Browser console does not print tokens, passwords, or consultation PII.
- [ ] Login, `/api/auth/me`, users, dashboard, and assignment endpoints do not
  return `passwordHash`.
- [ ] Render logs do not print `DATABASE_URL`, `JWT_SECRET`, Bearer tokens,
  passwords, or upload contents.

## Troubleshooting

| Problem | Likely cause | Fix |
| --- | --- | --- |
| Frontend says unable to connect | `VITE_API_BASE_URL` is wrong, missing `/api`, stale, or the Render backend is sleeping/down | Open the Render health URL, fix Vercel `VITE_API_BASE_URL`, then redeploy Vercel |
| Browser shows CORS error | Render `CLIENT_URL` does not exactly match the Vercel origin | Update Render `CLIENT_URL` to the exact Vercel origin, no path or trailing slash, then restart Render |
| Login returns `500` | `DATABASE_URL`, `JWT_SECRET`, migration, or seed/account provisioning issue | Check Render logs, confirm env vars, run `npm run prisma:deploy`, and verify the staging admin account |
| Login returns `401` | Wrong credentials or staging admin not provisioned | Use the staging-safe admin account; do not rely on the public demo password for long-lived staging |
| Demo seed refuses to run | `NODE_ENV=production` is set without explicit confirmation | Run the one-off command as `DEMO_SEED_ENABLED=true npm run seed:demo` after confirming the target is the staging database |
| Prisma client missing | Prisma generate did not run during build | Ensure Render build command includes `npm run prisma:generate` before `npm run build` |
| Prisma migration fails | Neon URL or migration permissions are wrong, or pooled/direct URL choice is incompatible | Check Neon connection string, use staging DB only, run `npm run prisma:deploy`, and use a direct connection for migration if needed |
| Frontend still calls localhost | Vercel env var is missing or frontend was not redeployed after changing it | Set `VITE_API_BASE_URL=https://<render-service-name>.onrender.com/api` and redeploy |
| First API call is slow | Render free instance or Neon compute cold start | Wait, refresh once, review Render/Neon logs, or use a non-sleeping backend/database plan |
| Refreshing `/admin/reports` shows 404 | Vercel SPA rewrite is missing or not picked up | Confirm `client/vercel.json` is deployed and Root Directory is `client` |
| Document upload works then disappears later | Render local disk is ephemeral, the service was redeployed, or `DOCUMENT_STORAGE_PROVIDER` is still `local` | Use local uploads only for tiny smoke tests; configure the private S3-compatible provider before real documents |

## Rollback

- Vercel frontend rollback: redeploy the previous Vercel deployment or previous
  commit.
- Render backend rollback: redeploy the previous successful backend deploy or
  previous commit.
- Database rollback: avoid destructive rollback. Prefer a forward fix unless a
  tested staging snapshot restore is available.
- Upload cleanup: delete fictional smoke-test files and downloaded files after
  rollback testing.

After rollback, repeat the staging smoke test and record a sanitized result in
the staging run record.

## References

- Render Web Services: https://render.com/docs/web-services
- Render Node/Express quickstart: https://render.com/docs/deploy-node-express-app
- Vercel Vite docs: https://vercel.com/docs/frameworks/frontend/vite
- Vercel build configuration: https://vercel.com/docs/builds/configure-a-build
- Neon Prisma guide: https://neon.com/docs/guides/prisma
