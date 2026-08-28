-- =====================================================================
-- MFGx31 Migration: Department Address
-- Run this in the Supabase SQL Editor (your project -> SQL -> New query).
-- Idempotent: safe to re-run.
-- =====================================================================

alter table public.departments
  add column if not exists address text;

-- =====================================================================
-- Done. Next: restart the backend so it picks up the new route fields.
-- =====================================================================
