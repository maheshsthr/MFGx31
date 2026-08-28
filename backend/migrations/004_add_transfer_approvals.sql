-- =====================================================================
-- MFGx31 Migration: Transfer Approval Workflow
-- Run this in the Supabase SQL Editor (your project -> SQL -> New query).
-- Idempotent-ish: safe to re-run.
--
-- Adds:
--   * status / reviewed_by / reviewed_at / review_note to public.transfers
--   * approve_transfer() RPC (moves the item + marks approved atomically)
--   * approve_transfer_keep_status() helper for reject (marks rejected only)
--   * departments list helper not needed here (REST handles it)
-- =====================================================================

-- ---------------------------------------------------------------
-- 1. Add approval columns to transfers (idempotent via DO blocks)
-- ---------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transfers' and column_name = 'status'
  ) then
    alter table public.transfers
      add column status text not null default 'approved'
      check (status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transfers' and column_name = 'reviewed_by'
  ) then
    alter table public.transfers add column reviewed_by uuid references public.profiles (id) on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transfers' and column_name = 'reviewed_at'
  ) then
    alter table public.transfers add column reviewed_at timestamptz;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'transfers' and column_name = 'review_note'
  ) then
    alter table public.transfers add column review_note text;
  end if;
end $$;

-- Existing rows should be treated as approved (already completed).
update public.transfers set status = 'approved' where status is null;

-- ---------------------------------------------------------------
-- 2. approve_transfer(): move the item AND mark the transfer approved
--    in a single transaction (serverless-safe single RPC call).
-- ---------------------------------------------------------------
create or replace function public.approve_transfer(
  p_transfer_id   uuid,
  p_organization_id uuid,
  p_reviewed_by   uuid,
  p_review_note   text
)
returns public.transfers
language plpgsql
security definer set search_path = public
as $$
declare
  v transfers%rowtype;
  v_from_department_id uuid;
  v_to_department_id uuid;
begin
  select * into v
    from public.transfers
    where id = p_transfer_id and organization_id = p_organization_id;

  if not found then
    raise exception 'Transfer not found in this organization';
  end if;

  if v.status <> 'pending' then
    raise exception 'Transfer is not pending';
  end if;

  v_from_department_id := v.from_department_id;
  v_to_department_id := v.to_department_id;

  if v.item_type = 'employee' then
    update public.employees
      set department_id = v_to_department_id, status = 'active'
      where id = v.item_id and organization_id = p_organization_id;
  elsif v.item_type = 'machinery' then
    update public.machinery
      set department_id = v_to_department_id
      where id = v.item_id and organization_id = p_organization_id;
  elsif v.item_type = 'resource' then
    update public.resources
      set department_id = v_to_department_id, last_updated = now()
      where id = v.item_id and organization_id = p_organization_id;
  else
    raise exception 'Invalid item_type';
  end if;

  update public.transfers
    set status = 'approved',
        reviewed_by = p_reviewed_by,
        reviewed_at = now(),
        review_note = coalesce(p_review_note, review_note)
    where id = p_transfer_id
    returning * into v;

  return v;
end;
$$;

-- ---------------------------------------------------------------
-- 3. reject_transfer(): mark rejected, item stays where it is.
-- ---------------------------------------------------------------
create or replace function public.reject_transfer(
  p_transfer_id   uuid,
  p_organization_id uuid,
  p_reviewed_by   uuid,
  p_review_note   text
)
returns public.transfers
language plpgsql
security definer set search_path = public
as $$
declare
  v transfers%rowtype;
begin
  select * into v
    from public.transfers
    where id = p_transfer_id and organization_id = p_organization_id;

  if not found then
    raise exception 'Transfer not found in this organization';
  end if;

  if v.status <> 'pending' then
    raise exception 'Transfer is not pending';
  end if;

  update public.transfers
    set status = 'rejected',
        reviewed_by = p_reviewed_by,
        reviewed_at = now(),
        review_note = coalesce(p_review_note, review_note)
    where id = p_transfer_id
    returning * into v;

  return v;
end;
$$;

-- =====================================================================
-- Done. Next: restart the backend so it picks up the new routes/RPCs.
-- =====================================================================
