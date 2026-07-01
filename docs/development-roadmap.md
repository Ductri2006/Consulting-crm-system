# Development Roadmap

This document describes the planned delivery path for the Consulting CRM System, from repository foundation to a deployed portfolio project. Phase 1 is documentation-only: frontend and backend implementation begins in later phases.

## Delivery Principles

- Complete each phase's expected result before starting work that depends on it.
- Keep the API contract, database design, and user-facing workflows synchronized.
- Add validation, authorization, error handling, and tests alongside each backend module.
- Build public pages with mock data first, then replace mocks with API integrations.
- Keep secrets and environment-specific configuration outside source control.
- Treat accessibility, responsive behavior, security, and auditability as cross-cutting requirements.

## Phase 1: Project Foundation and Documentation

**Goal:** Prepare the repository, documentation, and project structure.

**Tasks:**

- Create the GitHub repository.
- Create the `client`, `server`, and `docs` folders.
- Add `.gitignore`.
- Add `.editorconfig`.
- Write the portfolio README.
- Analyze functional and non-functional requirements.
- Define the main system modules.
- Plan the database schema and entity relationships.
- Plan REST API endpoints.
- Write the development roadmap.

**Expected result:**

- The repository has a professional, implementation-ready structure.
- The GitHub README clearly communicates the project purpose and scope.
- Requirements, modules, database entities, API contracts, and delivery phases are documented before implementation.

## Phase 2: Frontend Public Website

**Goal:** Build the responsive, public-facing business website using mock data.

**Tech stack:**

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router

**Pages:**

- Homepage
- About page
- Services page
- Service detail page
- Projects page
- News page
- News detail page
- Contact page
- Consultation request page
- Appointment request page

**Main components:**

- Header
- Footer
- Hero section
- Service card
- Project card
- News card
- Contact form
- Consultation form
- Appointment form
- Section title
- Button
- Container
- Responsive navbar

**Tasks:**

- Set up React with Vite and TypeScript.
- Set up Tailwind CSS and shared design tokens.
- Configure routing and public layouts.
- Create reusable UI and form components.
- Create typed mock data for services, projects, and news.
- Build the homepage and informational pages.
- Build service, project, and news listing/detail pages.
- Build contact, consultation, and appointment form interfaces.
- Add client-side form validation and clear submission states.
- Make all pages responsive and keyboard accessible.
- Add basic SEO metadata and semantic page structure.

**Expected result:**

- The public website is clean, responsive, accessible, and navigable.
- Forms validate and display data on the frontend.
- Public content uses mock data until backend APIs are available.

## Phase 3: Backend Foundation

**Goal:** Establish a reliable backend and database development environment.

**Tech stack:**

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL

**Tasks:**

- Initialize the Node.js project.
- Configure TypeScript and development scripts.
- Set up the Express server and API routing structure.
- Define and validate environment variables.
- Set up Prisma and the PostgreSQL connection.
- Implement the documented Prisma schema.
- Run the initial database migration.
- Seed representative services, users, customers, and workflow data.
- Create a global error handler.
- Create standardized response and pagination helpers.
- Create request validation helpers.
- Add request logging and baseline security middleware.
- Establish unit and integration test conventions.

**Expected result:**

- The backend server runs locally and exposes a health check.
- The PostgreSQL connection and Prisma client work.
- The initial schema, migrations, and seed data are reproducible.
- API responses, validation, and errors follow shared conventions.

## Phase 4: Authentication, Authorization, and Users

**Goal:** Implement secure staff authentication, role-based access control, and user administration.

**Tasks:**

- Implement the `User` model and seed an initial administrator.
- Hash passwords with bcrypt.
- Build the login, logout, and current-user APIs.
- Issue and verify JWT access tokens.
- Create authentication middleware.
- Create role-based authorization middleware for `ADMIN`, `MANAGER`, and `STAFF`.
- Build user list, detail, create, update, disable, and guarded delete APIs.
- Prevent inactive users from authenticating.
- Protect internal API routes.
- Ensure passwords and password hashes are never returned.
- Add authentication and permission tests.

**Expected result:**

- Administrators, managers, and staff can log in.
- Protected APIs require valid authentication.
- Permission checks are enforced by the backend.
- Administrators can manage internal user accounts without breaking historical records.

## Phase 5: Customer, Service, Reception, and Public Content APIs

**Goal:** Deliver the data APIs needed by the public website and the first CRM workflows.

**Tasks:**

- Build Customer CRUD APIs.
- Build Service CRUD APIs and the public active-service endpoint.
- Build public consultation-request submission.
- Build consultation-request list, detail, status, and conversion APIs.
- Build News CRUD and published news list/detail APIs.
- Build Project Gallery CRUD and published project list/detail APIs.
- Add search, filtering, sorting, and pagination where documented.
- Validate contact data, slugs, statuses, and related entity identifiers.
- Add consistent error handling and authorization.
- Record important administrative changes in activity logs.
- Integrate the public services, projects, news, and consultation forms with their APIs.
- Add API integration tests for public and protected routes.

**Expected result:**

- Staff can manage customers and process consultation requests.
- Services are shared by the public website, requests, and case profiles.
- Published services, news, and project gallery items are available to public pages.
- A consultation request can be converted safely into a customer or case workflow.

## Phase 6: Case Profile Management

**Goal:** Implement the core consulting case workflow.

**Tasks:**

- Build Case Profile CRUD APIs.
- Generate unique case codes.
- Assign a customer and service to each case.
- Assign or reassign staff.
- Implement the documented case status workflow.
- Record every status change in case history.
- Filter cases by status, priority, service, and assigned staff.
- Search by case code, customer, or service.
- Detect and list overdue cases.
- Enforce assignment-aware staff access.
- Prevent unsafe deletion when related history or records must be retained.
- Integrate case list and detail data contracts for the future dashboard UI.
- Add workflow, authorization, and overdue-case tests.

**Expected result:**

- Staff can create and manage consulting case profiles.
- Case assignment and status transitions are functional.
- Case history provides a traceable record of workflow changes.
- Managers can identify high-priority and overdue work.

## Phase 7: Appointment and Task Management

**Goal:** Implement scheduling and internal work assignment.

**Tasks:**

- Build the public appointment-request endpoint.
- Match or create a customer when a public appointment is submitted.
- Build internal Appointment CRUD APIs.
- Confirm, complete, cancel, and reschedule appointments.
- Filter appointments by date, status, staff, and customer.
- Build Task CRUD APIs.
- Assign tasks to staff and link tasks to case profiles.
- Record the task creator from the authenticated session.
- Update task status and priority.
- Detect overdue tasks.
- Apply role and assignment permissions.
- Integrate the public appointment form with the API.
- Add scheduling, task workflow, and authorization tests.

**Expected result:**

- Visitors can request appointments without an internal account.
- Staff can manage appointments.
- Managers can assign and monitor tasks.
- Tasks can be linked to case profiles and tracked to completion.

## Phase 8: Document Management

**Goal:** Implement secure file upload and document metadata management.

**Tasks:**

- Set up file-upload middleware.
- Define allowed MIME types and document categories.
- Validate file type and file size.
- Upload documents through `multipart/form-data`.
- Store document metadata.
- Record the authenticated uploader.
- Attach documents to a customer, case profile, or both.
- List and filter documents.
- Enforce document access permissions.
- Delete or archive stored files and metadata consistently.
- Add upload validation and access-control tests.

**Expected result:**

- Authorized staff can upload and manage customer documents.
- Documents are linked to the correct customers and cases.
- Invalid or unauthorized uploads are rejected safely.

## Phase 9: Admin Dashboard Frontend

**Goal:** Build the internal CRM interface and connect it to the protected APIs.

**Pages:**

- Login page
- Dashboard overview
- Customer management
- Customer detail
- Consultation request management
- Case profile management
- Case detail
- Appointment management
- Task management
- Document management
- Service management
- News management
- Project gallery management
- User management
- Reports
- Activity logs

**Main components:**

- Sidebar
- Topbar
- Dashboard card
- Data table
- Filter bar
- Search input
- Form modal
- Status badge
- Priority badge
- Pagination
- Chart card

**Tasks:**

- Build authentication state and protected routes.
- Build a role-aware dashboard layout and navigation.
- Create reusable tables, filters, forms, badges, modals, and pagination.
- Connect customer, service, request, case, appointment, task, document, content, and user screens to APIs.
- Add loading, empty, success, and error states.
- Enforce UI-level permission visibility while retaining backend enforcement.
- Make the dashboard usable on desktop and tablet layouts.
- Add frontend component and critical-flow tests.

**Expected result:**

- Internal users can manage CRM data through a consistent UI.
- The dashboard is responsive, role-aware, and easy to navigate.
- All completed backend modules have a usable administrative interface.

## Phase 10: Dashboard, Reports, and Activity Logs

**Goal:** Provide operational visibility for managers and administrators.

**Tasks:**

- Build overview statistics.
- Build cases-by-status aggregation and chart.
- Build cases-by-month aggregation and chart.
- Build staff performance reports.
- Show today's appointments.
- Show overdue cases and upcoming deadlines.
- Capture important user actions in `ActivityLog`.
- Build the filtered, read-only activity log API and page.
- Show recent activities on the dashboard.
- Verify report results against source records and role permissions.
- Add aggregation and access-control tests.

**Expected result:**

- Managers and administrators can monitor workload and business performance.
- Upcoming deadlines and overdue cases are visible.
- Important internal actions are auditable.

## Phase 11: Deployment and Portfolio Release

**Goal:** Deploy a secure, demonstrable fullstack release.

**Tasks:**

- Run production builds, automated tests, and migration checks.
- Deploy the frontend to Vercel.
- Deploy the backend to Render or Railway.
- Deploy PostgreSQL to Supabase or Neon.
- Configure production environment variables and CORS.
- Configure persistent file storage before enabling production uploads.
- Apply production migrations and safe seed data.
- Verify authentication, public forms, core CRM flows, and responsive layouts.
- Add live demo links and setup instructions to the README.
- Add screenshots to the README.
- Document demo credentials without exposing production secrets.

**Expected result:**

- The project has a stable public demo.
- The deployed frontend, backend, database, and file storage work together.
- The GitHub repository is portfolio-ready.

## Phase 12: Advanced Features

**Goal:** Extend the product after the MVP is stable.

**Possible features:**

- Customer portal and customer authentication
- Request and case progress tracking
- Email notifications
- SMS notifications
- OCR for identity documents
- Cloud file storage and document versioning
- Advanced analytics
- Multi-branch support
- Multi-language support
- Enhanced audit-log retention, search, and export
- Export reports to Excel or PDF

## API Delivery Map

| API area | Planned phase |
| --- | --- |
| Authentication and users | Phase 4 |
| Customers and services | Phase 5 |
| Consultation requests | Phase 5 |
| News and project gallery | Phase 5 |
| Case profiles and case history | Phase 6 |
| Appointments and tasks | Phase 7 |
| Documents | Phase 8 |
| Dashboard reports and activity logs | Phase 10 |

## MVP Completion Criteria

The first deployable MVP is complete when:

- The public website can load published content and submit consultation and appointment requests.
- Authenticated internal users can manage customers, cases, appointments, tasks, and documents according to their roles.
- Case status changes are recorded and overdue work is visible.
- Managers and administrators can view dashboard statistics, reports, and activity logs.
- Critical API and UI flows are tested.
- The project is deployed with documented setup, demo access, and screenshots.
