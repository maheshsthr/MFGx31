# MFGx31 — Industry & Department Management System

**Type:** Multi-tenant SaaS for manufacturing/industrial businesses
**Stack:** PERN (PostgreSQL via Supabase, Express, React, Node)
**Frontend Hosting:** Vercel
**Backend Hosting:** Render
**Database & Auth:** Supabase (Postgres + Supabase Auth)

---

## 1. Project Summary

MFGx31 is a management platform for **any industry/factory owner** who runs a business with multiple internal departments (e.g. a utensil factory with Copper Plant, Square Utensils, Circle Patti Cutting, Scrap, Rolling Sheet Mill — or any other manufacturing setup with its own department names).

It is **not** a selling/e-commerce platform and **not** a production/manufacturing-process tracker. It is purely an **operational management layer** for:

- Employees
- Machinery
- Resources (raw materials / stock / inventory items)
- Events
- Documents
- Movement/transfer of the above between departments

This is a **multi-tenant** system: any business owner can sign up, create their own **Organization (Company Account)**, and manage it independently. Data is fully isolated per organization.

**Out of scope for MVP:** selling operations, manufacturing/production workflows, salaries, finance, payments, invoicing. Purely resource/HR/machinery management.

---

## 2. Core Concept — Hierarchy

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

---

## 3. User Roles & Access

| Role | Scope | Capabilities |
|---|---|---|
| **Owner/Admin** | Organization-wide | Full access. Creates/removes departments, assigns department heads, views all departments, performs transfers, manages org settings. |
| **Department Head** | Single department | Logs in and lands directly on their own department dashboard. Manages employees/machinery/resources/events/documents within their department only. Cannot view other departments unless explicitly granted. |

Auth handled via **Supabase Auth** (email/password to start; can extend to magic link/OAuth later). Role and `department_id` stored in a `profiles` table linked to `auth.users`.

---

## 4. Database Schema (Supabase / Postgres)

```sql
-- Organizations (top-level company accounts, multi-tenant root)
organizations
  id                uuid PK
  name              text
  industry_type     text        -- e.g. "Metal Manufacturing", "Textiles", generic label
  logo_url          text
  created_by        uuid        -- references profiles.id
  created_at        timestamptz

-- Departments (dynamic, belong to one organization)
departments
  id                uuid PK
  organization_id   uuid FK -> organizations.id
  name              text        -- e.g. "Copper Plant"
  description       text
  head_profile_id   uuid FK -> profiles.id (nullable)
  created_at        timestamptz

-- Profiles (extends Supabase auth.users)
profiles
  id                uuid PK  (matches auth.users.id)
  organization_id   uuid FK -> organizations.id
  full_name         text
  role              text        -- 'admin' | 'department_head'
  department_id     uuid FK -> departments.id (nullable, null for admin)
  avatar_url        text
  created_at        timestamptz

-- Employees
employees
  id                uuid PK
  organization_id   uuid FK -> organizations.id
  department_id     uuid FK -> departments.id
  name              text
  designation       text
  contact_number    text
  joining_date      date
  status            text        -- 'active' | 'transferred' | 'inactive'
  created_at        timestamptz

-- Machinery
machinery
  id                uuid PK
  organization_id   uuid FK -> organizations.id
  department_id     uuid FK -> departments.id
  name              text
  type              text
  status            text        -- 'working' | 'maintenance' | 'idle'
  purchase_date     date
  notes             text
  created_at        timestamptz

-- Resources (raw material / stock items)
resources
  id                uuid PK
  organization_id   uuid FK -> organizations.id
  department_id     uuid FK -> departments.id
  name              text
  category          text
  quantity          numeric
  unit              text        -- kg, pcs, sheets, etc.
  last_updated      timestamptz

-- Transfers (unified audit log for movement between departments)
transfers
  id                  uuid PK
  organization_id     uuid FK -> organizations.id
  item_type           text      -- 'employee' | 'machinery' | 'resource'
  item_id             uuid      -- references the relevant table's id
  from_department_id  uuid FK -> departments.id
  to_department_id    uuid FK -> departments.id
  transferred_by      uuid FK -> profiles.id
  reason              text
  transferred_at      timestamptz

-- Events (org-wide or department-specific)
events
  id                uuid PK
  organization_id   uuid FK -> organizations.id
  department_id     uuid FK -> departments.id (nullable = org-wide event)
  title             text
  description       text
  event_date        date
  created_by        uuid FK -> profiles.id
  created_at        timestamptz

-- Documents (org-wide or department-specific)
documents
  id                uuid PK
  organization_id   uuid FK -> organizations.id
  department_id     uuid FK -> departments.id (nullable = org-wide document)
  title             text
  file_url          text        -- Supabase Storage URL
  uploaded_by       uuid FK -> profiles.id
  uploaded_at       timestamptz
```

**Row Level Security (RLS):** Every table must enforce `organization_id` scoping so one organization can never see another's data. Department heads' policies additionally restrict to their own `department_id` on employees/machinery/resources/events/documents (except org-wide events/documents which are read-only for them).

---

## 5. Backend (Express on Render)

RESTful API, organized by resource. All routes require a valid Supabase JWT (validated via Supabase service role on the backend). Middleware checks `role` and `organization_id`/`department_id` scope on every request.

**Key route groups:**
- `/auth` — signup (creates organization + admin profile), login, session
- `/organizations` — get/update org settings
- `/departments` — CRUD (admin only for create/delete)
- `/employees` — CRUD, scoped by department
- `/machinery` — CRUD, scoped by department
- `/resources` — CRUD, scoped by department
- `/transfers` — create transfer (updates source item's `department_id` + inserts audit row), list transfer history (filterable by department/item type)
- `/events` — CRUD
- `/documents` — CRUD + Supabase Storage upload handling

**Transfer logic (important):** A transfer is a single transaction: (1) insert a row into `transfers`, (2) update the item's `department_id` in its own table (employees/machinery/resources), (3) if item_type is 'employee', optionally update status to reflect the move. Wrap in a DB transaction to avoid partial updates.

---

## 6. Frontend (React on Vercel)

### Pages/Routes
- `/` — **Landing Page** (public marketing page, pre-login)
- `/login` — Login
- `/signup` — Organization signup (creates org + first admin account)
- `/dashboard` — Admin: organization-wide overview. Department Head: redirected straight to their department view.
- `/departments` — Department management (admin only): list, add, remove departments, assign heads
- `/departments/:id` — Department detail view with tabs: Employees | Machinery | Resources | Events | Documents | Transfer History
- `/transfers` — Global transfer log (admin) / department-scoped log (dept head)
- `/settings` — Organization/profile settings

### Landing Page Requirements
- Include a relevant Lottie animation (via `lottiefiles.com`, embedded using `@lottiefiles/react-lottie-player` or `lottie-react`) depicting industry/factory/operations themes.
- Should look like a real SaaS product page (hero, feature highlights, CTA to sign up/login), not a bare login form.

---

## 7. UI/UX Direction

**Reference layout:** a minimal black-and-white SaaS dashboard (Salleist-style) — this defines the **structural/component language and color language** to follow:

- **Sidebar:** solid black, compact width, simple icon + label nav items stacked vertically, active item shown as a black pill/rounded rect with white text (rest of items are plain black-on-white or grey text, no icons-only clutter)
- **Top bar:** minimal — search input (light grey rounded pill background), notification bell icon, profile block (avatar + name + email) on the right, no heavy branding bar
- **Greeting header:** large bold "Welcome back, [Name]" style heading directly under the top bar, with a short muted subtext line beneath it — personal, not generic
- **Stat cards:** exactly one **black/dark card** (high-contrast "hero" stat, e.g. Total Employees or Active Departments) sitting alongside **white/light cards** with soft grey borders for the remaining stats — each stat card shows a large bold number, a short label above it, and a small colored trend indicator (green ▲ / red ▼ with percentage) below
- **Charts:** clean line/area chart in a white card with a simple colored-dot legend (2–3 series max), minimal gridlines, muted axis labels
- **Side list card:** a compact "Top Selling Product"-style ranked list card (repurpose as e.g. "Top Departments by Headcount" or "Most Active Machinery") with a small thumbnail/icon, title, subtitle metric, and a status tag on the right
- **Data tables:** clean white background, light grey header row, subtle row dividers (no zebra striping), status shown as colored **text** (not heavy pills) — green for active/completed, red/amber for delayed/inactive — plus a "•••" action menu per row and top-right utility buttons (Customize / Filter / Export style)
- **Corners & spacing:** generously rounded corners (16–20px) on all cards, generous whitespace, soft/no shadows (flat cards with thin borders instead of heavy drop shadows), overall very light and airy despite the black sidebar/cards

**Color palette:**
- Background: off-white / very light grey (`#F5F5F4`)
- Cards: pure white (`#FFFFFF`) with 1px light grey border (`#E5E5E5`)
- High-contrast elements (sidebar, hero stat card, active nav pill, primary buttons): near-black (`#0F0F0F` – `#1A1A1A`)
- Text: black/near-black for primary, mid-grey (`#8A8A8A`) for secondary/muted text
- Accent/semantic colors used sparingly: green (`#22C55E`) for positive trend/active status, red (`#EF4444`) for negative/delayed, used only as small text or trend arrows — never as large color blocks
- No blue, no purple, no gradients — this is a strict **black / white / grey** theme with green-red used only semantically

**Typography:** clean modern sans-serif (Inter, Manrope, or General Sans), bold large numerals for stats, medium weight for headings, regular muted grey for secondary text — strong contrast between hierarchy levels, minimal visual noise.

This should read as a premium, restrained, "quietly expensive" operations tool — monochrome-first with color used only to communicate status, not decoration.

---

## 8. Suggested Folder Structure

```
mfgx31/
├── client/                 (React app — deployed to Vercel)
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── layouts/         (AdminLayout, DeptHeadLayout)
│   │   ├── hooks/
│   │   ├── lib/supabaseClient.js
│   │   └── App.jsx
│   └── package.json
├── server/                 (Express app — deployed to Render)
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/     (auth check, org/dept scoping)
│   │   ├── controllers/
│   │   ├── lib/supabaseAdmin.js
│   │   └── index.js
│   └── package.json
└── README.md
```

---

## 9. Environment Variables

**Client (Vercel):**
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=          # Render backend URL
```

**Server (Render):**
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PORT=
CLIENT_ORIGIN=              # for CORS
```

---

## 10. Deployment Notes

- **Supabase:** create project, run schema migrations, enable RLS on every table, set up Storage bucket for documents.
- **Render:** deploy `server/` as a Web Service, set env vars, enable auto-deploy from GitHub.
- **Vercel:** deploy `client/` as a static/Vite React project, set env vars, connect same GitHub repo.
- CORS on backend must explicitly allow the Vercel production + preview domains.

---

## 11. MVP Build Order (Recommended Phases)

1. **Phase 1:** Supabase schema + RLS policies, Auth (signup creates org + admin), basic Express server skeleton on Render.
2. **Phase 2:** Landing page + Login/Signup UI (Vercel).
3. **Phase 3:** Admin Dashboard shell + Department Management (add/remove departments).
4. **Phase 4:** Department Detail View — Employees, Machinery, Resources CRUD.
5. **Phase 5:** Transfer system (modal + audit log + department detail "Transfer History" tab).
6. **Phase 6:** Events + Documents modules.
7. **Phase 7:** Department Head-scoped dashboard/login flow + RLS enforcement testing.
8. **Phase 8:** Polish — theme refinement, Lottie integration, responsive pass.

---

## 12. Non-Goals (Explicitly Out of Scope for MVP)

- No sales/order management
- No manufacturing/production process tracking
- No salary, payroll, or financial/accounting features
- No customer-facing features — this is purely internal/operational
