-- Add global operational inputs to budgets and calcium/kefir costs to settings.

alter table public.settings
  add column if not exists calcium_unit_cost numeric(12,2) not null default 5000 check (calcium_unit_cost >= 0),
  add column if not exists kefir_unit_cost numeric(12,2) not null default 5000 check (kefir_unit_cost >= 0);

alter table public.budgets
  add column if not exists vacuum_bag_small_qty numeric(12,3) not null default 0 check (vacuum_bag_small_qty >= 0),
  add column if not exists vacuum_bag_large_qty numeric(12,3) not null default 0 check (vacuum_bag_large_qty >= 0),
  add column if not exists labels_qty numeric(12,3) not null default 0 check (labels_qty >= 0),
  add column if not exists non_woven_bag_qty numeric(12,3) not null default 0 check (non_woven_bag_qty >= 0),
  add column if not exists labor_hours_qty numeric(12,3) not null default 0 check (labor_hours_qty >= 0),
  add column if not exists cooking_hours_qty numeric(12,3) not null default 0 check (cooking_hours_qty >= 0),
  add column if not exists calcium_qty numeric(12,3) not null default 0 check (calcium_qty >= 0),
  add column if not exists kefir_qty numeric(12,3) not null default 0 check (kefir_qty >= 0),
  add column if not exists ingredient_total_global numeric(12,2) not null default 0 check (ingredient_total_global >= 0),
  add column if not exists operational_total_global numeric(12,2) not null default 0 check (operational_total_global >= 0);
