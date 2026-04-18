create table if not exists public.budget_persistence_events (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid references public.budgets (id) on delete set null,
  stage text not null,
  detail text not null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint budget_persistence_events_stage_valid check (stage in ('snapshot'))
);

create index if not exists budget_persistence_events_budget_id_idx
  on public.budget_persistence_events (budget_id);

create index if not exists budget_persistence_events_occurred_at_idx
  on public.budget_persistence_events (occurred_at desc);
