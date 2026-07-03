# Demo Walkthrough

This walkthrough is the recommended local portfolio demo script for the
Consulting CRM System. It is designed for local review before staging
deployment, not for real production use.

## Project Overview

Consulting CRM System is a fullstack portfolio project for a fictional
consulting brand, Advisora. It combines:

- A public consulting website.
- A protected admin CRM workspace.
- A Node/Express API.
- Prisma with PostgreSQL.
- Admin workflows for customers, consultation requests, cases, appointments,
  tasks, documents, dashboards, and reports.

Demo rule: use local/demo data only. Do not use real customer information, real
deployment URLs, database connection strings, access tokens, or production
credentials.

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

Local URLs:

- Public website: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

Local demo account:

```text
Email: admin@advisora.demo
Password: password123
Role: ADMIN
```

This account is for local portfolio review only. Rotate or replace it before
staging or production.

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
12. Documents.
13. Reports.
14. Production readiness docs.

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
- The contact and appointment forms currently demonstrate validation and UI
  states only; backend intake for those public forms remains future work.
- The layout should be checked at mobile, tablet, and desktop widths before a
  staging demo.

## Admin Login Demo

Open:

- `/admin/login`

Show:

- Invalid login error.
- Valid local demo login.
- Refreshing a protected route keeps or restores the session.
- Logging out clears the local session.
- Opening a protected admin URL without a token redirects to login.

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

- Production deployment has not happened yet.
- Environment variables are documented with placeholders only.
- `DATABASE_URL`, JWT secrets, tokens, `.env`, and uploaded files must never be
  committed.
- `CLIENT_URL` supports a comma-separated CORS allowlist.
- `VITE_API_BASE_URL` must point to the deployed backend API base URL.
- `GET /api/health` is a liveness check, not database readiness.

## Known Limitations To Mention Honestly

- No real staging or production deployment yet.
- Local disk uploads are development-only.
- Access tokens are stored in browser local storage for the portfolio demo.
- Contact and appointment public forms validate locally but do not create
  backend records yet.
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

Before committing:

- Run `git status --short`.
- Confirm `.env` files are not staged.
- Confirm upload files are not staged.
- Confirm no tokens, database URLs, or secrets appear in docs or logs.
