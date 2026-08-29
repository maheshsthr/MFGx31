# MFGx31 — Industry & Department Management System

A **multi-tenant SaaS** for manufacturing and industrial business owners to run their
internal operations: **employees, machinery, resources, events, documents**, and
**transfers** between departments — all in one monochrome, premium dashboard.

MFGx31 is built for a factory owner who runs a business with multiple internal
departments (e.g. a utensil factory with a Copper Plant, Square Utensils, Circle Patti
Cutting, Scrap, Rolling Sheet Mill — or any other setup). Any business owner can sign
up, create their own **Organization**, add departments, and manage everything within a
fully isolated data scope.

> **Out of scope (MVP):** selling/order management, production-process tracking, payroll,
> finance, and customer-facing features. This is purely an operational management layer.

---

## Tech Stack

**PERN** + Supabase (deployed on Vercel as serverless functions):

| Layer | Technology |
|---|---|
| Database & Auth | **Supabase** (PostgreSQL + Supabase Auth, Row-Level Security) |
| Backend | **Node.js / Express** (REST API, deployed to Vercel as a Function) |
| Frontend | **React + Vite** (SPA, deployed to Vercel) |
| Charts | Recharts |
| Animations | Lottie (`lottie-react`) |
| Font | Manrope |

---

## Core Concept — Hierarchy

```
Organization (Company Account)
   └── Departments (dynamic — admin can add/remove anytime)
          ├── Employees
          ├── Machinery
          ├── Resources
          ├── Events
          └── Documents

Transfers move Employees / Machinery / Resources between Departments,
always logged with a full audit trail.
```

## User Roles

| Role | Scope | Capabilities |
|---|---|---|
| **Owner / Admin** | Organization-wide | Full access. Creates/removes departments, provisions department accounts, manages employees/machinery/resources/events/documents/transfers org-wide. |
| **Department Head** | Single department | Logs in and lands on their own department dashboard. Manages their department's data only. |

### Account provisioning

- **Sign-up is Org Owners only** — a public `/signup` creates an `organizations` row plus
  the first Admin profile.
- **Department accounts have no public sign-up.** An Admin provisions them in-app from
  **Departments → Add Department**, allotting an email + password. The backend creates the
  Supabase Auth user with `role = 'department_head'` and the linked `department_id`, using
  the **Supabase Auth Admin API** (server-side, never the public client).
- Only `role = 'admin'` users may create departments / provision accounts.

---

## Features

- 🏢 Multi-tenant organizations with full Row-Level Security isolation
- 🧩 Dynamic departments (add/remove/rename at any time)
- 👥 Employee, Machinery and Resource CRUD, scoped per department
- 🔁 **Transfers** — move employees/machinery/resources between departments in a single
  atomic transaction with a full audit log
- 📅 Events and 📄 Documents (org-wide or department-scoped)
- 🔔 Notifications with login toasts, bell dropdown, badge counts and a dedicated page
- 🔧 Machine **maintenance & repair records** with cost tracking
- 🔍 Live page search across tables
- 🎨 Monochrome black/white/grey design language (green/red used only for status)

---

## Project Structure

```
MFGx31/
├── backend/                 # Express API (Vercel serverless Function)
│   ├── src/
│   │   ├── routes/          # /auth, /organizations, /departments, /employees,
│   │   │                    # /machinery, /resources, /transfers, /events, /documents,
│   │   │                    # /notifications, /maintenance
│   │   ├── middleware/      # auth check, org/dept scoping
│   │   └── lib/supabase.js  # Supabase admin client (service role)
│   ├── index.js             # createApp + guarded app.listen for local dev
│   ├── schema.sql           # idempotent Postgres schema + RLS policies
│   ├── migrations/
│   └── package.json
├── client/                  # React + Vite SPA
│   ├── src/
│   │   ├── pages/           # Landing, Login, Signup, Dashboard, Departments,
│   │   │                    #   DepartmentDetail, Transfers, Notifications, Settings,
│   │   │                    #   DeptResourcePage (employees/machinery/resources), …
│   │   ├── layouts/         # AdminLayout, DeptHeadLayout, Sidebar, Topbar
│   │   ├── components/      # Skeletons, NotificationBell, NotificationToasts, …
│   │   ├── context/         # AuthContext, SearchContext
│   │   ├── lib/             # api (fetch wrapper + session cache), time utils
│   │   └── App.jsx
│   ├── vite.config.js       # dev proxy to backend (port 3000)
│   └── package.json
└── MFGx31_Project_Specification.md  # full architecture + spec
```

---

## Getting Started (Local Development)

### Prerequisites

- **Node.js ≥ 20**
- A **Supabase** project (Postgres + Auth) with `schema.sql` applied and the storage
  bucket created for documents
- Git + a GitHub account (optional, for deployment)

### 1. Backend

```bash
cd backend
# Install Google Fonts-friendly deps + Express/Supabase deps
npm install

# Configure environment
cp .env.example .env   # fill in your Supabase values

# Run the API (loads .env, listens on http://localhost:3000)
npm run dev
```

`backend/.env`:

```
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxx
SUPABASE_SECRET_KEY=sb_secret_xxxx     # NEVER expose to the browser
CLIENT_ORIGIN=http://localhost:5173    # CORS-comma-separated list
```

> The `SUPABASE_SECRET_KEY` (service role) is used **server-side only** for admin
> provisioning and CRUD — it must never be shipped to the client.

### 2. Frontend

```bash
cd client
npm install
npm run dev     # starts Vite on http://localhost:5173
```

`client/.env.local` (usually empty locally — the Vite dev server proxies API calls to
`http://localhost:3000`, see `vite.config.js`). For builds/deploys:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=      # backend API URL (empty locally → same-origin proxy)
```

### 3. Open

- App: **http://localhost:5173**
- API health check: **http://localhost:3000/health**

---

## Scripts

| Directory | Command | Purpose |
|---|---|---|
| `client` | `npm run dev` | Start Vite dev server |
| `client` | `npm run build` | Production build |
| `client` | `npm run lint` | Oxlint static analysis |
| `client` | `npm run preview` | Preview the production build |
| `backend` | `npm run dev` / `npm run start` | Run Express API on port 3000 |

---

## Deployment

### Supabase

1. Create a project.
2. Run `backend/schema.sql` (idempotent — safe to re-run).
3. Enable RLS (enforced in schema), create a `documents` storage bucket.

### Backend → Vercel

1. Create a Vercel project rooted at `backend/`, framework preset **Other/Node**.
2. Set the `SUPABASE_*` and `CLIENT_ORIGIN` environment variables.
3. Deploy — Express is bundled as a single serverless Function (`backend/vercel.json`).

### Frontend → Vercel

1. Create a Vercel project rooted at `client/` (Vite preset, build `npm run build`).
2. Set `VITE_SUPABASE_*` and `VITE_API_BASE_URL` (the deployed backend URL).
3. Deploy — `client/vercel.json` rewrites all routes to `index.html`.

---

## API Overview

| Group | Endpoints |
|---|---|
| Auth | `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` |
| Organizations | `GET/PATCH /organizations` |
| Departments | `GET/POST /departments`, `GET/PATCH/DELETE /departments/:id` |
| Employees | `GET/POST /employees`, `GET/PATCH/DELETE /employees/:id` |
| Machinery | `GET/POST /machinery`, `GET/PATCH/DELETE /machinery/:id` |
| Resources | `GET/POST /resources`, `GET/PATCH/DELETE /resources/:id` |
| Transfers | `POST /transfers`, `GET /transfers` (filterable) |
| Events | `GET/POST /events`, `GET/PATCH/DELETE /events/:id` |
| Documents | `GET/POST /documents`, `GET/PATCH/DELETE /documents/:id` |
| Notifications | `GET /notifications`, `GET /notifications/unread-count`, `PATCH …/read`, `PATCH /notifications/read-all`, `DELETE /notifications` |
| Maintenance | `GET/POST /machinery/:id/maintenance` |

All routes require a valid Supabase JWT (`Authorization: Bearer <token>`); middleware
enforces `role` + `organization_id`/`department_id` scoping on every request.

---

## Security Notes

- Row-Level Security is enabled on **every** table (see `backend/schema.sql`).
- `SUPABASE_SECRET_KEY` lives server-side only.
- CORS is locked down to `CLIENT_ORIGIN` (plus `*.vercel.app`).
- Passwords are stored by Supabase Auth as hashes — never in plaintext.

---

## License

Private project. © MFGx31.