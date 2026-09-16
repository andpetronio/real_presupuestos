alter table public.raw_materials
  add column if not exists yield_factor numeric not null default 1,
  add column if not exists recipe_unit_cost numeric(12,6) not null default 0;

alter table public.raw_materials
  drop constraint if exists raw_materials_yield_factor_minimum;
alter table public.raw_materials
  add constraint raw_materials_yield_factor_minimum check (yield_factor >= 1);

update public.raw_materials
set recipe_unit_cost = round(derived_unit_cost / nullif(yield_factor, 0), 6);

alter table public.purchase_requirement_snapshots
  add column if not exists yield_factor numeric not null default 1;

alter table public.purchase_requirement_snapshots
  drop constraint if exists purchase_requirement_snapshots_yield_factor_minimum;
alter table public.purchase_requirement_snapshots
  add constraint purchase_requirement_snapshots_yield_factor_minimum check (yield_factor >= 1);

-- Snapshots created before this feature use the current factor as their
-- migration baseline; newly accepted budgets freeze it at acceptance time.
update public.purchase_requirement_snapshots snapshot
set
  yield_factor = rm.yield_factor,
  purchase_quantity = case
    when snapshot.wastage_percentage >= 100 then null
    else snapshot.net_quantity
      / (1 - snapshot.wastage_percentage / 100)
      / rm.yield_factor
  end
from public.raw_materials rm
where rm.id = snapshot.raw_material_id;

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
    yield_factor,
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
    rm.yield_factor,
    sum(ri.daily_quantity * bdr.assigned_days),
    case
      when rm.wastage_percentage >= 100 then null
      else sum(ri.daily_quantity * bdr.assigned_days)
        / (1 - rm.wastage_percentage / 100)
        / rm.yield_factor
    end
  from public.budgets b
  join public.budget_dogs bd on bd.budget_id = b.id
  join public.budget_dog_recipes bdr on bdr.budget_dog_id = bd.id
  join public.recipe_items ri on ri.recipe_id = bdr.recipe_id
  join public.raw_materials rm on rm.id = ri.raw_material_id
  where b.id = p_budget_id
  group by
    b.id,
    b.reference_month,
    rm.id,
    rm.name,
    rm.base_unit,
    rm.wastage_percentage,
    rm.yield_factor
  on conflict (budget_id, raw_material_id) do nothing;
end;
$$;
