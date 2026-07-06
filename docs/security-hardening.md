# Security Hardening

This document records the Step 31 security review for Advisora CRM. It is a
production-like hardening record for portfolio/staging use, not a claim that
the system is ready for real sensitive production data.

## Current Status

Step 31 adds or verifies:

- HTTP security headers through Helmet.
- `x-powered-by` disabled.
- JSON and URL-encoded body limits set to `1mb`.
- Reusable rate limiting for sensitive auth, public, invitation, upload, and
  download routes.
- Internal and customer portal JWT purpose separation.
- Redaction helpers for URLs, logs, activity descriptions, and error output.
- Extra audit coverage for users and internal document upload/delete.
- Extended tenant-isolation verification for activity, documents, downloads,
  and portal accounts.
- A read-only production smoke script.
- Security/RBAC documentation and QA checklist coverage.

Step 33 re-reviewed this model during the final QA/fix sprint and closed a
staff document-access regression: `CUSTOMER_PORTAL` source alone must not grant
staff read/list/download access. Staff internal document access remains scoped
to documents they uploaded or documents attached to cases assigned to them.

## HTTP Security Headers

The Express app configures Helmet in `server/src/app.ts` with conservative
headers that should not break the Vite/Vercel frontend or protected downloads:

| Header/control | Current behavior |
| --- | --- |
| `x-powered-by` | Disabled with `app.disable("x-powered-by")`. |
| `X-Content-Type-Options` | `nosniff` from Helmet. |
| `X-Frame-Options` | `DENY` through Helmet frameguard. |
| `Referrer-Policy` | `no-referrer`. |
| `Cross-Origin-Resource-Policy` | `cross-origin` to avoid breaking API/download usage across the configured frontend origin. |
| HSTS | Enabled by Helmet only when `NODE_ENV=production`. |
| CSP | Not enabled yet. It is deferred to avoid breaking Vite/Vercel staging until assets, API origins, and download behavior are fully reviewed. |

CORS is still limited to `CLIENT_URL`, which may be a comma-separated allowlist
of frontend origins. Do not use wildcard origins for authenticated traffic.

## Rate Limiting

`server/src/middlewares/rateLimit.middleware.ts` defines reusable in-memory
limiters. `RATE_LIMIT_ENABLED` defaults to `true`.

| Limiter | Default | Current endpoint coverage |
| --- | --- | --- |
| Auth | 10 requests per 15 minutes | `POST /api/auth/login`, `POST /api/portal/auth/login`, `POST /api/workspaces/signup` |
| Public | 50 requests per 15 minutes | `POST /api/public/consultation-requests` |
| Upload | 20 requests per 15 minutes | `POST /api/documents/upload`, `POST /api/portal/documents` |
| Download | 100 requests per 15 minutes | `GET /api/documents/:id/download`, `GET /api/portal/documents/:id/download` |
| AI summary | 20 requests per 15 minutes | `POST /api/cases/:id/ai-summary` |
| Invitation | Auth defaults | `POST /api/invitations`, `POST /api/invitations/:id/resend`, `GET /api/invitations/public/:token`, `POST /api/invitations/public/:token/accept` |

Environment variables:

```env
RATE_LIMIT_ENABLED=true
AUTH_RATE_LIMIT_WINDOW_MINUTES=15
AUTH_RATE_LIMIT_MAX=10
PUBLIC_RATE_LIMIT_WINDOW_MINUTES=15
PUBLIC_RATE_LIMIT_MAX=50
UPLOAD_RATE_LIMIT_WINDOW_MINUTES=15
UPLOAD_RATE_LIMIT_MAX=20
DOWNLOAD_RATE_LIMIT_WINDOW_MINUTES=15
DOWNLOAD_RATE_LIMIT_MAX=100
AI_RATE_LIMIT_WINDOW_MINUTES=15
AI_RATE_LIMIT_MAX=20
```

Rate-limit responses use HTTP `429` with the generic message:

```text
Too many requests. Please try again later.
```

The response does not include user, email, workspace, or token details. The
current limiter is process-local and IP-based. It is acceptable for local and
single-instance portfolio staging, but production or multi-instance deployments
should move this state to Redis or another shared store and should review proxy
IP handling.

Public appointment requests are still a frontend validation/demo flow in this
repository, so there is no backend public appointment route to limit yet.

## Auth Token Boundaries

Internal CRM access tokens and customer portal access tokens share the JWT
verification helper, but carry different payload contracts:

- Internal tokens are signed with `purpose: "internal"`.
- Existing older internal tokens with no `purpose` are still accepted for
  backward compatibility.
- Customer portal tokens require `purpose: "customer_portal"` plus
  `portalAccountId`, `organizationId`, `customerId`, and `email`.
- Internal middleware rejects portal-purpose tokens.
- Portal middleware rejects tokens that are not portal-purpose tokens.
- Portal session reload verifies that the token account, customer, email, and
  organization still match the database.
- Frontend admin and portal token keys are separate:
  `consulting_crm_access_token` and `advisora_portal_access_token`.

Future production work should add token revocation/refresh-token strategy and
consider separate signing secrets or key IDs for internal and portal token
families.

## Tenant Isolation Rules

Internal CRM data is scoped by the authenticated internal actor's
`organizationId`. Clients must not send `organizationId` to override scope.

Required invariants:

- Internal list/detail/mutation services use `request.user.organizationId`.
- Portal services use the portal account's `organizationId` and `customerId`.
- Case-linked documents must belong to the same organization and customer.
- Portal updates are customer-scoped and validate optional `caseId` ownership.
- Activity Center queries are organization-scoped and Admin/Manager-only.
- Admin/Manager users cannot read another workspace's CRM data.

`npm run verify:tenant-isolation` is read-only and now checks users, customers,
cases, requests, appointments, tasks, case history, activity logs, documents,
document download audits, portal accounts, and relation leaks between the
Advisora and Northstar QA workspaces. It does not reset or mutate data.

## Logging Redaction

`server/src/utils/redact.ts` provides:

- `redactSensitiveText(value: string)`
- `redactObject(value)`

Redaction covers Bearer tokens, invitation URLs, `/invite/<token>` links,
signed/storage query values, key/secret/password/token fields, S3 URLs, local
Windows paths, and `/uploads/...` paths.

Current usage:

- Morgan request URL logging is redacted.
- Non-production error details are redacted before returning.
- 404 `path` values are redacted.
- Activity descriptions are redacted before returning from Activity Center.

Do not log request bodies for login, portal login, invitation accept, upload,
or password reset flows. Do not print raw `Authorization`, JWTs, invitation
tokens, reset tokens, `DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY`, S3 keys,
storage keys, signed URLs, local file paths, or uploaded file contents.

## AI Case Summary Security

`POST /api/cases/:id/ai-summary` is an internal CRM route only. It uses the
same internal auth middleware as `/api/cases`, so customer portal JWTs and
public callers cannot reach it. Admin and Manager users can summarize
same-workspace cases; Staff users can summarize only cases assigned to them.

The AI context builder reads by `organizationId + caseProfileId` and excludes
raw file binaries, `fileUrl`, storage keys, buckets/regions, signed URLs, local
paths, object keys, checksums, full OCR text, password hashes, token hashes,
invite/JWT/API tokens, IP addresses, user-agent values, database URLs, and
provider internals. Case notes, document names, and OCR previews are treated as
untrusted text, redacted, truncated, and sent as data only. External provider
mode sends only this sanitized context and is timeout-protected.

Provider modes are `disabled`, `mock`, and `external`. The mock provider is
deterministic for demo/CI and uses no network call or API key. Disabled,
failed, and generated attempts write generic ActivityLog rows only:
`AI_CASE_SUMMARY_SKIPPED`, `AI_CASE_SUMMARY_FAILED`, and
`AI_CASE_SUMMARY_GENERATED`. Prompts, model output, OCR text, storage metadata,
and provider secrets must never be logged.

## Audit Event Coverage

The system uses `ActivityLog`, `CaseHistory`, and `DocumentDownloadAudit`.
Descriptions must stay generic and redacted.

| Area | Current coverage |
| --- | --- |
| Workspace | `WORKSPACE_CREATED`, `WORKSPACE_UPDATED` |
| Users | `USER_CREATED`, `USER_UPDATED`, `USER_ACTIVATED`, `USER_DEACTIVATED`, `USER_PASSWORD_RESET` |
| Invitations | `INVITATION_CREATED`, `INVITATION_RESENT`, `INVITATION_REVOKED`, `INVITATION_ACCEPTED`, email delivery status actions |
| Customer portal accounts | `CUSTOMER_PORTAL_ACCOUNT_CREATED`, `CUSTOMER_PORTAL_PASSWORD_RESET`, `CUSTOMER_PORTAL_ACCOUNT_ACTIVATED`, `CUSTOMER_PORTAL_ACCOUNT_DEACTIVATED` |
| Documents | `DOCUMENT_UPLOADED`, `DOCUMENT_DELETED`, `CUSTOMER_PORTAL_DOCUMENT_UPLOADED`, `DOCUMENT_PORTAL_VISIBILITY_UPDATED` |
| Downloads | `DocumentDownloadAudit` rows for successful internal and portal downloads, plus Activity Center normalized `DOCUMENT_DOWNLOADED` items |
| Cases | `CaseHistory` rows for status/history events |
| AI summaries | `AI_CASE_SUMMARY_GENERATED`, `AI_CASE_SUMMARY_FAILED`, `AI_CASE_SUMMARY_SKIPPED` in `ActivityLog` with generic descriptions |
| Activity Center | Read-only normalized feed for Admin/Manager, scoped by organization |
| Portal Updates | Read-only customer-safe feed from case, appointment, document, download, and account events |

Login success/failure events are not written to `ActivityLog` to avoid noisy or
abusable logs in this portfolio phase. If added later, they should be sampled
or rate-limited and must never include passwords, tokens, or raw request bodies.

## Document Security Model

The Step 29.5 document security invariants remain required:

- Portal uses `/api/portal/documents/:id/download`; it must not reuse the
  internal `/api/documents/:id/download` route.
- Portal JSON must not expose `fileUrl`, `filePath`, raw upload paths,
  `storageKey`, object keys, bucket names, signed URLs, or local paths.
- Internal uploads default to `source=INTERNAL` and
  `visibility=INTERNAL_ONLY`.
- A customer can see an internal document only after an Admin or Manager sets
  `visibility=CUSTOMER_VISIBLE`.
- Portal uploads are scoped to the authenticated portal account and are created
  as `source=CUSTOMER_PORTAL` and `visibility=CUSTOMER_VISIBLE`.
- Staff users must not receive blanket access to every `CUSTOMER_PORTAL`
  document in their workspace. They may read portal-uploaded documents through
  the internal document APIs only when the document is otherwise in their staff
  scope, such as an assigned case.
- Download permission, tenant/customer/case scope, visibility, scan policy, and
  object existence are checked before streaming.
- `INFECTED` downloads are blocked. `FAILED` downloads are blocked by default.
  `SKIPPED` is allowed by default for local/demo compatibility and must be
  reviewed before real production document handling.
- Successful downloads write `DocumentDownloadAudit` and update
  `downloadCount` and `lastDownloadedAt`.
- S3-compatible storage must use private buckets. Local storage must not allow
  path traversal and is for development/single-instance smoke only.

## Frontend Route Guards

The frontend keeps admin and portal auth separate:

- `/admin/*` protected pages use internal `ProtectedRoute` and `AdminLayout`.
- `/admin/activity` is Admin/Manager-only.
- `/admin/users`, `/admin/invitations`, and `/admin/settings` are Admin-only.
- `/portal/*` protected pages use `PortalProtectedRoute` and `PortalLayout`.
- Portal API helpers use the portal API client and portal token key.
- Admin API helpers use the internal API client and admin token key.
- 401 handling clears the matching token family.

## Production Smoke Script

`server/src/scripts/productionSmoke.ts` is exposed as:

```bash
cd server
npm run smoke:production
```

Required environment variables:

```env
SMOKE_API_BASE_URL=https://<backend-origin>/api
SMOKE_ADMIN_EMAIL=<staging-admin-email>
SMOKE_ADMIN_PASSWORD=<staging-admin-password>
SMOKE_PORTAL_WORKSPACE_SLUG=<portal-workspace-slug>
SMOKE_PORTAL_EMAIL=<portal-email>
SMOKE_PORTAL_PASSWORD=<portal-password>
SMOKE_RATE_LIMIT_CHECK=false
```

The script is read-only by default. It checks health/security headers,
internal login, `/auth/me`, Activity Center, portal login, `/portal/me`, Portal
Updates, and token purpose separation. Set `SMOKE_RATE_LIMIT_CHECK=true` only
for an intentional abuse-protection smoke window because it intentionally sends
invalid login attempts until a `429` is observed.

## Known Limitations

- No real production deployment has been performed yet.
- Current rate limiting is in-memory and IP-based; use Redis/shared state for
  multi-instance production.
- ClamAV/Tesseract require external infrastructure. Disabled scanner/OCR modes
  are for demo/local compatibility.
- `DOCUMENT_ALLOW_DOWNLOAD_WHEN_SCAN_SKIPPED=true` is demo-friendly and must be
  reviewed before real customer documents.
- No token revocation, refresh-token rotation, or separate JWT secrets by token
  family yet.
- Tokens are stored in browser local storage in this portfolio phase.
- No realtime/websocket or push notification system yet.
- No centralized production logging, metrics, alerting, WAF, captcha, or SIEM
  integration yet.

## Verification Commands

Run these before promoting a candidate:

```bash
cd server
npx prisma validate
npm run prisma:generate
npm run build
npm run lint
npm run verify:tenant-isolation
```

```bash
cd client
npm run build
npm run lint
```

Also run `git diff --check`, verify EN/VI key parity, and inspect
`git status --short` to ensure no `.env`, token, secret, upload file, `dist`,
or `node_modules` output is staged.
