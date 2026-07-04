# Demo Walkthrough

This walkthrough is the recommended local and staging portfolio demo script for
the Consulting CRM System. It is designed for fictional portfolio review, not
for real production use or real customer data.

## Project Overview

Consulting CRM System is a fullstack portfolio project for a fictional
consulting brand, Advisora. It combines:

- A public consulting website.
- A protected admin CRM workspace.
- A Node/Express API.
- Prisma with PostgreSQL.
- Admin workflows for customers, consultation requests, cases, appointments,
  tasks, documents, dashboards, and reports.
- An Organization / Workspace tenant foundation. The demo uses one workspace:
  `Advisora Demo Workspace`.

Demo rule: use local/demo data only. Do not use real customer information,
database connection strings, access tokens, production credentials, or
screenshots that reveal private provider settings.

## Before You Start

Prerequisites:

- Node.js 20 or later.
- npm.
- Local `.env` files copied from `.env.example`.
- A configured PostgreSQL or Neon database in `server/.env`.

Start the backend:

```bash
cd server
npm install
npm run prisma:generate
npm run dev
```

Start the frontend:

```bash
cd client
npm install
npm run dev
```

Staging URL placeholders:

- Public staging website: `https://<project-name>.vercel.app`
- Backend API: `https://<render-service-name>.onrender.com/api`
- Health check: `https://<render-service-name>.onrender.com/api/health`

Local URLs:

- Public website: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

Public visitors do not need an account. Admin, manager, and staff users are
internal CRM users. A customer portal is planned for a future phase.

Default demo workspace:

```text
Name: Advisora Demo Workspace
Slug: advisora-demo
```

The public consultation form creates requests under the workspace configured by
`DEFAULT_ORGANIZATION_SLUG`, which defaults to `advisora-demo`. Public
workspace signup is available only when the backend has
`WORKSPACE_SIGNUP_ENABLED=true`. Invitations, billing, workspace switching,
workspace-specific public intake pages, and customer portal accounts are not
part of this step.

Intentional portfolio staging demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin.demo@advisora.test` | `Advisora-Demo-Admin-2026!` |
| Manager | `manager.demo@advisora.test` | `Advisora-Demo-Manager-2026!` |
| Staff | `staff.demo@advisora.test` | `Advisora-Demo-Staff-2026!` |

These credentials are intentionally fictional portfolio demo credentials. Do
not use them for real users, real customer data, or long-lived public staging.
Prefer manager or staff access for public review, and share admin access
privately only.

Legacy local account from `npm run seed`:

```text
Email: admin@advisora.demo
Password: password123
Role: ADMIN
```

This account is for local legacy portfolio review only. `npm run seed:demo`
disables it when present to reduce dependence on the known `password123`
credential.

Populate demo data after migrations:

```bash
cd server
npm run prisma:deploy
DEMO_SEED_ENABLED=true npm run seed:demo
```

For local PowerShell:

```powershell
cd server
$env:DEMO_SEED_ENABLED = "true"
npm run seed:demo
```

Do not run destructive reset commands against staging. The demo seed upserts
fixed fictional records into `Advisora Demo Workspace` and does not seed
physical document files.

## Tenant Isolation QA

Step 22.5 adds a second manually seeded workspace for tenant-isolation checks:

```text
Name: Northstar Legal Workspace
Slug: northstar-legal
```

This is not public workspace signup and does not add invitations, billing,
customer portal access, or a workspace switcher. It is a QA seed only.

Run after the main demo seed:

```bash
cd server
SECOND_WORKSPACE_SEED_ENABLED=true npm run seed:second-workspace
npm run verify:tenant-isolation
```

For local PowerShell:

```powershell
cd server
$env:SECOND_WORKSPACE_SEED_ENABLED = "true"
npm run seed:second-workspace
Remove-Item Env:SECOND_WORKSPACE_SEED_ENABLED
npm run verify:tenant-isolation
```

Northstar fictional demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin.demo@northstar.test` | `Northstar-Demo-Admin-2026!` |
| Manager | `manager.demo@northstar.test` | `Northstar-Demo-Manager-2026!` |
| Staff | `staff.demo@northstar.test` | `Northstar-Demo-Staff-2026!` |

Manual isolation checklist:

- Login as `admin.demo@advisora.test`.
- Confirm the topbar shows `Advisora Demo Workspace`.
- Confirm Dashboard, Team Members, Customers, Consultation Requests, Cases,
  Appointments, Tasks, and Reports show Advisora data only.
- Confirm Northstar users and customers do not appear.
- Logout.
- Login as `admin.demo@northstar.test`.
- Confirm the topbar shows `Northstar Legal Workspace`.
- Confirm Dashboard, Team Members, Customers, Consultation Requests, Cases,
  Appointments, Tasks, and Reports show Northstar data only.
- Confirm Advisora users and customers do not appear.
- Logout.
- Submit a public consultation request and confirm it still lands in
  `DEFAULT_ORGANIZATION_SLUG`, which defaults to `advisora-demo`.

The second workspace seed is idempotent and does not seed physical document
files. Upload tiny fictional files manually only if document smoke testing is
needed, then delete them and confirm they are not staged in Git.

## Workspace Signup Demo

Step 23 adds `/workspace-signup` for controlled local or staging onboarding.
Before testing, enable the backend flag outside the repository:

```powershell
$env:WORKSPACE_SIGNUP_ENABLED = "true"
```

Use fictional data such as:

```text
Workspace name: Acme Advisory Workspace
Owner full name: Acme Demo Owner
Owner email: owner.demo@acme.test
Password: Acme-Demo-Owner-2026!
```

Expected result:

- The frontend calls `POST /api/workspaces/signup`.
- A new workspace is created with a normalized slug such as
  `acme-advisory-workspace`.
- The owner user is created as `ADMIN`.
- The frontend stores the returned access token like the existing login flow.
- The browser redirects to `/admin/dashboard`.
- Dashboard, Customers, Cases, Tasks, Appointments, Documents, Reports, and
  Team Members load without crashing on an empty workspace.
- Team Members shows the owner user.
- Advisora and Northstar customers/cases are not visible.

The public consultation form still creates requests under
`DEFAULT_ORGANIZATION_SLUG`; it does not route to the newly signed-up
workspace.

## Recommended Demo Order

1. README overview.
2. Public homepage.
3. Public services.
4. Public consultation form.
5. Admin login.
6. Dashboard.
7. Customers.
8. Consultation Requests.
9. Cases.
10. Appointments.
11. Tasks.
12. Team Members.
13. Documents.
14. Reports.
15. Production readiness docs.

## Public Website Demo

Show:

- `/`
- `/services`
- A service detail page.
- `/projects`
- `/news`
- A news detail page.
- `/contact`
- `/consultation`
- `/appointment`

Talk track:

- The public website introduces the fictional consulting brand.
- Services, projects, and news are typed local content in this phase.
- The consultation form submits to the backend public consultation API.
- Submitted consultation requests are assigned to the default demo workspace
  by the backend.
- The contact and appointment forms currently demonstrate validation and UI
  states only; backend intake for those public forms remains future work.
- The layout should be checked at mobile, tablet, and desktop widths before a
  staging demo.

Public demo flow:

1. Open the homepage.
2. View services.
3. Submit a fictional consultation request.

## Admin Login Demo

Open:

- `/admin/login`

Show:

- Invalid login error.
- Valid demo login with admin, manager, or staff credentials.
- Refreshing a protected route keeps or restores the session.
- Logging out clears the local session.
- Opening a protected admin URL without a token redirects to login.

Admin demo flow:

1. Login with the demo admin only when admin access is appropriate.
2. View dashboard metrics and recent activity.
3. Check consultation requests.
4. Open cases and inspect status coverage.
5. Manage internal team members.
6. Check tasks, appointments, documents, and reports.

## Dashboard Demo

Open:

- `/admin/dashboard`

Show:

- Overview metrics.
- Case status distribution.
- Upcoming deadlines.
- Recent activities.

Note: dashboard calls are real API calls. Local latency can vary when the Neon
database is cold or the network is slow.

## Customers Demo

Open:

- `/admin/customers`

Show:

- List, search, and pagination.
- Create a fictional customer.
- Edit the customer.
- Delete the QA customer if it has no related cases, appointments, or
  documents.

## Consultation Requests Demo

Open:

- `/admin/consultation-requests`

Show:

- Requests created from the public consultation API.
- Search and filter controls.
- Detail view.
- Status update from `NEW` to `CONTACTED` or `CLOSED`.

## Cases Demo

Open:

- `/admin/cases`

Show:

- Create a case for a fictional customer.
- Assign a staff member.
- Edit basic information.
- Move through a valid status transition.
- Review case history.
- Check overdue case filtering.
- Delete the QA case only after related documents, tasks, and appointments are
  deleted.

## Appointments Demo

Open:

- `/admin/appointments`

Show:

- List and filters.
- Today appointments.
- Create an internal appointment.
- Edit details.
- Move status through a valid transition.
- Delete the QA appointment if allowed by workflow rules.

## Tasks Demo

Open:

- `/admin/tasks`

Show:

- List and filters.
- Overdue tasks.
- Create a task.
- Edit details.
- Move status from `TODO` to `IN_PROGRESS`.
- Delete the QA task if allowed by workflow rules.

## Team Members Demo

Open:

- `/admin/users`

Show:

- Admin-only access to internal CRM users.
- Search, role filter, active/inactive filter, and pagination.
- Create a fictional staff user.
- Edit full name, phone, avatar URL, role, and active status.
- Reset a temporary password without exposing `passwordHash`.
- Deactivate and reactivate the QA user.
- Confirm Manager and Staff accounts do not see the Team Members sidebar item.
- Confirm direct access to `/admin/users` redirects or shows forbidden behavior
  for Manager and Staff users.

Talk track:

- User management is for internal `ADMIN`, `MANAGER`, and `STAFF` accounts
  only, and team members belong to the current workspace.
- Public visitors do not need accounts.
- Customer accounts and a customer portal remain future roadmap scope.
- Workspace signup creates the first owner administrator only; invitations and
  customer portal accounts remain future roadmap scope.
- Deactivation is used instead of hard delete so historical assignments remain
  intact.

## Documents Demo

Open:

- `/admin/documents`

Show:

- Upload a small fictional PDF or image.
- View detail metadata.
- Download through the protected download endpoint.
- Delete the QA document.
- Confirm local upload files are ignored by Git.

Do not upload real identity documents or customer files.

## Reports Demo

Open:

- `/admin/reports`

Show:

- Overview summary.
- Cases by status.
- Cases by month.
- Date range filter.
- Invalid date range validation.
- Upcoming deadlines selector.
- Staff performance for admin/manager.
- Recent activities.

## Production Readiness Docs Demo

Review:

- [Production Readiness](production-readiness.md)
- [Deployment Guide](deployment-guide.md)
- [Final QA Checklist](final-qa-checklist.md)

Talk track:

- Staging deployment uses real provider settings kept outside the repository.
- Production deployment has not happened yet.
- Environment variables are documented with placeholders only.
- `DATABASE_URL`, JWT secrets, tokens, `.env`, and uploaded files must never be
  committed.
- `CLIENT_URL` supports a comma-separated CORS allowlist.
- `VITE_API_BASE_URL` must point to the deployed backend API base URL.
- `GET /api/health` is a liveness check, not database readiness.
- If Render `JWT_SECRET` is rotated after a screenshot or accidental exposure,
  all existing tokens become invalid and users must log in again.

## Known Limitations To Mention Honestly

- Staging URLs and provider credentials are not committed.
- No real production deployment yet.
- Local disk uploads are development-only.
- Access tokens are stored in browser local storage for the portfolio demo.
- Contact and appointment public forms validate locally but do not create
  backend records yet.
- Public consultation requests map to one configured default workspace until
  workspace-specific public portals or custom-domain routing exists.
- No request-to-customer conversion workflow yet.
- No customer portal yet.
- No OCR, malware scanning, or private object storage yet.
- No public CMS APIs for news/projects yet.
- No report exports yet.
- No realtime updates yet.
- No production rate limiting, captcha, centralized monitoring, or alerting yet.
- No automated end-to-end test suite yet.

## Local QA Result

Step 18A local smoke testing covered:

- Backend health.
- Invalid and valid admin login.
- Protected API rejection without a token.
- Public consultation create.
- Customer create, edit, search, and cleanup.
- Consultation request list, detail, status update, and cleanup.
- Case create, edit, status update, assignment/history, overdue list, and
  cleanup.
- Appointment create, edit, status update, today list, and cleanup.
- Task create, edit, status update, overdue list, and cleanup.
- Document upload, detail, download, and cleanup.
- Reports endpoints and invalid date range validation.

Browser visual screenshot checks were not completed in this environment because
the in-app browser connector was unavailable. Run a visual pass before staging.

## Reset And Cleanup

For a disposable local database:

```bash
cd server
npm run prisma:reset
npm run seed
```

For staging demo refreshes, prefer the non-destructive demo seed:

```bash
cd server
DEMO_SEED_ENABLED=true npm run seed:demo
```

Before committing:

- Run `git status --short`.
- Confirm `.env` files are not staged.
- Confirm upload files are not staged.
- Confirm no tokens, database URLs, or secrets appear in docs or logs.
