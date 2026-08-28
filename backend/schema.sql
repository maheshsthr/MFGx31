-- MFGx31 Database Schema
-- Run this in the Supabase SQL Editor.
-- Uses the new-style publishable/secret keys; roles: 'anon' (publishable) and 'service_role' (secret).

-- ============================================================
-- 1. Organizations
-- ============================================================
create table if not exists public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  industry_type text,
  logo_url      text,
  created_by    uuid,
  created_at    timestamptz not null default now()
);

alter table public.organizations enable row level security;

-- ============================================================
-- 2. Profiles (links to auth.users)
-- ============================================================
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete set null,
  full_name       text,
  role            text not null default 'admin'   -- 'admin' | 'department_head'
                  check (role in ('admin','department_head')),
  department_id   uuid,
  avatar_url      text,
  created_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- auto-create profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'admin');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 3. Departments
-- ============================================================
create table if not exists public.departments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  description     text,
  head_profile_id uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now()
);

alter table public.departments enable row level security;

-- ============================================================
-- 4. Employees
-- ============================================================
create table if not exists public.employees (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  department_id   uuid not null references public.departments (id) on delete cascade,
  name            text not null,
  designation     text,
  contact_number  text,
  joining_date    date,
  status          text not null default 'active'
                  check (status in ('active','transferred','inactive')),
  created_at      timestamptz not null default now()
);

alter table public.employees enable row level security;

-- ============================================================
-- 5. Machinery
-- ============================================================
create table if not exists public.machinery (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  department_id   uuid not null references public.departments (id) on delete cascade,
  name            text not null,
  type            text,
  status          text not null default 'working'
                  check (status in ('working','maintenance','idle')),
  purchase_date   date,
  notes           text,
  created_at      timestamptz not null default now()
);

alter table public.machinery enable row level security;

-- ============================================================
-- 6. Resources
-- ============================================================
create table if not exists public.resources (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  department_id   uuid not null references public.departments (id) on delete cascade,
  name            text not null,
  category        text,
  quantity        numeric default 0,
  unit            text,
  last_updated    timestamptz not null default now()
);

alter table public.resources enable row level security;

-- ============================================================
-- 7. Transfers (audit log)
-- ============================================================
create table if not exists public.transfers (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations (id) on delete cascade,
  item_type           text not null check (item_type in ('employee','machinery','resource')),
  item_id             uuid not null,
  from_department_id  uuid references public.departments (id) on delete set null,
  to_department_id    uuid references public.departments (id) on delete set null,
  transferred_by      uuid references public.profiles (id) on delete set null,
  reason              text,
  transferred_at      timestamptz not null default now()
);

alter table public.transfers enable row level security;

-- ============================================================
-- 8. Events (org-wide or department-specific)
-- ============================================================
create table if not exists public.events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  department_id   uuid references public.departments (id) on delete cascade,
  title           text not null,
  description     text,
  event_date      date,
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now()
);

alter table public.events enable row level security;

-- ============================================================
-- 9. Documents
-- ============================================================
create table if not exists public.documents (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  department_id   uuid references public.departments (id) on delete cascade,
  title           text not null,
  file_url        text,
  uploaded_by     uuid references public.profiles (id) on delete set null,
  uploaded_at     timestamptz not null default now()
);

alter table public.documents enable row level security;

-- ============================================================
-- 10. Foreign key: profiles.department_id -> departments.id
--     (defined after departments exists)
-- ============================================================
alter table public.profiles
  add constraint profiles_department_fk foreign key (department_id)
  references public.departments (id) on delete set null;

-- ============================================================
-- 11. RLS policies + helper functions (after all tables exist)
--     Note: a dept head must view org-wide + their own dept business rows.
-- ============================================================

-- Helper: current user's profile / organization
create or replace function public.current_profile_id()
returns uuid
language sql stable
as $$
  select id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_organization_id()
returns uuid
language sql stable
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

create or replace function public.has_admin_role()
returns boolean
language sql stable
as $$
  select role = 'admin' from public.profiles where id = auth.uid()
$$;

-- Organizations: admins can manage their own org
create policy "org admin access" on public.organizations
  for all to authenticated
  using (public.current_organization_id() = id and public.has_admin_role())
  with check (public.current_organization_id() = id and public.has_admin_role());

-- Profiles: users can read their own
create policy "profile own access" on public.profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Departments: members of the org (admins full, dept heads read their own)
create policy "dept org access" on public.departments
  for all to authenticated
  using (public.current_organization_id() = organization_id)
  with check (public.current_organization_id() = organization_id and public.has_admin_role());

-- Employees: admins full access; dept heads only their own department
create policy "employees org access" on public.employees
  for all to authenticated
  using (public.current_organization_id() = organization_id and (public.has_admin_role() or department_id = (select department_id from public.profiles where id = auth.uid())))
  with check (public.current_organization_id() = organization_id and (public.has_admin_role() or department_id = (select department_id from public.profiles where id = auth.uid())));

-- Machinery: admins full access; dept heads only their own department
create policy "machinery org access" on public.machinery
  for all to authenticated
  using (public.current_organization_id() = organization_id and (public.has_admin_role() or department_id = (select department_id from public.profiles where id = auth.uid())))
  with check (public.current_organization_id() = organization_id and (public.has_admin_role() or department_id = (select department_id from public.profiles where id = auth.uid())));

-- Resources: admins full access; dept heads only their own department
create policy "resources org access" on public.resources
  for all to authenticated
  using (public.current_organization_id() = organization_id and (public.has_admin_role() or department_id = (select department_id from public.profiles where id = auth.uid())))
  with check (public.current_organization_id() = organization_id and (public.has_admin_role() or department_id = (select department_id from public.profiles where id = auth.uid())));

-- Transfers: org scoped (read/insert)
create policy "transfers org access" on public.transfers
  for all to authenticated
  using (public.current_organization_id() = organization_id)
  with check (public.current_organization_id() = organization_id);

-- Events: org wide; dept heads see own + org-wide (department_id null)
create policy "events org access" on public.events
  for all to authenticated
  using (public.current_organization_id() = organization_id and (public.has_admin_role() or department_id is null or department_id = (select department_id from public.profiles where id = auth.uid())))
  with check (public.current_organization_id() = organization_id and public.has_admin_role());

-- Documents: org wide; dept heads read own + org-wide
create policy "documents org access" on public.documents
  for all to authenticated
  using (public.current_organization_id() = organization_id and (public.has_admin_role() or department_id is null or department_id = (select department_id from public.profiles where id = auth.uid())))
  with check (public.current_organization_id() = organization_id and public.has_admin_role());
-- ============================================================
-- 12. Organization Owners (partners / ownership breakdown)
--     Stored explicitly so signup + Settings can manage owners.
-- ============================================================
create table if not exists public.organization_owners (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  full_name       text not null,
  email           text,
  role            text,               -- e.g. 'Owner', 'Partner', 'Managing Partner'
  ownership_share numeric default 0,  -- percentage
  phone           text,
  joined_date     date,
  is_primary      boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table public.organization_owners enable row level security;

create policy "owners org access" on public.organization_owners
  for all to authenticated
  using (public.current_organization_id() = organization_id)
  with check (public.current_organization_id() = organization_id);

-- ============================================================
-- 13. Atomic transfer helper
--     A transfer must (1) update the item's department_id and
--     (2) insert an audit row — atomically, even on serverless
--     function calls where a multi-statement JS "transaction"
--     is not safe. Runs with invoker rights; the backend calls
--     this via the service-role key, which bypasses RLS.
-- ============================================================
create or replace function public.transfer_item(
  p_organization_id uuid,
  p_item_type       text,
  p_item_id         uuid,
  p_to_department_id uuid,
  p_reason          text,
  p_transferred_by  uuid
)
returns public.transfers
language plpgsql
as $$
declare
  v_from_department_id uuid;
  v_transfer public.transfers;
begin
  if p_item_type = 'employee' then
    select department_id into v_from_department_id
      from public.employees
      where id = p_item_id and organization_id = p_organization_id;
    if v_from_department_id is null then
      raise exception 'Employee not found in this organization';
    end if;
    if v_from_department_id = p_to_department_id then
      raise exception 'Cannot transfer to the same department';
    end if;
    update public.employees
      set department_id = p_to_department_id, status = 'active'
      where id = p_item_id;

  elsif p_item_type = 'machinery' then
    select department_id into v_from_department_id
      from public.machinery
      where id = p_item_id and organization_id = p_organization_id;
    if v_from_department_id is null then
      raise exception 'Machinery not found in this organization';
    end if;
    if v_from_department_id = p_to_department_id then
      raise exception 'Cannot transfer to the same department';
    end if;
    update public.machinery
      set department_id = p_to_department_id
      where id = p_item_id;

  elsif p_item_type = 'resource' then
    select department_id into v_from_department_id
      from public.resources
      where id = p_item_id and organization_id = p_organization_id;
    if v_from_department_id is null then
      raise exception 'Resource not found in this organization';
    end if;
    if v_from_department_id = p_to_department_id then
      raise exception 'Cannot transfer to the same department';
    end if;
    update public.resources
      set department_id = p_to_department_id, last_updated = now()
      where id = p_item_id;

  else
    raise exception 'Invalid item_type, must be employee, machinery or resource';
  end if;

  insert into public.transfers (
    organization_id, item_type, item_id, from_department_id,
    to_department_id, transferred_by, reason
  ) values (
    p_organization_id, p_item_type, p_item_id, v_from_department_id,
    p_to_department_id, p_transferred_by, p_reason
  ) returning * into v_transfer;

  return v_transfer;
end;
$$;
