# MFGx31 Backend API

Express REST API for MFGx31. Runs locally with `node index.js` and deploys to
Vercel as a serverless Function from `index.js` (default export).

## Setup

```bash
cd backend
cp .env.example .env   # fill in your Supabase values
npm install
npm start              # http://localhost:3000
```

### Environment variables
| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Publishable (anon) key — used only for `signInWithPassword` and session minting |
| `SUPABASE_SECRET_KEY` | Secret (service-role) key — used for all CRUD, admin provisioning and JWT verification. **Server-side only, never expose.** |
| `CLIENT_ORIGIN` | Comma-separated allowed CORS origins (your frontend Vercel domain). `.vercel.app` previews + localhost are allowed automatically. |

> **Never commit `reqs.txt` (it contains live keys) or `.env`.** Set the real
> values as Environment Variables in Vercel instead.

## Database

Run `backend/schema.sql` in the Supabase SQL Editor. It creates all tables with
RLS, helper functions, a new `organization_owners` table, and an atomic
`transfer_item(...)` function used by the transfer endpoint.

## Routes

All routes are exposed at the bare path (e.g. `/auth/login`). Everything except
`/auth/signup` and `/auth/login` requires a `Authorization: Bearer <token>`.

**Auth**
- `POST /auth/signup` — create organization + first admin (mints session on success)
- `POST /auth/login` — email/password → `{ token, user, organization }`
- `GET /auth/me` — restore session from token
- `POST /auth/logout` — revoke token

**Organizations**
- `GET  /organizations` — current org + owners
- `PATCH /organizations` — update settings (admin)
- `POST /organizations/owners` · `PATCH /organizations/owners/:id` · `DELETE /organizations/owners/:id` (admin)

**Departments**
- `GET /departments` · `GET /departments/:id`
- `POST /departments` — **admin only**; optionally provisions a department-head
  auth account via `head_email` + `head_password`
- `PATCH /departments/:id` · `DELETE /departments/:id` (admin)

**Employees · Machinery · Resources** (parallel: `/employees`, `/machinery`, `/resources`)
- Full CRUD, org scoped. Department heads are restricted to their own department.
- Moves between departments go through `/transfers` (not PATCH).

**Transfers**
- `GET /transfers` — history (enriched with item/department/user names); filter `?department_id=`, `?item_type=`
- `POST /transfers` — atomic transfer (`body: { item_type, item_id, to_department_id, reason }`) via the `transfer_item` RPC

**Events · Documents**
- `GET /events` · `/events/:id` · `GET /documents` · `/documents/:id`
  (dept heads see their own + org-wide rows)
- `POST/PATCH/DELETE` — admin only.

## Vercel deployment

- Backend project points at the repo root `backend/` (framework "Other"),
  `vercel.json` routes all requests to `index.js`.
- Set the four environment variables in Vercel.
- Frontend project (separate Vercel project) points at `client/` and sets
  `VITE_API_BASE_URL` to this backend's URL.

## Security notes
- The service-role key bypasses RLS, so every route enforces
  organization/department/role scoping in code (see `src/middleware/auth.js`).
- JWTs are verified with Supabase (`supabase.auth.getUser`), not parsed client-side.
- The live keys in `backend/reqs.txt` were committed historically — **rotate them**
  if the repo is public, then keep real values only in Vercel env / `.env`.