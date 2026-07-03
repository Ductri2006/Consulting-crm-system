# Advisora Frontend

The `client` directory contains the responsive public website and the admin
workspace for the Consulting CRM System portfolio project. Advisora is a
fictional consulting brand used for the demonstration interface.

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
Do not hard-code the production API URL in source files.

## Admin Dashboard

- Login: `/admin/login`
- Dashboard: `/admin/dashboard`
- Customers: `/admin/customers`
- Consultation requests: `/admin/consultation-requests`
- Cases: `/admin/cases`
- Appointments: `/admin/appointments`
- Tasks: `/admin/tasks`
- Documents: `/admin/documents`
- Reports: `/admin/reports`
- Demo account: `admin@advisora.demo` / `password123`
- Local token key: `consulting_crm_access_token`

The demo account is for local portfolio testing only and must not be used as a
real production credential.

The token is stored in browser local storage for this local portfolio
environment. Do not commit local environment files, tokens, or other secrets.
Before handling real customer data in production, review this token storage
strategy and consider an HttpOnly secure cookie session flow.
The public website routes remain available alongside the protected admin
workspace. The customer page supports list, search, pagination, create, edit,
and delete workflows. The consultation request page supports list, search,
status filtering, request details, and status updates. The case management page
supports search, status and priority filters, overdue cases, pagination,
creation, editing, status transitions, staff assignment, history, and deletion
subject to role and backend workflow rules. Appointment and task management add
schedule filters, today appointments, overdue tasks, creation, editing, status
updates, and role-aware deletion. Document management adds search, filters,
multipart upload, protected download, detail review, and role-aware deletion.
Reports use the dashboard/reporting APIs for operational insight, with staff
performance available to administrators and managers only. Admin and public page
routes are lazy-loaded to keep the initial bundle smaller.
