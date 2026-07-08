# Final QA Checklist

Use this manual checklist before promoting the Consulting CRM System from a
deployment candidate to a public portfolio or production-like environment.

For staging environment setup, CORS checks, migration steps, smoke tests,
rollback planning, and go/no-go criteria, see
[Staging Deployment Checklist](staging-deployment-checklist.md).

## Test Environment

- Environment:
- Frontend origin:
- Backend API base URL:
- Database:
- Tester:
- Date:

Do not paste real secrets, database URLs, or access tokens into this document.

## Build And Static Checks

- [ ] Server `npm run prisma:generate` passes.
- [ ] Server `npx prisma validate` passes.
- [ ] Server `npm run build` passes.
- [ ] Server `npm run lint` passes.
- [ ] Client `npm run build` passes.
- [ ] Client `npm run lint` passes.
- [ ] `git diff --check` passes.
- [ ] Server `npm run verify:tenant-isolation` passes after the optional
  Northstar QA seed is present.
- [ ] EN/VI i18n key parity check passes with `cd client && npm run i18n:check`.
- [ ] No `.env`, token, secret, database URL, or upload file is staged.

## Public Website

- [ ] Language switcher changes English -> Vietnamese without a reload.
- [ ] Language switcher changes Vietnamese -> English without a reload.
- [ ] Selected language persists in local storage as `advisora_locale` after refresh.
- [ ] Home page loads.
- [ ] Services page loads.
- [ ] Service detail page loads.
- [ ] Projects page loads.
- [ ] News page loads.
- [ ] News detail page loads.
- [ ] Contact page loads.
- [ ] Contact form validates required fields.
- [ ] Consultation form validates required fields.
- [ ] Consultation form submits successfully to the backend public consultation API.
- [ ] Appointment form validates required fields.
- [ ] Appointment form shows the expected validation/demo success flow.
- [ ] Public routes are responsive on mobile, tablet, and desktop.

## Admin Authentication

- [ ] Admin login language switcher works.
- [ ] Login succeeds with an authorized admin account.
- [ ] Invalid login shows a clear error.
- [ ] Refresh keeps the authenticated session.
- [ ] Logout clears the session.
- [ ] Protected admin routes redirect unauthenticated users to login.
- [ ] Staff and manager roles only see actions allowed by backend rules.

## Admin Modules

Dashboard:

- [ ] Sidebar and topbar labels follow the selected language.
- [ ] Overview metrics load.
- [ ] Upcoming deadlines load.
- [ ] Recent activity loads.
- [ ] Recent activity card links to `/admin/activity` for Admin/Manager.

Activity Center:

- [ ] `/admin/activity` loads for `ADMIN` and `MANAGER`.
- [ ] `/admin/activity` is hidden or forbidden for `STAFF`.
- [ ] `GET /api/activity` returns only the current workspace's activity.
- [ ] Search, action filter, entity filter, date range, sort, reset, and
  pagination work without bypassing workspace scope.
- [ ] `GET /api/activity/summary` returns today's totals and latest activity.
- [ ] Activity responses do not include raw passwords, invite tokens, JWTs,
  token hashes, storage keys, object keys, signed URLs, local file paths, bucket
  names, or environment values.
- [ ] Activity Center shows consultation automation actions with readable EN/VI
  labels.

Customers:

- [ ] List, search, pagination, create, edit, and detail flows work.
- [ ] Delete is restricted to allowed roles.
- [ ] Admin/Manager can open Portal access controls for an existing customer.
- [ ] Staff cannot manage customer portal access.

Customer Portal:

- [ ] Portal login language switcher works.
- [ ] Create portal access for an existing customer works.
- [ ] Create response shows a generated temporary password once when password
  is omitted.
- [ ] Create, reset, activate, and deactivate write safe activity logs.
- [ ] `passwordHash` is not returned by portal-account management responses.
- [ ] Duplicate portal account for the same customer returns `409`.
- [ ] Duplicate portal email in the same workspace returns `409`.
- [ ] `/portal/login` accepts workspace slug, email, and password.
- [ ] `/portal/dashboard` loads outside `AdminLayout`.
- [ ] Dashboard shows workspace, customer profile, portal account info, case
  summary, recent cases, recent updates, and next appointment if available.
- [ ] `/portal/cases` lists only the authenticated portal customer's cases.
- [ ] `/portal/cases/:id` shows safe case overview, timeline, appointments,
  portal-visible document metadata/download actions, and task summary for the
  portal customer's own case.
- [ ] `/portal/updates` lists only the authenticated portal customer's updates.
- [ ] `/api/portal/updates` supports type and case filters without bypassing
  `organizationId + customerId` scope.
- [ ] `/api/portal/updates/summary` returns latest safe updates for the portal
  dashboard.
- [ ] `/portal/documents` lists only `CUSTOMER_VISIBLE` documents scoped to the
  portal account's organization and customer.
- [ ] Portal uploads create `CUSTOMER_PORTAL` + `CUSTOMER_VISIBLE` documents
  without accepting customer or organization IDs from the client.
- [ ] Portal downloads use `/api/portal/documents/:id/download`, not the
  internal `/api/documents/:id/download` route.
- [ ] Internal document uploads are hidden from portal by default until an Admin
  or Manager marks them customer-visible.
- [ ] Admin Documents shows source/visibility badges and lets Admin/Manager
  toggle customer visibility.
- [ ] Admin Documents shows customer portal uploads.
- [ ] Portal case status, priority, appointment method/status, document type,
  and task status labels translate in English and Vietnamese.
- [ ] Another customer's case ID returns generic `404`.
- [ ] A cross-workspace case ID returns generic `404`.
- [ ] Another customer's document ID returns generic `404` for portal list or
  download.
- [ ] A cross-workspace document ID returns generic `404` for portal list or
  download.
- [ ] Portal case responses do not include internal notes, `fileUrl`,
  `passwordHash`, `tokenHash`, or raw upload paths.
- [ ] Portal update responses do not include internal notes, raw ActivityLog
  descriptions, `fileUrl`, `filePath`, raw upload paths, `storageKey`,
  object keys, signed URLs, bucket names, `passwordHash`, `tokenHash`,
  IP addresses, or user-agent data.
- [ ] Portal document responses do not include `fileUrl`, `filePath`, raw
  upload paths, `storageKey`, bucket names, `passwordHash`, `tokenHash`, or
  internal-only documents.
- [ ] Scan `PENDING`, `INFECTED`, and blocked `FAILED` statuses disable portal
  download and show a safe reason.
- [ ] Successful portal download creates `DocumentDownloadAudit`, increments
  `downloadCount`, and updates `lastDownloadedAt`.
- [ ] Portal case pages have no edit, delete, assign, or status-update controls.
- [ ] Refreshing `/portal/dashboard` restores the portal session.
- [ ] Portal password reset invalidates the old password and allows the new
  password.
- [ ] Deactivate blocks portal login with a generic failure message.
- [ ] Activate allows portal login again.
- [ ] Portal token cannot access admin APIs.
- [ ] Internal token cannot access portal APIs.

Consultation Requests:

- [ ] List, search, filters, details, and status updates work.
- [ ] Invalid status transitions are handled clearly.

Cases:

- [ ] List, search, filters, pagination, create, edit, and detail flows work.
- [ ] Status transitions follow the workflow rules.
- [ ] Staff assignment works for authorized users.
- [ ] Case history is recorded.
- [ ] Overdue cases are visible.
- [ ] Delete is restricted to allowed roles.
- [ ] AI Case Summary panel appears in internal case detail only.
- [ ] Admin and Manager can generate a mock AI summary for same-workspace cases.
- [ ] Assigned Staff can generate a summary; unassigned Staff is blocked.
- [ ] AI summary shows loading, error, empty, structured result, provider/model,
  generated-at, confidence, and source-count states.
- [ ] `AI_PROVIDER=disabled` returns a controlled disabled state and does not
  break case detail.
- [ ] Portal/public tokens cannot call `/api/cases/:id/ai-summary`.
- [ ] AI summary responses do not include raw file data, storage paths, signed
  URLs, full OCR text, token/hash fields, IP addresses, user agents, or secrets.
- [ ] Activity Center shows safe AI summary generated/failed/skipped labels.

Appointments:

- [ ] List, filters, pagination, create, edit, and detail flows work.
- [ ] Today appointments view works.
- [ ] Status transitions follow the workflow rules.
- [ ] Delete is restricted to allowed roles.

Tasks:

- [ ] List, filters, pagination, create, edit, and detail flows work.
- [ ] Overdue tasks view works.
- [ ] Status transitions follow the workflow rules.
- [ ] Delete is restricted to allowed roles.

Team Members:

- [ ] `/admin/users` loads for `ADMIN`.
- [ ] `/admin/users` is hidden or forbidden for `MANAGER` and `STAFF`.
- [ ] List, search, role filter, status filter, and pagination work.
- [ ] Create internal `STAFF` user works with a temporary password.
- [ ] Edit full name, phone, avatar URL, role, and active status works.
- [ ] Password reset works and response does not include `passwordHash`.
- [ ] Deactivated users cannot log in.
- [ ] Reactivated users can log in with the current password.
- [ ] The last active admin cannot be deactivated or demoted.
- [ ] User hard delete is not available in the UI or API.
- [ ] Case, appointment, and task assignment dropdowns still load assignable
  users.

Workspace Settings:

- [ ] `/admin/settings` loads for `ADMIN`.
- [ ] `/admin/settings` is hidden or forbidden for `MANAGER` and `STAFF`.
- [ ] `GET /api/workspace/me` returns only the current workspace safe fields.
- [ ] `PATCH /api/workspace/me` updates name, industry, website, email, phone,
  address, and logo URL for an admin.
- [ ] Empty optional fields can be cleared without validation errors.
- [ ] Slug update allows the current slug, rejects invalid slugs, and rejects a
  slug used by another workspace.
- [ ] Workspace update creates a `WORKSPACE_UPDATED` activity log.
- [ ] Settings save refreshes `/api/auth/me` so the admin topbar shows the
  updated workspace name.
- [ ] Manager and staff can read workspace info if needed but cannot update it.
- [ ] Public consultation requests still map to `DEFAULT_ORGANIZATION_SLUG`.
- [ ] Public consultation creates a follow-up task when
  `CONSULTATION_AUTOMATION_ENABLED=true` and
  `CONSULTATION_AUTO_TASK_ENABLED=true`.
- [ ] Auto-created task is assigned to an active same-workspace Manager first,
  then Admin; no cross-tenant assignment occurs.
- [ ] Automation disabled or task disabled keeps the public request submission
  successful without creating a task.

Invitations:

- [ ] `/admin/invitations` loads for `ADMIN`.
- [ ] `/admin/invitations` is hidden or forbidden for `MANAGER` and `STAFF`.
- [ ] List, search, role filter, status filter, and pagination work.
- [ ] Create invitation supports Send invitation email now.
- [ ] Create invitation returns invite link and `emailDelivery` only
  immediately after create.
- [ ] List/create/resend/revoke responses do not include `tokenHash`.
- [ ] Console provider masks recipient logs and redacts invite links.
- [ ] `sendEmail=false` creates invitation, returns `DISABLED`, and manual
  accept still works.
- [ ] Resend works for pending/expired invitations and rotates the invite link
  only after a verified sender, API key, and staging/test recipient are
  configured outside the repository.
- [ ] Old invite link fails after resend; new link previews and accepts.
- [ ] Accepted and revoked invitations cannot be resent.
- [ ] Email delivery failure does not delete the invitation and copy link still
  works.
- [ ] Duplicate existing-user email and duplicate pending invitation return
  safe errors.
- [ ] Public `/invite/:token` preview shows invited email, role, workspace, and
  expiry.
- [ ] Accept creates the user with role and workspace from the invitation only.
- [ ] Successful accept auto-logins and redirects to dashboard.
- [ ] Accepted, revoked, expired, or invalid tokens cannot be reused.
- [ ] Revoke blocks the invite link and keeps the record in history.
- [ ] No raw invite token, `tokenHash`, password, or JWT appears in browser
  console logs or committed files.

Documents:

- [ ] Upload accepts allowed file types.
- [ ] Upload rejects unsupported file types.
- [ ] Upload rejects files larger than `MAX_FILE_SIZE_MB`.
- [ ] List, search, filters, pagination, and detail flows work.
- [ ] Download is protected and returns the correct file.
- [ ] Delete is restricted to allowed roles and eligible uploaders.

Reports:

- [ ] `/admin/reports` loads from a refreshed deep link.
- [ ] Overview summary loads.
- [ ] Cases by status loads.
- [ ] Cases by month loads with the admin UI default last-30-days range.
- [ ] Clearing the date range falls back to the backend default reporting window.
- [ ] Date range changes update monthly and staff reports.
- [ ] Invalid date range blocks report requests.
- [ ] Upcoming deadlines days selector works for 7, 14, and 30 days.
- [ ] Staff performance loads for `ADMIN` and `MANAGER`.
- [ ] Staff performance is hidden or locked for `STAFF`.
- [ ] Recent activities load.

## Security And Privacy

- [ ] No real locale preference is stored server-side; UI locale stays in
  `advisora_locale`.
- [ ] No `.env` file is committed.
- [ ] No `DATABASE_URL` is committed.
- [ ] No JWT secret is committed.
- [ ] No access token is committed.
- [ ] No upload file is committed.
- [ ] Login, `/auth/me`, `/users`, and `/users/assignable` do not return
  `passwordHash`.
- [ ] Portal login, `/portal/auth/me`, and `/portal/me` do not return
  `passwordHash` or internal `User` data.
- [ ] Portal JWT payload includes `purpose: "customer_portal"`.
- [ ] Admin token key and portal token key are separate
  (`consulting_crm_access_token` vs `advisora_portal_access_token`).
- [ ] API errors do not reveal secrets.
- [ ] API 404 responses redact invitation tokens, signed URLs, storage keys,
  local paths, and `/uploads/...` path fragments.
- [ ] Non-production API error details redact tokens, passwords, secrets,
  signed URLs, storage keys, and local paths.
- [ ] Browser console does not print tokens or sensitive payloads.
- [ ] Server logs do not print passwords, Bearer tokens, database URLs, or file
  contents.
- [ ] CORS allows only the configured frontend origin or allowlist.
- [ ] `GET /api/health` response includes security headers:
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and
  `Referrer-Policy: no-referrer`.
- [ ] `x-powered-by` is absent from API responses.
- [ ] Oversized JSON body over the configured `1mb` parser limit is rejected
  without exposing stack traces or secrets.
- [ ] Invalid internal login attempts eventually return `429` with a generic
  message and no email/user/workspace leak.
- [ ] Invalid portal login attempts eventually return `429` with a generic
  message and no email/user/workspace leak.
- [ ] Invitation preview/accept, public consultation, document upload, and
  document download routes return generic `429` when their configured limits
  are intentionally exceeded.
- [ ] Staff users see only data scoped to their backend permissions.

## Staging/Production Smoke

Use these checks for staging smoke testing as well as later production smoke
testing.

- [ ] English/Vietnamese switching works on public, admin, and portal surfaces.
- [ ] User-generated data is still displayed as entered and is not auto-translated.
- [ ] `GET /api/health` returns success.
- [ ] `npm run smoke:production` passes when sanitized smoke credentials are
  available.
- [ ] Optional `SMOKE_RATE_LIMIT_CHECK=true npm run smoke:production` observes
  `429` during an intentional abuse-protection test window.
- [ ] `cd server && npm run verify:providers` passes in default dry-run mode.
- [ ] Admin login returns a sanitized user and access token.
- [ ] Dashboard API returns data.
- [ ] Portal token cannot call `/api/users`.
- [ ] Internal token cannot call `/api/portal/me`.
- [ ] Document upload and download work.
- [ ] Customer portal document list/upload/download works with portal auth only.
- [ ] Customer portal updates list and dashboard recent updates work with portal
  auth only.
- [ ] Internal-only documents remain hidden until Admin/Manager toggles
  `CUSTOMER_VISIBLE`.
- [ ] Admin document list/detail shows storage provider, scan status, OCR
  status, OCR preview, download count, and last downloaded.
- [ ] S3-compatible provider smoke is run when private test bucket env is
  available and `PROVIDER_READINESS_ALLOW_WRITE=true` is explicitly set.
- [ ] Reports APIs return data for an admin account.
- [ ] Admin user management create/edit/reset/deactivate/reactivate smoke works
  with fictional users.
- [ ] Customer portal create/login/me/dashboard/reset/deactivate/reactivate
  smoke works with fictional customers.
- [ ] Public consultation form submits to the backend.
- [ ] Public contact and appointment forms validate locally as documented demo flows.
- [ ] Refreshing a protected admin deep link keeps or restores session correctly.

## Step 32 UI Polish Smoke

- [ ] Shared page loading states render without CRM-specific copy on public or
  portal lazy routes.
- [ ] Empty states for filtered admin and portal lists stay bilingual and do not
  mention the wrong module.
- [ ] Initial portal dashboard, cases, documents, updates, and case detail load
  states do not show misleading zero data.
- [ ] Initial portal fetch failures show a clear error state with retry.
- [ ] Admin priority tables wrap long values or scroll without breaking mobile
  layout.
- [ ] Admin topbar and portal navigation remain accessible at mobile width.
- [ ] Vietnamese labels do not overflow primary portal cards or filter controls.
- [ ] Portal document uploaded-by labels localize and download-unavailable
  reasons remain safe.

## Step 33 Final QA Record

Local Step 33 verification completed after Step 32.

Commands run:

- `cd client && npm run build`
- `cd client && npm run lint`
- `cd server && npm run build`
- `cd server && npm run lint`
- `cd server && npx prisma validate`
- `cd server && npm run prisma:generate`
- `cd server && npm run verify:tenant-isolation`
- `git diff --check`
- EN/VI key parity check using a read-only TypeScript AST command.
- Static `t('...')` missing-key scan using a read-only TypeScript AST command.
- Local API health/header smoke against `http://127.0.0.1:5000/api/health`.
- `npm run smoke:production` against localhost with sanitized demo smoke
  credentials, including `SMOKE_RATE_LIMIT_CHECK=true`.

Step 33 results:

- [x] Client build and lint passed.
- [x] Server build, lint, Prisma validation, and Prisma generate passed.
- [x] EN/VI key parity and static missing-key scan passed.
- [x] Tenant isolation verification passed for Advisora and Northstar demo data.
- [x] Local production-smoke script readiness passed against localhost.
- [x] Health endpoint returned expected security headers and no
  `x-powered-by`.
- [x] Optional rate-limit smoke observed `429` during intentional invalid
  login attempts.
- [x] Admin token and portal token purpose separation passed in local smoke.
- [x] Document security regression fixed: Staff document access no longer
  treats every `CUSTOMER_PORTAL` upload in the same workspace as readable.
- [x] Task/admin status labels now use task-owned/common i18n keys instead of
  appointment or portal namespaces.
- [x] No database reset, staging data deletion, secrets, `.env`, upload files,
  or generated `dist` files were staged.
- [ ] Production live smoke was not run because no `SMOKE_*` environment
  variables were available in the shell. Provide safe deployed API smoke
  credentials outside the repository before running live smoke.

## Step 18A Local QA Record

- [x] Backend health check passed locally.
- [x] Invalid login and valid admin login passed locally.
- [x] Protected API request without token returned `401`.
- [x] Public consultation create passed and QA record was cleaned up.
- [x] Customer create/edit/search/delete smoke passed.
- [x] Consultation request list/detail/status smoke passed.
- [x] Case create/edit/status/assign/history/overdue smoke passed.
- [x] Appointment create/edit/status/today/delete smoke passed.
- [x] Task create/edit/status/overdue/delete smoke passed.
- [x] Document upload/detail/download/delete smoke passed.
- [x] Reports endpoints and invalid date range validation passed.
- [x] QA customer/case/appointment/task/document data was cleaned up.
- [ ] Browser screenshot pass remains required before staging because the
  in-app browser connector was unavailable in the Step 18A environment.

## Final Portfolio Release Checklist

- [x] README has live demo and backend health links.
- [x] Demo accounts are documented and demo API logins were spot-checked for
  internal Advisora/Northstar accounts and Northstar portal accounts.
- [x] Demo walkthrough has a concise 3-5 minute flow and talk track.
- [x] Screenshot checklist is added in `docs/screenshots/README.md`.
- [ ] Actual screenshot files are pending and must be captured from real
  local/staging screens before adding README image links.
- [x] No secrets, `.env` files, tokens, provider credentials, real upload files,
  or generated `dist` output should be staged.
- [x] Production smoke script is ready and documented.
- [x] Step 33 final QA passed.
- [x] Release notes are updated in `docs/release-notes.md`.
- [x] Architecture diagrams are documented in `README.md` and
  `docs/architecture.md`.
- [x] GitHub Actions CI workflow is added for client/server build, lint,
  Prisma generate/validate, i18n checks, and docs/safety checks.
- [x] Manual production smoke workflow is added with `workflow_dispatch` and
  `SMOKE_*` repository secrets only.
- [x] Dependabot npm monitoring is added for `/client` and `/server`.
- [ ] Repository description and topics can be added manually on GitHub.

## Step 35 CI/CD Checklist

- [x] `.github/workflows/ci.yml` runs on push and pull request to `main`.
- [x] Client CI runs `npm ci`, `npm run lint`, `npm run i18n:check`, and
  `npm run build`.
- [x] Server CI runs `npm ci`, `npm run prisma:generate`,
  `npx prisma validate`, `npm run lint`, and `npm run build`.
- [x] CI uses safe dummy env values and no production database, JWT, Resend, or
  S3 secrets.
- [x] Default CI does not deploy, call Vercel/Render hooks, run migrations,
  reset the database, seed data, or run live production smoke.
- [x] Tenant isolation remains a local/staging command because
  `npm run verify:tenant-isolation` requires seeded Advisora/Northstar data.
- [x] Manual production smoke workflow requires `SMOKE_*` repository secrets and
  runs only through `workflow_dispatch`.
- [x] No `.env`, secrets, tokens, uploaded files, or generated `dist` output are
  required for CI.

## Step 36 Consultation Automation Checklist

- [x] Public consultation automation creates normal CRM tasks without a schema
  migration.
- [x] Assignment strategy is same-tenant Manager first, then Admin.
- [x] Automation email uses the existing `disabled`/`console`/`resend`
  abstraction and is non-blocking on failure.
- [x] ActivityLog actions cover request created, task created/failed, and email
  sent/skipped/failed.
- [x] Dashboard and Activity Center labels are updated for consultation
  automation actions.
- [x] Env flags are documented and CI uses safe dummy automation env values.
- [x] No database reset, destructive migration, seed, secret, upload, or
  generated `dist` output is required.

## Step 37 AI Case Summary Checklist

- [x] AI module/provider abstraction supports `disabled`, `mock`, and
  `external` modes.
- [x] Mock provider is deterministic and demo-ready without API keys.
- [x] Internal AI endpoint is `/api/cases/:id/ai-summary`, not a portal route.
- [x] Safe context builder excludes raw files, storage paths, signed URLs, full
  OCR text, token/hash fields, IP/user-agent values, database URLs, and secrets.
- [x] Staff assigned-case access and tenant scope are enforced before related
  case data is fetched.
- [x] Generated, failed, and skipped attempts write generic ActivityLog events.
- [x] Admin case detail has loading, error, empty, structured-result,
  provider/model, confidence, and source-count UI states.
- [x] EN/VI labels are present for AI summary UI and Activity Center actions.
- [x] CI uses safe AI env values and no API key.

## Step 38 Provider Readiness Checklist

- [x] Cloud storage setup docs state that local storage is the dev/demo default
  and is not durable on hosted environments.
- [x] Cloud storage setup docs require private S3-compatible buckets, least
  privilege, no public bucket access, and no storage keys/buckets/paths in JSON
  responses.
- [x] Email setup docs state that console/disabled email is the dev/demo default
  and Resend requires external account setup, verified sender, and dashboard
  secrets.
- [x] Provider readiness docs cover `cd server && npm run verify:providers`,
  dry-run default behavior, and explicit opt-in for live write/send checks.
- [ ] Live storage write/read/delete readiness has been run against a disposable
  staging bucket or prefix, if S3-compatible test secrets are available.
- [ ] Live Resend readiness email has been sent only to a staging/test
  recipient, if Resend test secrets are available.

## Step 38.5 Modern Landing And CRM UI Polish Checklist

- [x] Public landing hero uses a lightweight React/Tailwind mock CRM dashboard,
  not a screenshot or external image URL.
- [x] Landing page includes product capability, workflow, security, AI,
  automation, document security, and provider-readiness highlights.
- [x] Landing CTAs point to existing demo entry routes for consultation, Admin
  CRM, Customer Portal, and the feature section.
- [x] New public copy is backed by both English and Vietnamese translation
  resources.
- [x] Landing motion is CSS-only and guarded by `prefers-reduced-motion`.
- [x] No Three.js, React Three Fiber, GSAP, WebGL scene, video background, or
  heavy animation dependency is added.
- [x] Admin CRM polish remains 2D, table/form-friendly, and business-focused.
- [x] Shared admin surfaces, metric cards, tables, modal semantics, topbar, and
  mobile sidebar semantics are refined without changing API calls.
- [x] Customer Portal dashboard and document surfaces receive trust-focused UI
  polish while continuing to use portal auth and portal API routes.
- [x] No fake screenshot files or binary image assets are added.
- [ ] Capture real screenshots for the modern landing hero, landing
  feature/security section, admin dashboard polish, AI summary panel, and
  customer portal dashboard before adding README image links.

## Final Sign-Off

| Area | Result | Notes |
| --- | --- | --- |
| Build and lint |  |  |
| Public website |  |  |
| Admin auth |  |  |
| Customer portal |  |  |
| Admin CRM modules |  |  |
| Documents |  |  |
| Reports |  |  |
| Activity Center / Portal Updates |  |  |
| Consultation workflow automation |  |  |
| AI Case Summary |  |  |
| Provider Readiness |  |  |
| Step 38.5 modern landing / CRM UI polish |  |  |
| Step 38.6 taste-skill guided UI audit & refinement | PASS | Landing/Admin/Portal micro polish using taste-skill as restraint only. No redesign, no heavy motion/libs, build/lint/i18n clean, restrained admin surfaces, polished landing/portfolio feel. |
| Step 38.7 distinctive landing art direction overhaul | PASS | Public landing only. New editorial consulting-ops language (navy/paper/emerald + ledger boards + rule lines + concrete workflow narrative). Admin + Portal intentionally untouched. Build/lint/i18n clean. |
| Step 38.7.1 localize landing ledger copy | PASS | All ledger/board/chip text in Hero and ProductHighlights localized via i18n. EN/VI parity. No visual or logic changes. |
| Step 31 security hardening |  |  |
| Step 32 UI polish |  |  |
| Step 33 final QA / bug fix | PASS | Local build/lint/prisma/i18n/tenant/API smoke passed; live production smoke skipped because no `SMOKE_*` env was available. |
| Security |  |  |
| Production smoke |  |  |

Final decision:

- [ ] Ready.
- [ ] Ready with accepted risks.
- [ ] Not ready.
