# Advisora Frontend

The `client` directory contains the responsive public website and the admin
workspace for the Consulting CRM System portfolio project. Advisora is a
fictional consulting brand used for the demonstration interface.
The UI uses the word Workspace for the backend Organization tenant model; the
current demo/staging workspace is `Advisora Demo Workspace`.

## Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Hook Form
- Zod
- Lucide React

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

The production build output is `dist`. For deployment, set
`VITE_API_BASE_URL` to the deployed backend API base URL, including `/api`.
Do not hard-code the production API URL in source files. The public
consultation form uses this API base URL; contact and appointment forms are
validation/demo flows until their public backend intake endpoints are added.
Public consultation submissions are mapped by the backend to the workspace
configured with `DEFAULT_ORGANIZATION_SLUG`; the frontend never sends an
`organizationId`.

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
- Settings: `/admin/settings`
- Documents: `/admin/documents`
- Reports: `/admin/reports`
- Public invite accept: `/invite/:token`
- Customer portal login: `/portal/login`
- Customer portal dashboard: `/portal/dashboard`
- Demo accounts: see `../docs/demo-walkthrough.md`
- Legacy local account: `admin@advisora.demo` / `password123`
- Local token key: `consulting_crm_access_token`
- Customer portal token key: `advisora_portal_access_token`

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
subject to role and backend workflow rules. Appointment and task management add
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
Document management adds search, filters,
multipart upload, protected download, detail review, and role-aware deletion.
Reports use the dashboard/reporting APIs for operational insight, with staff
performance available to administrators and managers only. Admin and public page
routes are lazy-loaded to keep the initial bundle smaller.

## Customer Portal

The customer portal uses its own auth context and API client. It does not reuse
the admin token key or `AdminLayout`.

- Login route: `/portal/login`
- Dashboard route: `/portal/dashboard`
- Backend auth: `/api/portal/auth/login`, `/api/portal/auth/me`
- Backend profile: `/api/portal/me`
- Token key: `advisora_portal_access_token`

The dashboard currently shows workspace, customer profile, portal account
status, and placeholders for future case tracking, document upload, and secure
messages. Customer self-registration, billing, and portal document upload are
not part of this step.
