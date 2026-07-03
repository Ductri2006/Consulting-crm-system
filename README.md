# Consulting CRM System

> A portfolio fullstack project that combines a public consulting website with an internal customer relationship management platform.

## Introduction

Consulting CRM System is a planned fullstack web application for consulting businesses. It brings together a public-facing business website and an internal CRM dashboard for managing customers, consultation requests, case profiles, appointments, tasks, documents, users, and business reports.

The project models the day-to-day operations of a consulting organization working across real estate, legal, investment, and construction consulting. This repository is also a portfolio project for practicing fullstack development, business requirement analysis, database design, backend API planning, frontend UI architecture, and system documentation.

## Project Purpose

The purpose of this project is to simulate a real-world business management system rather than only a landing page or a basic CRUD application. It focuses on a complete operational workflow:

1. A customer visits the public website.
2. The customer submits a consultation request or books an appointment.
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
- Contact message submission
- Appointment booking
- Optional file attachments
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

- User management
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

- Manage users and permissions
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
| Content Management | Manages public services, news, and project gallery content |
| Dashboard and Reporting | Summarizes workload, performance, appointments, and deadlines |
| Activity Logging | Records important user actions for traceability |

For a detailed breakdown, see [System Module Breakdown](docs/module-breakdown.md).

## Case Workflow

A consulting case profile follows this planned workflow:

```text
Received → Verifying → Proposing Solution → Processing → Completed
    └──────────────────────────────────────────────────→ Cancelled
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
├── client/
│   ├── src/
│   └── README.md
├── server/
│   ├── prisma/
│   ├── src/
│   └── README.md
├── docs/
│   ├── requirement-analysis.md
│   ├── module-breakdown.md
│   ├── database-design.md
│   ├── api-documentation.md
│   ├── development-roadmap.md
│   ├── production-readiness.md
│   ├── deployment-guide.md
│   └── final-qa-checklist.md
├── .gitignore
└── README.md
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
| [Final QA Checklist](docs/final-qa-checklist.md) | Manual QA checklist for public pages, admin CRM modules, security, and production smoke testing |

## Production And QA Preparation

Phase 17 adds production-readiness documentation and final QA preparation
without performing a real production deployment. Before deploying, review:

- [Production Readiness](docs/production-readiness.md)
- [Deployment Guide](docs/deployment-guide.md)
- [Final QA Checklist](docs/final-qa-checklist.md)

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

The public pages use typed local content. The admin dashboard requires the
backend at `http://localhost:5000` and reads its API base URL from
`VITE_API_BASE_URL`.

## Admin Pages

- `/admin/dashboard`
- `/admin/customers`
- `/admin/consultation-requests`
- `/admin/cases`
- `/admin/appointments`
- `/admin/tasks`
- `/admin/documents`
- `/admin/reports`

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

1. **Project foundation and documentation** — repository structure, requirements, data model, API plan, and roadmap
2. **Public website** — responsive pages, reusable components, and customer-facing forms
3. **Backend foundation** — Express, TypeScript, Prisma, PostgreSQL, validation, and error handling
4. **Authentication and authorization** — JWT authentication and role-based access control
5. **Core CRM APIs** — customers, services, case profiles, appointments, tasks, and documents
6. **Admin dashboard** — operational interfaces for staff, managers, and administrators
7. **Reporting and deployment** — dashboards, production infrastructure, and portfolio presentation
8. **Advanced features** — customer portal, notifications, OCR, analytics, and multi-branch support

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
- [ ] Production deployment
- [ ] Portfolio polish

## Repository Status

**Current phase:** Phase 17 complete - Production readiness and final QA preparation

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
performance is available only to administrators and managers. Admin pages are
route-lazy-loaded for better bundle splitting. Phase 17 adds production
readiness documentation, a provider-neutral deployment guide, final QA
checklists, CORS production guidance, environment-variable guidance, and file
upload/storage warnings. Real production deployment and portfolio polish remain
future phases.
