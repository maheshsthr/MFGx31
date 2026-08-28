-- =====================================================================
-- MFGx31 Migration: Machine Maintenance / Repair History
-- Run this in the Supabase SQL Editor (your project -> SQL -> New query).
-- Idempotent (uses IF NOT EXISTS / OR REPLACE). Safe to re-run.
--
-- Adds:
--   * public.machine_maintenance table (maintenance / repair / inspection
--     records per machine, with description and cost)
--   * optional machinery_id column on public.events so maintenance events
--     can be linked to a specific machine
-- =====================================================================

create table if not exists public.machine_maintenance (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  department_id   uuid references public.departments (id) on delete cascade,
  machinery_id    uuid not null references public.machinery (id) on delete cascade,
  work_type       text not null default 'maintenance'
                    check (work_type in ('maintenance', 'repair', 'inspection')),
  title           text not null,
  description     text,
  cost            numeric(12, 2),
  scheduled_date  date,
  completed_date  date,
  status          text not null default 'scheduled'
                    check (status in ('scheduled', 'in_progress', 'completed')),
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now()
);

alter table public.machine_maintenance enable row level security;

create index if not exists machine_maintenance_machinery_idx
  on public.machine_maintenance (machinery_id, created_at desc);

create index if not exists machine_maintenance_org_idx
  on public.machine_maintenance (organization_id);

-- Allow maintenance events to be linked to a specific machine.
alter table public.events
  add column if not exists machinery_id uuid references public.machinery (id) on delete set null;

-- =====================================================================
-- Done. Next: restart the backend so it picks up the new routes.
-- =====================================================================
