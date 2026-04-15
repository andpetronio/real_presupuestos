-- Split vacuum bag cost into small and large variants.

alter table public.settings
  add column if not exists vacuum_bag_small_unit_cost numeric(12,2) not null default 0 check (vacuum_bag_small_unit_cost >= 0),
  add column if not exists vacuum_bag_large_unit_cost numeric(12,2) not null default 0 check (vacuum_bag_large_unit_cost >= 0);

-- Backfill from legacy single cost when available.
update public.settings
set
  vacuum_bag_small_unit_cost = coalesce(vacuum_bag_unit_cost, 0),
  vacuum_bag_large_unit_cost = coalesce(vacuum_bag_unit_cost, 0)
where id = 1;
