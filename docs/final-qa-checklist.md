# Final QA Checklist

Use this manual checklist before promoting the Consulting CRM System from a
deployment candidate to a public portfolio or production-like environment.

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

- [ ] Login succeeds with an authorized admin account.
- [ ] Invalid login shows a clear error.
- [ ] Refresh keeps the authenticated session.
- [ ] Logout clears the session.
- [ ] Protected admin routes redirect unauthenticated users to login.
- [ ] Staff and manager roles only see actions allowed by backend rules.

## Admin Modules

Dashboard:

- [ ] Overview metrics load.
- [ ] Upcoming deadlines load.
- [ ] Recent activity loads.

Customers:

- [ ] List, search, pagination, create, edit, and detail flows work.
- [ ] Delete is restricted to allowed roles.

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

- [ ] No `.env` file is committed.
- [ ] No `DATABASE_URL` is committed.
- [ ] No JWT secret is committed.
- [ ] No access token is committed.
- [ ] No upload file is committed.
- [ ] Login, `/auth/me`, `/users`, and `/users/assignable` do not return
  `passwordHash`.
- [ ] API errors do not reveal secrets.
- [ ] Browser console does not print tokens or sensitive payloads.
- [ ] Server logs do not print passwords, Bearer tokens, database URLs, or file
  contents.
- [ ] CORS allows only the configured frontend origin or allowlist.
- [ ] Staff users see only data scoped to their backend permissions.

## Production Smoke

- [ ] `GET /api/health` returns success.
- [ ] Admin login returns a sanitized user and access token.
- [ ] Dashboard API returns data.
- [ ] Document upload and download work.
- [ ] Reports APIs return data for an admin account.
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
| Admin CRM modules |  |  |
| Documents |  |  |
| Reports |  |  |
| Security |  |  |
| Production smoke |  |  |

Final decision:

- [ ] Ready.
- [ ] Ready with accepted risks.
- [ ] Not ready.
