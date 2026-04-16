alter table public.budgets
  add column if not exists viewed_at timestamptz;

create index if not exists budgets_viewed_at_idx on public.budgets (viewed_at);

create table if not exists public.budget_payments (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets (id) on delete cascade,
  amount numeric(12,2) not null,
  payment_method text not null,
  paid_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_payments_amount_positive check (amount > 0),
  constraint budget_payments_method_valid check (payment_method in ('cash', 'transfer', 'mercadopago', 'other'))
);

create index if not exists budget_payments_budget_id_idx on public.budget_payments (budget_id);
create index if not exists budget_payments_paid_at_idx on public.budget_payments (paid_at desc);

create table if not exists public.budget_recipe_preparations (
  id uuid primary key default gen_random_uuid(),
  budget_dog_recipe_id uuid not null references public.budget_dog_recipes (id) on delete cascade,
  recipe_days integer not null,
  prepared_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_recipe_preparations_days_positive check (recipe_days > 0)
);

create index if not exists budget_recipe_preparations_recipe_idx on public.budget_recipe_preparations (budget_dog_recipe_id);
create index if not exists budget_recipe_preparations_prepared_at_idx on public.budget_recipe_preparations (prepared_at desc);

create table if not exists public.budget_recipe_deliveries (
  id uuid primary key default gen_random_uuid(),
  budget_dog_recipe_id uuid not null references public.budget_dog_recipes (id) on delete cascade,
  recipe_days integer not null,
  delivered_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_recipe_deliveries_days_positive check (recipe_days > 0)
);

create index if not exists budget_recipe_deliveries_recipe_idx on public.budget_recipe_deliveries (budget_dog_recipe_id);
create index if not exists budget_recipe_deliveries_delivered_at_idx on public.budget_recipe_deliveries (delivered_at desc);

create or replace function public.validate_budget_recipe_tracking_days_limit()
returns trigger
language plpgsql
as $$
declare
  max_days integer;
  used_days integer;
begin
  select assigned_days
    into max_days
  from public.budget_dog_recipes
  where id = new.budget_dog_recipe_id;

  if max_days is null then
    raise exception 'No existe la receta asignada para este presupuesto.' using errcode = '23514';
  end if;

  if tg_table_name = 'budget_recipe_preparations' then
    select coalesce(sum(recipe_days), 0)
      into used_days
    from public.budget_recipe_preparations
    where budget_dog_recipe_id = new.budget_dog_recipe_id
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);
  else
    select coalesce(sum(recipe_days), 0)
      into used_days
    from public.budget_recipe_deliveries
    where budget_dog_recipe_id = new.budget_dog_recipe_id
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);
  end if;

  used_days := used_days + new.recipe_days;

  if used_days > max_days then
    raise exception 'No podés registrar más días (%) que los asignados (%) para esta receta.', used_days, max_days using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_budget_recipe_preparations_days_limit on public.budget_recipe_preparations;
create trigger validate_budget_recipe_preparations_days_limit
before insert or update on public.budget_recipe_preparations
for each row
execute function public.validate_budget_recipe_tracking_days_limit();

drop trigger if exists validate_budget_recipe_deliveries_days_limit on public.budget_recipe_deliveries;
create trigger validate_budget_recipe_deliveries_days_limit
before insert or update on public.budget_recipe_deliveries
for each row
execute function public.validate_budget_recipe_tracking_days_limit();

drop trigger if exists set_budget_payments_updated_at on public.budget_payments;
create trigger set_budget_payments_updated_at
before update on public.budget_payments
for each row
execute function public.set_updated_at();

drop trigger if exists set_budget_recipe_preparations_updated_at on public.budget_recipe_preparations;
create trigger set_budget_recipe_preparations_updated_at
before update on public.budget_recipe_preparations
for each row
execute function public.set_updated_at();

drop trigger if exists set_budget_recipe_deliveries_updated_at on public.budget_recipe_deliveries;
create trigger set_budget_recipe_deliveries_updated_at
before update on public.budget_recipe_deliveries
for each row
execute function public.set_updated_at();

update public.budgets b
set reference_days = coalesce(days.max_days, b.reference_days)
from (
  select bd.budget_id, max(bd.requested_days) as max_days
  from public.budget_dogs bd
  group by bd.budget_id
) as days
where b.id = days.budget_id;
