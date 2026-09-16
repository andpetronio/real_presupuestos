create table if not exists public.purchase_requirement_snapshots (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets (id) on delete cascade,
  reference_month date not null,
  raw_material_id uuid not null,
  raw_material_name text not null,
  base_unit text not null,
  wastage_percentage numeric(5,2) not null,
  net_quantity numeric not null,
  purchase_quantity numeric,
  created_at timestamptz not null default now(),
  constraint purchase_requirement_snapshots_wastage_valid
    check (wastage_percentage >= 0 and wastage_percentage <= 100),
  constraint purchase_requirement_snapshots_net_quantity_positive
    check (net_quantity > 0),
  constraint purchase_requirement_snapshots_unique_budget_material
    unique (budget_id, raw_material_id)
);

create index if not exists purchase_requirement_snapshots_reference_month_idx
  on public.purchase_requirement_snapshots (reference_month);
create index if not exists purchase_requirement_snapshots_budget_id_idx
  on public.purchase_requirement_snapshots (budget_id);

alter table public.purchase_requirement_snapshots enable row level security;

drop policy if exists purchase_requirement_snapshots_authenticated_all
  on public.purchase_requirement_snapshots;
create policy purchase_requirement_snapshots_authenticated_all
  on public.purchase_requirement_snapshots
  for all to authenticated
  using (true)
  with check (true);

create or replace function public.snapshot_purchase_requirements(
  p_budget_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.purchase_requirement_snapshots (
    budget_id,
    reference_month,
    raw_material_id,
    raw_material_name,
    base_unit,
    wastage_percentage,
    net_quantity,
    purchase_quantity
  )
  select
    b.id,
    b.reference_month,
    rm.id,
    rm.name,
    rm.base_unit,
    rm.wastage_percentage,
    sum(ri.daily_quantity * bdr.assigned_days),
    case
      when rm.wastage_percentage >= 100 then null
      else sum(ri.daily_quantity * bdr.assigned_days)
        / (1 - rm.wastage_percentage / 100)
    end
  from public.budgets b
  join public.budget_dogs bd on bd.budget_id = b.id
  join public.budget_dog_recipes bdr on bdr.budget_dog_id = bd.id
  join public.recipe_items ri on ri.recipe_id = bdr.recipe_id
  join public.raw_materials rm on rm.id = ri.raw_material_id
  where b.id = p_budget_id
  group by b.id, b.reference_month, rm.id, rm.name, rm.base_unit, rm.wastage_percentage
  on conflict (budget_id, raw_material_id) do nothing;
end;
$$;

create or replace function public.accept_budget_and_snapshot(
  p_budget_id uuid,
  p_accepted_at timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status public.budget_status;
begin
  select status
    into v_status
  from public.budgets
  where id = p_budget_id
  for update;

  if not found then
    raise exception 'No encontramos el presupuesto a aceptar.' using errcode = 'P0002';
  end if;

  if v_status not in ('sent'::public.budget_status, 'expired'::public.budget_status) then
    raise exception 'Solo se pueden aceptar presupuestos en estado enviado o vencido.' using errcode = '23514';
  end if;

  perform public.snapshot_purchase_requirements(p_budget_id);

  update public.budgets
  set
    status = 'accepted',
    accepted_at = p_accepted_at,
    viewed_at = p_accepted_at
  where id = p_budget_id;
end;
$$;

-- Existing accepted budgets have no immutable ingredient snapshot. Freeze the
-- composition currently stored in the catalogue as the migration baseline.
insert into public.purchase_requirement_snapshots (
  budget_id,
  reference_month,
  raw_material_id,
  raw_material_name,
  base_unit,
  wastage_percentage,
  net_quantity,
  purchase_quantity
)
select
  b.id,
  b.reference_month,
  rm.id,
  rm.name,
  rm.base_unit,
  rm.wastage_percentage,
  sum(ri.daily_quantity * bdr.assigned_days),
  case
    when rm.wastage_percentage >= 100 then null
    else sum(ri.daily_quantity * bdr.assigned_days)
      / (1 - rm.wastage_percentage / 100)
  end
from public.budgets b
join public.budget_dogs bd on bd.budget_id = b.id
join public.budget_dog_recipes bdr on bdr.budget_dog_id = bd.id
join public.recipe_items ri on ri.recipe_id = bdr.recipe_id
join public.raw_materials rm on rm.id = ri.raw_material_id
where b.status = 'accepted'::public.budget_status
group by b.id, b.reference_month, rm.id, rm.name, rm.base_unit, rm.wastage_percentage
on conflict (budget_id, raw_material_id) do nothing;

create or replace function public.public_accept_budget(p_token text)
returns table (
  ok boolean,
  code text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_token text;
  v_budget_id uuid;
  v_status public.budget_status;
  v_expires_at timestamptz;
begin
  v_token := nullif(trim(p_token), '');
  if v_token is null then
    return query select false, 'invalid_token';
    return;
  end if;

  select b.id, b.status, b.expires_at
    into v_budget_id, v_status, v_expires_at
  from public.budgets b
  where b.public_token = v_token
  limit 1
  for update;

  if not found then
    return query select false, 'not_found';
    return;
  end if;

  if v_status = 'sent'::public.budget_status
    and v_expires_at is not null
    and v_expires_at <= now() then
    update public.budgets
    set status = 'expired'
    where id = v_budget_id
      and status = 'sent'::public.budget_status;
    v_status := 'expired'::public.budget_status;
  end if;

  if v_status <> 'sent'::public.budget_status then
    return query select false,
      case
        when v_status = 'accepted'::public.budget_status then 'blocked_accepted'
        when v_status = 'rejected'::public.budget_status then 'blocked_rejected'
        when v_status = 'expired'::public.budget_status then 'blocked_expired'
        else 'blocked_other'
      end;
    return;
  end if;

  perform public.snapshot_purchase_requirements(v_budget_id);

  update public.budgets
  set
    status = 'accepted',
    accepted_at = now(),
    rejected_at = null,
    rejection_reason = null
  where id = v_budget_id;

  return query select true, 'updated';
end;
$$;

revoke all on function public.snapshot_purchase_requirements(uuid)
  from public, anon, authenticated;
revoke all on function public.accept_budget_and_snapshot(uuid, timestamptz)
  from public, anon;
grant execute on function public.accept_budget_and_snapshot(uuid, timestamptz)
  to authenticated;
