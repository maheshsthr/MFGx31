-- =====================================================================
-- MFGx31 Migration: Notifications
-- Run this in the Supabase SQL Editor (your project -> SQL -> New query).
-- Idempotent (uses IF NOT EXISTS / OR REPLACE).
-- =====================================================================

create table if not exists public.notifications (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations (id) on delete cascade,
  recipient_user_id uuid not null references public.profiles (id) on delete cascade,
  actor_user_id     uuid,
  actor_name        text,
  type              text,
  title             text not null,
  message           text,
  entity_type       text,
  entity_id         uuid,
  link              text,
  read              boolean not null default false,
  created_at        timestamptz not null default now()
);

alter table public.notifications enable row level security;

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_user_id, created_at desc);

-- =====================================================================
-- Done. Next: restart the backend so it picks up the new routes.
-- =====================================================================
