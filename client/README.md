# Advisora Frontend

The `client` directory contains the responsive public website and the admin
dashboard foundation for the Consulting CRM System portfolio project. Advisora
is a fictional consulting brand used for the demonstration interface.

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

## Admin Dashboard

- Login: `/admin/login`
- Dashboard: `/admin/dashboard`
- Demo account: `admin@advisora.demo` / `password123`
- Local token key: `consulting_crm_access_token`

The token is stored in browser local storage for this local portfolio
environment. Do not commit local environment files, tokens, or other secrets.
The public website routes remain available alongside the protected admin
dashboard.
