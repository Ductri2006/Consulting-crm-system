# Advisora Frontend

The `client` directory contains the responsive public website and the admin
workspace for the Consulting CRM System portfolio project. Advisora is a
fictional consulting brand used for the demonstration interface.
The UI uses the word Workspace for the backend Organization tenant model; the
current demo/staging workspace is `Advisora Demo Workspace`.

## Portfolio Release Summary

The frontend exposes three route surfaces:

- Public website: `/`, `/about`, `/services`, `/projects`, `/news`,
  `/contact`, `/consultation`, `/appointment`, `/workspace-signup`, and
  `/invite/:token`.
- Internal Admin CRM: `/admin/login` plus protected dashboard, customers,
  consultation requests, cases, appointments, tasks, documents, reports,
  activity, users, invitations, and settings routes.
- Customer Portal: `/portal/login` plus protected dashboard, cases, case
  detail, documents, and updates routes.

Admin routes use the internal auth context, `ProtectedRoute`, `AdminLayout`,
and the `consulting_crm_access_token` key. Portal routes use
`PortalProtectedRoute`, `PortalLayout`, the portal API client, and the
`advisora_portal_access_token` key. UI state polish covers loading, empty,
error, retry, responsive overflow, and bilingual EN/VI microcopy for the demo
path.

## Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Hook Form
- Zod
- Lucide React
- i18next, react-i18next, and i18next-browser-languagedetector

## Bilingual UI

Step 28.5 adds bilingual English/Vietnamese UI support, Step 29 keeps the
Customer Portal Documents screens covered by the same English/Vietnamese
translation resources, Step 30 adds bilingual Activity Center and Portal
Updates screens, Step 31 reviews the admin/portal route guard separation, and
Step 32 polishes bilingual loading, empty, error, and responsive states. Step
33 re-runs final client QA and keeps task/admin status labels in task-owned or
common i18n namespaces.

- Supported locales: `en`, `vi`.
- Locale preference is stored in local storage as `advisora_locale`.
- Browser language detection defaults Vietnamese browsers to `vi`; otherwise
  the UI falls back to `en`.
- Language switchers appear in the public layout, admin topbar, admin login,
  portal layout, and portal login.
- Core navigation, buttons, login forms, status labels, role labels, invitation
  labels, activity labels, portal update labels, and portal case-tracking labels
  use translation resources.
- User-generated database content such as customer names, case titles, notes,
  service names, and file names is displayed as entered.
- Backend API response localization and invitation email localization remain
  future work.

## Local Development

The admin dashboard calls the backend API. Copy the example environment file
and keep the local `.env` file uncommitted:

```bash
cp .env.example .env
```

The default configuration is:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the backend at `http://localhost:5000`, then run the client:

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

Run the frontend checks used by the final QA pass with:

```bash
npm run lint
npm run i18n:check
npm run preview
```

The production build output is `dist`. For deployment, set
`VITE_API_BASE_URL` to the deployed backend API base URL, including `/api`.
Do not hard-code the production API URL in source files. The public
consultation form uses this API base URL; contact and appointment forms are
validation/demo flows until their public backend intake endpoints are added.
Public consultation submissions are mapped by the backend to the workspace
configured with `DEFAULT_ORGANIZATION_SLUG`; the frontend never sends an
`organizationId`.

## CI Checks

The GitHub Actions CI workflow runs the frontend with
`VITE_API_BASE_URL=http://localhost:5000/api` and does not require a live
backend for build validation.

CI commands:

```bash
npm ci
npm run lint
npm run i18n:check
npm run build
```

`npm run i18n:check` verifies EN/VI resource parity and scans common
`t('...')` string-literal usage for missing keys.

## Admin Dashboard

- Login: `/admin/login`
- Dashboard: `/admin/dashboard`
- Customers: `/admin/customers`
- Consultation requests: `/admin/consultation-requests`
- Cases: `/admin/cases`
- Appointments: `/admin/appointments`
- Tasks: `/admin/tasks`
- Team members: `/admin/users`
- Invitations: `/admin/invitations`
- Activity: `/admin/activity`
- Settings: `/admin/settings`
- Documents: `/admin/documents`
- Reports: `/admin/reports`
- Public invite accept: `/invite/:token`
- Customer portal login: `/portal/login`
- Customer portal dashboard: `/portal/dashboard`
- Customer portal updates: `/portal/updates`
- Customer portal documents: `/portal/documents`
- Demo accounts: see `../docs/demo-walkthrough.md`
- Legacy local account: `admin@advisora.demo` / `password123`
- Local token key: `consulting_crm_access_token`
- Customer portal token key: `advisora_portal_access_token`
- UI locale key: `advisora_locale`

The legacy local account is for local portfolio testing only and must not be
used as a staging or production credential.

The token is stored in browser local storage for this local portfolio
environment. Do not commit local environment files, tokens, or other secrets.
Before handling real customer data in production, review this token storage
strategy and consider an HttpOnly secure cookie session flow.
The public website routes remain available alongside the protected admin
workspace. Public workspace signup is available at `/workspace-signup` when
the backend has `WORKSPACE_SIGNUP_ENABLED=true`; successful signup stores the
same Bearer token as login and redirects to `/admin/dashboard`. The customer page supports list, search, pagination, create, edit,
and delete workflows. The consultation request page supports list, search,
status filtering, request details, and status updates. The case management page
supports search, status and priority filters, overdue cases, pagination,
creation, editing, status transitions, staff assignment, history, and deletion
subject to role and backend workflow rules. The case detail modal also includes
an internal-only AI Case Summary panel with generate/loading/error/empty/result
states, structured sections, source counts, provider/model metadata, and the
assistive-output disclaimer. It calls `/api/cases/:id/ai-summary` through the
admin API client only; customer portal routes do not render this feature.
Appointment and task management add
schedule filters, today appointments, overdue tasks, creation, editing, status
updates, and role-aware deletion. Team member management lets administrators
create, edit, activate/deactivate, and reset passwords for internal CRM users
in the current workspace. Invitation management lets administrators list,
search, filter, create, resend, and revoke workspace invitations. Create can
send an invitation email immediately, and the UI shows `emailDelivery` status.
The invite link is shown only immediately after create or resend for manual
fallback. Resending rotates the invite link, so older links stop working.
`/invite/:token` lets the invited user accept and auto-login. There is no
workspace picker in this step. Workspace Settings lets administrators edit the
current workspace profile, including slug and contact fields. Manager and Staff
users do not see the Settings navigation item and cannot open `/admin/settings`
through the protected route. After a successful settings save, the auth context
refreshes `/api/auth/me` so the topbar reflects the updated workspace name.
Workspace signup creates only the first owner administrator for a new internal
CRM workspace. It does not add billing, workspace switching,
workspace-specific public intake forms, custom domains, or logo upload.
Admin and Manager users can manage basic portal access from `/admin/customers`
for an existing customer: create, reset password, deactivate, and activate.
Document management adds search, filters, multipart upload, protected download,
detail review, role-aware deletion, source/visibility badges, storage/scan/OCR
status badges, download counts, OCR previews, and an Admin/Manager
customer-visible toggle for portal access.
Activity Center adds `/admin/activity` for Admin and Manager users, with
workspace-scoped summary cards, search, action/entity/date filters, reset, and
pagination. Step 36 adds readable consultation automation action labels, and
auto-created follow-up tasks render in the existing Tasks page as normal task
rows. The dashboard recent activity card can show consultation automation
events and links to the Activity Center for allowed roles. Staff users do not
see the Activity navigation item.
Step 31 confirms that `/admin/activity` remains Admin/Manager-only and that
`/admin/users`, `/admin/invitations`, and `/admin/settings` remain Admin-only
at the route-guard layer. Backend authorization remains the source of truth.
Step 32 standardizes shared loading and page-level error states, improves
mobile table wrapping, and keeps search/filter empty states bilingual without
changing backend API contracts.
Reports use the dashboard/reporting APIs for operational insight, with staff
performance available to administrators and managers only. Admin and public page
routes are lazy-loaded to keep the initial bundle smaller.

## Customer Portal

The customer portal uses its own auth context and API client. It does not reuse
the admin token key or `AdminLayout`.

- Login route: `/portal/login`
- Dashboard route: `/portal/dashboard`
- Case list route: `/portal/cases`
- Case detail route: `/portal/cases/:id`
- Documents route: `/portal/documents`
- Updates route: `/portal/updates`
- Backend auth: `/api/portal/auth/login`, `/api/portal/auth/me`
- Backend profile: `/api/portal/me`
- Backend cases: `/api/portal/cases/summary`, `/api/portal/cases`,
  `/api/portal/cases/:id`
- Backend documents: `/api/portal/documents`,
  `/api/portal/documents/:id/download`
- Backend updates: `/api/portal/updates`, `/api/portal/updates/summary`
- Token key: `advisora_portal_access_token`

The dashboard shows workspace, customer profile, portal account status, case
summary, recent cases, recent safe updates, and next appointment data. Portal
cases are read-only and use the portal API client only. Portal documents also
use the portal API client only, including FormData upload and blob download
helpers that attach the portal token rather than the internal admin token.
Portal document and update responses do not expose `fileUrl`, storage keys,
bucket names, object keys, signed URLs, file paths, internal notes, raw
ActivityLog descriptions, token hashes, password hashes, IP addresses, or
user-agent data. The portal UI shows safe scan status and disables downloads
when the backend marks a document unsafe or unavailable. Portal Updates are a
read-only feed, not realtime websocket or push notifications. Billing, messages,
and customer self-registration are not part of this step.
Step 32 adds initial loading/error polish for portal dashboard, cases,
documents, updates, and case detail views, including localized metadata labels
and mobile overflow protection for long customer-facing values.
Step 31 confirms that portal routes continue to use `PortalProtectedRoute`,
`PortalLayout`, the portal API client, and `advisora_portal_access_token`.
Internal admin API calls continue to use the separate admin token key
`consulting_crm_access_token`.
