-- Initial MVP schema for spec 001 (multi-dog budgeting and delivery)

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.tutors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  whatsapp_number text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tutors_whatsapp_number_unique on public.tutors (whatsapp_number);

create table if not exists public.dogs (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutors (id) on delete cascade,
  name text not null,
  daily_food_intake numeric(12,3) not null,
  intake_unit text not null,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dogs_daily_food_intake_positive check (daily_food_intake > 0)
);

create index if not exists dogs_tutor_id_idx on public.dogs (tutor_id);

create table if not exists public.raw_materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_unit text not null,
  purchase_quantity numeric(12,3) not null,
  purchase_unit text not null,
  purchase_cost numeric(12,2) not null,
  derived_unit_cost numeric(12,6) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint raw_materials_purchase_quantity_positive check (purchase_quantity > 0),
  constraint raw_materials_purchase_cost_positive check (purchase_cost >= 0),
  constraint raw_materials_derived_unit_cost_positive check (derived_unit_cost >= 0)
);

create unique index if not exists raw_materials_name_unique on public.raw_materials (name);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs (id) on delete cascade,
  name text not null,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recipes_dog_id_idx on public.recipes (dog_id);

create table if not exists public.recipe_items (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  raw_material_id uuid not null references public.raw_materials (id) on delete restrict,
  daily_quantity numeric(12,3) not null,
  unit text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipe_items_daily_quantity_positive check (daily_quantity > 0),
  constraint recipe_items_unique_material_per_recipe unique (recipe_id, raw_material_id)
);

create index if not exists recipe_items_recipe_id_idx on public.recipe_items (recipe_id);
create index if not exists recipe_items_raw_material_id_idx on public.recipe_items (raw_material_id);

create table if not exists public.settings (
  id integer primary key default 1,
  meal_plan_margin numeric(6,4) not null default 0,
  budget_validity_days integer not null default 7,
  vacuum_bag_unit_cost numeric(12,2) not null default 0,
  label_unit_cost numeric(12,2) not null default 0,
  non_woven_bag_unit_cost numeric(12,2) not null default 0,
  labor_hour_cost numeric(12,2) not null default 0,
  cooking_hour_cost numeric(12,2) not null default 0,
  whatsapp_sender_number text,
  whatsapp_default_template text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint settings_singleton check (id = 1),
  constraint settings_budget_validity_days_positive check (budget_validity_days > 0)
);

create type public.budget_status as enum (
  'draft',
  'ready_to_send',
  'sent',
  'accepted',
  'rejected',
  'expired',
  'discarded'
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  status public.budget_status not null default 'draft',
  tutor_id uuid references public.tutors (id) on delete set null,
  public_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz,
  sent_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  discarded_at timestamptz,
  applied_margin numeric(6,4) not null default 0,
  total_cost numeric(12,2) not null default 0,
  final_sale_price numeric(12,2) not null default 0,
  rejection_reason text,
  whatsapp_message_draft text,
  whatsapp_message_sent text,
  notes text,
  constraint budgets_public_token_min_length check (char_length(public_token) >= 16)
);

create unique index if not exists budgets_public_token_unique on public.budgets (public_token);
create index if not exists budgets_status_idx on public.budgets (status);
create index if not exists budgets_tutor_id_idx on public.budgets (tutor_id);
create index if not exists budgets_expires_at_idx on public.budgets (expires_at);

create table if not exists public.budget_dogs (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets (id) on delete cascade,
  dog_id uuid not null references public.dogs (id) on delete restrict,
  requested_days integer not null,
  ingredient_total numeric(12,2) not null default 0,
  operational_total numeric(12,2) not null default 0,
  total_cost numeric(12,2) not null default 0,
  final_sale_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_dogs_requested_days_positive check (requested_days > 0),
  constraint budget_dogs_unique_budget_dog unique (budget_id, dog_id)
);

create index if not exists budget_dogs_budget_id_idx on public.budget_dogs (budget_id);
create index if not exists budget_dogs_dog_id_idx on public.budget_dogs (dog_id);

create table if not exists public.budget_dog_recipes (
  id uuid primary key default gen_random_uuid(),
  budget_dog_id uuid not null references public.budget_dogs (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete restrict,
  assigned_days integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_dog_recipes_assigned_days_positive check (assigned_days > 0),
  constraint budget_dog_recipes_unique_recipe_per_budget_dog unique (budget_dog_id, recipe_id)
);

create index if not exists budget_dog_recipes_budget_dog_id_idx on public.budget_dog_recipes (budget_dog_id);
create index if not exists budget_dog_recipes_recipe_id_idx on public.budget_dog_recipes (recipe_id);

create table if not exists public.budget_snapshots (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets (id) on delete cascade,
  snapshot_payload_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists budget_snapshots_budget_id_idx on public.budget_snapshots (budget_id);

create trigger set_tutors_updated_at
before update on public.tutors
for each row
execute function public.set_updated_at();

create trigger set_dogs_updated_at
before update on public.dogs
for each row
execute function public.set_updated_at();

create trigger set_raw_materials_updated_at
before update on public.raw_materials
for each row
execute function public.set_updated_at();

create trigger set_recipes_updated_at
before update on public.recipes
for each row
execute function public.set_updated_at();

create trigger set_recipe_items_updated_at
before update on public.recipe_items
for each row
execute function public.set_updated_at();

create trigger set_settings_updated_at
before update on public.settings
for each row
execute function public.set_updated_at();

create trigger set_budgets_updated_at
before update on public.budgets
for each row
execute function public.set_updated_at();

create trigger set_budget_dogs_updated_at
before update on public.budget_dogs
for each row
execute function public.set_updated_at();

create trigger set_budget_dog_recipes_updated_at
before update on public.budget_dog_recipes
for each row
execute function public.set_updated_at();

insert into public.settings (id)
values (1)
on conflict (id) do nothing;
