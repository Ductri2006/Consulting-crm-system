# Consulting CRM System

> A portfolio fullstack project that combines a public consulting website with an internal customer relationship management platform.

## Introduction

Consulting CRM System is a fullstack portfolio application for consulting
business operations. It combines a public-facing consulting website with a
protected internal CRM dashboard for managing customers, consultation requests,
case profiles, appointments, tasks, documents, users, dashboards, and reports.
The backend now includes an Organization model used as the internal Workspace
tenant boundary; the current staging/demo path uses a single default workspace.

The project models the day-to-day operations of a consulting organization working across real estate, legal, investment, and construction consulting. This repository is also a portfolio project for practicing fullstack development, business requirement analysis, database design, backend API planning, frontend UI architecture, and system documentation.

## Project Purpose

The purpose of this project is to simulate a real-world business management system rather than only a landing page or a basic CRUD application. It focuses on a complete operational workflow:

1. A customer visits the public website.
2. The customer submits a consultation request or reviews contact and
   appointment request flows.
3. Internal staff receive and review the request.
4. A customer record and consulting case profile are created.
5. The case follows a defined business workflow.
6. Staff update the case status, upload documents, create tasks, and track progress.
7. Managers and administrators monitor operations through dashboards and reports.

## Problem Statement

Consulting businesses often need more than a company website. They also require an internal system to coordinate:

- Customer information
- Consultation requests
- Case documents
- Appointment schedules
- Staff tasks
- Case progress
- Business reports
- Internal workflows

This project addresses that need with a centralized platform that connects public customer engagement to internal case management.

## Main Features

### Public Website

- Homepage
- Business introduction
- Service introduction
- Project gallery
- News section
- Contact page
- Consultation request form
- Appointment request form
- Responsive layouts for desktop, tablet, and mobile
- Basic SEO-friendly structure

### Customer Reception

- Online consultation request submission
- Contact form validation flow
- Appointment request validation flow
- Admin document upload after a customer or case exists
- Confirmation after a successful submission
- Request status tracking in a future customer portal

### CRM Management

- Customer and customer profile management
- Customer working-history tracking
- Appointment management
- Case progress tracking
- Search and filtering
- Detailed customer views

### Case Profile Management

- Create consulting case profiles
- Assign staff to cases
- Update case status and priority
- Track a defined case workflow
- Store case history
- Manage case documents
- Detect upcoming and overdue deadlines

### Internal Management

- Internal user management for Admin, Manager, and Staff accounts
- Role-based access control
- Task creation and assignment
- Daily, weekly, and monthly reports
- Staff performance tracking
- User activity logs

### Document Management

- Upload customer documents
- Attach documents to customers and case profiles
- Store digital record metadata
- Manage document access permissions
- Support OCR for identity documents in a future version

### Dashboard and Reports

- Total customer and case counts
- Cases grouped by status
- Upcoming and overdue cases
- Today's appointments
- Monthly operational reports
- Staff performance reports
- Recent system activity

## User Roles

### Admin

Administrators have full system access. They can:

- Manage internal team members, roles, activation status, and password resets
- Manage customers and all case profiles
- Manage services, appointments, tasks, and documents
- View reports and activity logs
- Configure system settings

### Manager

Managers monitor operations and coordinate staff. They can:

- View the operational dashboard
- Monitor assigned staff
- Assign and review tasks
- View case progress
- View reports
- Track staff performance

### Staff

Staff members work with assigned customers and case profiles. They can:

- View assigned customers and cases
- Update case statuses
- Upload documents
- Add working notes
- Manage assigned appointments
- Complete assigned tasks

### Customer

A customer account is planned for a future version. It may allow customers to:

- View their personal profile
- Track submitted requests and case progress
- Upload required documents
- View appointment schedules

## System Modules

The platform is divided into the following functional modules:

| Module | Responsibility |
| --- | --- |
| Public Website | Presents the business, services, projects, news, and contact information |
| Customer Reception | Captures consultation, contact, and appointment requests |
| Authentication and Authorization | Secures internal access and enforces role-based permissions |
| Customer Management | Maintains customer profiles, sources, notes, and working history |
| Case Profile Management | Coordinates consulting cases, assignments, status, priority, and deadlines |
| Appointment Management | Schedules, confirms, reschedules, and tracks consultations |
| Task Management | Assigns operational work and tracks progress and deadlines |
| Document Management | Stores metadata and links files to customers and cases |
| User Management | Maintains staff accounts, roles, and active status |
| Organization Workspace | Scopes internal users and CRM business data by workspace |
| Public Content Catalog | Uses typed local content for services, news, and project gallery pages |
| Dashboard and Reporting | Summarizes workload, performance, appointments, and deadlines |
| Activity Logging | Records important user actions for traceability |

For a detailed breakdown, see [System Module Breakdown](docs/module-breakdown.md).

## Case Workflow

A consulting case profile follows this workflow:

```text
Received -> Verifying -> Proposing Solution -> Processing -> Completed
     \--------------------------------------------------------------> Cancelled
```

Each case profile stores:

- Case code
- Customer information
- Service type
- Assigned staff member
- Current status
- Priority
- Deadline and completion date
- Notes
- Attached documents
- Case history

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Hook Form
- Zod

### Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication
- bcrypt password hashing
- Multer file uploads

### Deployment

- Frontend: static hosting for the Vite build output
- Backend: Node-compatible runtime for the Express API
- Database: Neon PostgreSQL or another managed PostgreSQL provider
- File storage: private persistent object storage in a later production phase

## Project Structure

```text
consulting-crm-system/
|-- client/
|   |-- src/
|   |-- vercel.json
|   `-- README.md
|-- server/
|   |-- prisma/
|   |-- src/
|   `-- README.md
|-- docs/
|   |-- requirement-analysis.md
|   |-- module-breakdown.md
|   |-- database-design.md
|   |-- api-documentation.md
|   |-- development-roadmap.md
|   |-- production-readiness.md
|   |-- deployment-guide.md
|   |-- staging-deployment-checklist.md
|   |-- vercel-render-staging-guide.md
|   |-- final-qa-checklist.md
|   `-- demo-walkthrough.md
|-- .gitignore
`-- README.md
```

## Documentation

| Document | Description |
| --- | --- |
| [Requirement Analysis](docs/requirement-analysis.md) | Business context, actors, functional requirements, workflows, and constraints |
| [System Module Breakdown](docs/module-breakdown.md) | Scope and responsibilities of each public and internal module |
| [Database Design](docs/database-design.md) | Planned entities, relationships, enums, indexes, and initial Prisma schema |
| [API Documentation](docs/api-documentation.md) | Planned REST resources, endpoints, payloads, and response conventions |
| [Development Roadmap](docs/development-roadmap.md) | Phased delivery plan from project foundation to advanced features |
| [Production Readiness](docs/production-readiness.md) | Production readiness status, environment guidance, security checklist, and known limitations |
| [Deployment Guide](docs/deployment-guide.md) | Provider-neutral deployment architecture, commands, environment variables, and smoke checks |
| [Staging Deployment Checklist](docs/staging-deployment-checklist.md) | Provider-neutral staging environment matrix, deployment checklist, smoke tests, rollback, and go/no-go criteria |
| [Vercel + Render Staging Guide](docs/vercel-render-staging-guide.md) | Provider-specific staging runbook for Vercel frontend, Render backend, and Neon database |
| [Final QA Checklist](docs/final-qa-checklist.md) | Manual QA checklist for public pages, admin CRM modules, security, and production smoke testing |
| [Demo Walkthrough](docs/demo-walkthrough.md) | Suggested portfolio demo flow, local QA notes, and honest limitations |

## Production And QA Preparation

Phase 20 adds staging demo data, safer portfolio demo accounts, and staging
hardening notes for the Vercel + Render + Neon path. Real provider URLs and
credentials stay outside the repository. Before demoing, staging, or deploying,
review:

- [Production Readiness](docs/production-readiness.md)
- [Deployment Guide](docs/deployment-guide.md)
- [Staging Deployment Checklist](docs/staging-deployment-checklist.md)
- [Vercel + Render Staging Guide](docs/vercel-render-staging-guide.md)
- [Final QA Checklist](docs/final-qa-checklist.md)
- [Demo Walkthrough](docs/demo-walkthrough.md)

Use the staging checklist to record a deployment run and go/no-go decision. Use
the final QA checklist for full functional verification after staging is
reachable.

## Portfolio Demo

Staging URL placeholders:

- Public staging website: `https://<project-name>.vercel.app`
- Staging backend API: `https://<render-service-name>.onrender.com/api`
- Health check: `https://<render-service-name>.onrender.com/api/health`

Local URLs:

- Public website: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

Public visitors do not need an account. Admin, manager, and staff accounts are
internal CRM users for the protected workspace. A customer portal is future
roadmap scope.

Current staging/demo workspace:

```text
Name: Advisora Demo Workspace
Slug: advisora-demo
```

Second tenant-isolation QA workspace:

```text
Name: Northstar Legal Workspace
Slug: northstar-legal
```

The public consultation form maps new requests to the workspace configured by
`DEFAULT_ORGANIZATION_SLUG`, falling back to `advisora-demo`. Workspace signup
creates a new internal CRM workspace only when `WORKSPACE_SIGNUP_ENABLED=true`.
Invitations, billing, workspace switching, workspace-specific public portals,
and customer portal access remain future roadmap scope.

Intentional portfolio demo accounts created by `npm run seed:demo`:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin.demo@advisora.test` | `Advisora-Demo-Admin-2026!` |
| Manager | `manager.demo@advisora.test` | `Advisora-Demo-Manager-2026!` |
| Staff | `staff.demo@advisora.test` | `Advisora-Demo-Staff-2026!` |

These are fictional portfolio credentials, not real secrets. Do not use them
with real customer information. For long-lived public staging, prefer sharing
manager or staff access with reviewers and share admin access privately only.

Legacy local seed account:

```text
Email: admin@advisora.demo
Password: password123
Role: ADMIN
```

The legacy local account is created by `npm run seed` for local development.
The staging demo seed disables it when present to reduce dependence on the
known `password123` credential.

Populate staging demo data only after migrations are applied:

```bash
cd server
npm run prisma:deploy
DEMO_SEED_ENABLED=true npm run seed:demo
```

For local PowerShell runs, use:

```powershell
cd server
$env:DEMO_SEED_ENABLED = "true"
npm run seed:demo
```

The demo seed is idempotent and upserts fictional customers, consultation
requests, cases, appointments, tasks, case history, and activity records. It
also upserts the `Advisora Demo Workspace` and assigns all demo CRM data to
that workspace. It does not reset the database and does not seed physical
document files.

Step 22.5 adds an optional second workspace seed for tenant-isolation QA. It
does not add public workspace signup or a workspace switcher. Run it only
against a local or dedicated staging database after the main demo seed:

```bash
cd server
SECOND_WORKSPACE_SEED_ENABLED=true npm run seed:second-workspace
npm run verify:tenant-isolation
```

For local PowerShell runs, use:

```powershell
cd server
$env:SECOND_WORKSPACE_SEED_ENABLED = "true"
npm run seed:second-workspace
Remove-Item Env:SECOND_WORKSPACE_SEED_ENABLED
npm run verify:tenant-isolation
```

The second workspace seed creates fictional Northstar users, customers, cases,
consultation requests, appointments, tasks, case history, and activity logs. It
is idempotent, does not reset the database, does not delete Advisora demo data,
and does not seed physical document files. Public consultation requests still
map to `DEFAULT_ORGANIZATION_SLUG`.

Step 23 adds public workspace onboarding at `/workspace-signup`, backed by:

```http
POST /api/workspaces/signup
```

The backend enforces `WORKSPACE_SIGNUP_ENABLED=false` by default. Set
`WORKSPACE_SIGNUP_ENABLED=true` only for a local or controlled staging test.
Successful signup creates a new `Organization`, creates the first active
`ADMIN` owner user, signs a JWT with `organizationId`, auto-logs the frontend
in, and redirects to `/admin/dashboard`. The owner email remains globally
unique across all workspaces in this step.

Public consultation requests still map to `DEFAULT_ORGANIZATION_SLUG`; signup
does not create a custom public intake URL for the new workspace.

Use only fictional demo data. Do not paste real customer data, real database
URLs, access tokens, or production credentials into the app, docs, commits, or
screenshots.

Recommended public demo flow:

1. Open the homepage.
2. View services.
3. Submit a fictional consultation request.

Recommended admin demo flow:

1. Login with a demo internal account.
2. View the dashboard.
3. Check consultation requests.
4. Open cases.
5. Manage internal team members from Team Members.
6. Create and revoke a fictional workspace invitation.
7. Check tasks, appointments, documents, and reports.

See [Demo Walkthrough](docs/demo-walkthrough.md) for the full script.

## Screenshots

Screenshots are not committed yet. Suggested portfolio captures:

- Public homepage.
- Admin dashboard.
- Case workflow.
- Document management.
- Reports page.

## Run the Public Website Locally

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Create a production build with:

```bash
npm run build
```

The public pages use typed local content. The admin dashboard and public
consultation form require the backend API. The client reads its API base URL
from `VITE_API_BASE_URL`, which should be `http://localhost:5000/api` for local
development.

## Admin Pages

- `/admin/login`
- `/admin/dashboard`
- `/admin/customers`
- `/admin/consultation-requests`
- `/admin/cases`
- `/admin/appointments`
- `/admin/tasks`
- `/admin/users`
- `/admin/invitations`
- `/admin/documents`
- `/admin/reports`
- `/invite/:token`

## Run the Backend Foundation Locally

```bash
cd server
npm install
cp .env.example .env
npm run prisma:generate
npm run dev
```

The health endpoint is available at `GET /api/health`. See the [backend README](server/README.md) for Windows setup notes, Prisma commands, and the local seed account.

## Development Roadmap

1. **Project foundation and documentation** - repository structure, requirements, data model, API plan, and roadmap
2. **Public website** - responsive pages, reusable components, and customer-facing forms
3. **Backend foundation** - Express, TypeScript, Prisma, PostgreSQL, validation, and error handling
4. **Authentication and authorization** - JWT authentication and role-based access control
5. **Core CRM APIs** - customers, services, case profiles, appointments, tasks, and documents
6. **Admin dashboard** - operational interfaces for staff, managers, and administrators
7. **Reporting and deployment** - dashboards, production infrastructure, and portfolio presentation
8. **Advanced features** - customer portal, notifications, OCR, analytics, and multi-branch support

See the [Development Roadmap](docs/development-roadmap.md) for the complete phase-by-phase plan.

## Future Improvements

- Customer self-service portal
- Email and SMS notifications
- Cloud file storage
- OCR-assisted document processing
- Advanced analytics and configurable reports
- Multi-branch and multi-language support
- Calendar and third-party integrations
- Export to Excel and PDF
- Automated testing and continuous delivery
- Accessibility, security, and performance audits
- Persistent object storage for documents
- HttpOnly cookie authentication
- Login and public-form rate limiting
- Automated end-to-end tests

## Implemented Vs Future

| Area | Current status |
| --- | --- |
| Public website | Implemented with typed local content and responsive routes |
| Public consultation request | Submits to the backend public consultation API |
| Public contact and appointment forms | Validation/demo flows only; backend intake remains future work |
| Admin CRM | Implemented for dashboard, customers, consultation requests, cases, appointments, tasks, internal users, workspace invitations, documents, and reports |
| Backend API | Implemented for auth, workspace signup, workspace invitations, CRM workflows, internal user management, documents, dashboard, and reports |
| Database | Prisma schema, migrations, seed, workspace tenant foundation, and Neon verification completed |
| Organization / Workspace | Implemented as a backend tenant boundary for internal users and CRM business data; public workspace signup is available behind `WORKSPACE_SIGNUP_ENABLED` |
| Workspace invitations | Implemented for admin-created internal `ADMIN`, `MANAGER`, and `STAFF` invitations with hashed one-time tokens |
| Staging deployment preparation | Checklist, environment matrix, smoke tests, rollback, and go/no-go guidance documented |
| Vercel/Render/Neon staging guide | Provider-specific setup, CORS order, smoke tests, and troubleshooting documented |
| Staging demo data | Idempotent fictional demo seed and safer internal demo accounts prepared for portfolio staging |
| Production deployment | Not deployed yet |
| Document storage | Local development storage only; persistent private object storage remains future work |
| Auth hardening | JWT Bearer flow implemented; HttpOnly cookie session strategy remains future work |

## Known Limitations

- No real production deployment has been performed yet.
- Staging deployment uses provider URLs, credentials, and environment variables
  kept outside the repository.
- Staging URLs in this repository remain placeholders by design.
- Local disk uploads are for development only.
- Access tokens are stored in browser local storage for the portfolio demo.
- Contact and appointment public forms validate locally but do not create backend records yet.
- Internal user management and workspace invitations are for CRM team members
  only; customer portal accounts remain future work.
- Workspace signup is gated by `WORKSPACE_SIGNUP_ENABLED` and intended for
  local or controlled staging onboarding tests in this portfolio phase.
- No customer portal, billing, OCR, malware scanning, cloud object storage,
  report exports, realtime updates, production-grade rate limiting, or
  centralized observability yet.

## Learning Goals

This project is designed to practice:

- Fullstack project planning
- Business requirement analysis
- UI and UX structure planning
- REST API design
- Relational database schema design
- Authentication and authorization
- Business workflow modeling
- Dashboard and reporting design
- Technical documentation
- Professional GitHub portfolio presentation

## Current Progress

- [x] Project foundation and documentation
- [x] Frontend public website
- [x] Backend foundation setup
- [x] Authentication and authorization foundation
- [x] Customer, service, and consultation request APIs
- [x] Case profile workflow APIs
- [x] Appointment and task APIs
- [x] Document management APIs
- [x] Dashboard and reporting APIs
- [x] Real database migration and seed verification
- [x] Live Neon PostgreSQL verification
- [x] Admin dashboard frontend foundation
- [x] Admin customers and consultation requests UI
- [x] Admin case management UI
- [x] Assignable users endpoint fix
- [x] Admin appointments and tasks UI
- [x] Admin document management UI
- [x] Admin reports UI
- [x] Route-based bundle optimization
- [x] Production readiness and final QA preparation
- [x] Final local QA and portfolio polish
- [x] Staging deployment preparation
- [x] Vercel/Render/Neon staging deployment guide
- [x] Staging demo data and safer demo accounts
- [x] Internal user management
- [x] Staging deployment
- [x] Organization / Workspace tenant foundation
- [ ] Production deployment

## Repository Status

**Current phase:** Phase 22 complete - Organization / Workspace tenant foundation

The public website and core CRM backend now cover authentication, customers,
services, consultation requests, case workflows, appointments, tasks, and
authenticated local-development document management, plus role-aware dashboard
and reporting APIs. The repository now includes the versioned migration,
idempotent seed, database verification command, and real-database test
documentation.

The committed migrations, idempotent seed, database verification command,
health endpoint, and administrator login have passed against a live Neon
PostgreSQL database. The connection URL remains configured only in the local
`server/.env` file and is not committed. See the
[live database verification record](server/docs/live-database-verification.md)
for the sanitized result.

The frontend now includes the admin login flow, persisted authentication,
protected admin routing, responsive dashboard layout, and dashboard overview
powered by the backend APIs. The first admin management pages add customer
list, search, pagination, create, edit, and delete workflows plus consultation
request list, filtering, details, and status updates. The case management page
adds case search, workflow filters, overdue review, creation, editing, status
transitions, staff assignment, history, and role-aware deletion. Appointment and
task management now cover list filters, pagination, create/edit/status/delete
flows, today appointments, overdue tasks, and role-aware destructive actions.
Document management now covers list/search/filter/pagination, multipart upload,
detail review, protected download, and role-aware deletion. Reports now use the
dashboard/reporting APIs for overview metrics, case status distribution, monthly
case trends, upcoming deadlines, staff performance, and recent activities. Staff
performance is available only to administrators and managers. User management
now lets administrators list, create, edit, activate/deactivate, and reset
passwords for internal CRM users, using deactivation rather than hard delete.
Admin pages are
route-lazy-loaded for better bundle splitting. Phase 17 adds production
readiness documentation, a provider-neutral deployment guide, final QA
checklists, CORS production guidance, environment-variable guidance, and file
upload/storage warnings. Phase 18A adds local smoke-test coverage, README
portfolio polish, and a guided demo walkthrough. Phase 18B adds a
provider-neutral staging deployment checklist with environment-variable matrix,
CORS checks, migration steps, smoke tests, rollback planning, and go/no-go
criteria. Phase 19 adds a Vercel frontend, Render backend, and Neon database
staging runbook plus Vercel SPA rewrite support for route refreshes. Phase 20
adds an idempotent staging demo seed with fictional CRM data, safer demo
accounts for admin/manager/staff review, Render JWT rotation notes, and
portfolio demo guidance. Phase 21 adds internal Team Members management for
administrator-only CRM user administration. Phase 22 adds the Organization /
Workspace tenant foundation: existing data is backfilled to Advisora Demo
Workspace, auth responses include safe workspace info, public consultation
requests map to `DEFAULT_ORGANIZATION_SLUG`, and CRM APIs scope internal users,
customers, requests, cases, appointments, tasks, documents, dashboard, and
reports by `organizationId`. Production deployment remains a future phase.
Step 22.5 adds an optional Northstar Legal Workspace seed and a Prisma-based
tenant-isolation verification script for staging QA.
Step 23 adds public Workspace Signup / Organization Onboarding: a guarded
`POST /api/workspaces/signup` endpoint, a `/workspace-signup` frontend page,
automatic owner admin login, and docs for the signup flag and default public
consultation behavior.
Step 24 adds workspace invitations: admin-only invitation list/create/revoke,
public invite preview and accept, hashed one-time tokens, auto-login after
accept, and `/admin/invitations` plus `/invite/:token` frontend routes.
