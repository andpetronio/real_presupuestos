create table if not exists public.dog_delivery_schedules (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  day_of_month integer not null check (day_of_month between 1 and 31),
  pct integer not null check (pct between 1 and 100),
  created_at timestamptz not null default now(),
  unique (dog_id, day_of_month)
);

create index if not exists dog_delivery_schedules_dog_id_idx on public.dog_delivery_schedules (dog_id);

comment on table public.dog_delivery_schedules is
  'Delivery schedule entries per dog: which day of month and what percentage of monthly meals to deliver. Multiple rows per dog allowed.';

alter table public.budget_dogs
add column if not exists delivery_schedule_id uuid references public.dog_delivery_schedules(id) on delete set null;
