-- Refactor raw materials to simple operational model: base cost + wastage.

alter table public.raw_materials
  add column if not exists base_cost numeric(12,2) not null default 0 check (base_cost >= 0),
  add column if not exists wastage_percentage numeric(5,2) not null default 0 check (wastage_percentage >= 0 and wastage_percentage <= 100),
  add column if not exists cost_with_wastage numeric(12,2) not null default 0 check (cost_with_wastage >= 0);

-- Backfill compatibility for existing data.
update public.raw_materials
set
  base_cost = coalesce(purchase_cost, 0),
  wastage_percentage = coalesce(wastage_percentage, 0),
  cost_with_wastage = round(coalesce(purchase_cost, 0) * (1 + coalesce(wastage_percentage, 0) / 100.0), 2)
where true;
