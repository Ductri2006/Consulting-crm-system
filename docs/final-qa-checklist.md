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
- [ ] Resend works for pending/expired invitations and rotates the invite link.
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
- [ ] Browser console does not print tokens or sensitive payloads.
- [ ] Server logs do not print passwords, Bearer tokens, database URLs, or file
  contents.
- [ ] CORS allows only the configured frontend origin or allowlist.
- [ ] Staff users see only data scoped to their backend permissions.

## Staging/Production Smoke

Use these checks for staging smoke testing as well as later production smoke
testing.

- [ ] English/Vietnamese switching works on public, admin, and portal surfaces.
- [ ] User-generated data is still displayed as entered and is not auto-translated.
- [ ] `GET /api/health` returns success.
- [ ] Admin login returns a sanitized user and access token.
- [ ] Dashboard API returns data.
- [ ] Document upload and download work.
- [ ] Customer portal document list/upload/download works with portal auth only.
- [ ] Customer portal updates list and dashboard recent updates work with portal
  auth only.
- [ ] Internal-only documents remain hidden until Admin/Manager toggles
  `CUSTOMER_VISIBLE`.
- [ ] Admin document list/detail shows storage provider, scan status, OCR
  status, OCR preview, download count, and last downloaded.
- [ ] S3-compatible provider smoke is run when test bucket env is available.
- [ ] Reports APIs return data for an admin account.
- [ ] Admin user management create/edit/reset/deactivate/reactivate smoke works
  with fictional users.
- [ ] Customer portal create/login/me/dashboard/reset/deactivate/reactivate
  smoke works with fictional customers.
- [ ] Public consultation form submits to the backend.
- [ ] Public contact and appointment forms validate locally as documented demo flows.
- [ ] Refreshing a protected admin deep link keeps or restores session correctly.

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
| Security |  |  |
| Production smoke |  |  |

Final decision:

- [ ] Ready.
- [ ] Ready with accepted risks.
- [ ] Not ready.
