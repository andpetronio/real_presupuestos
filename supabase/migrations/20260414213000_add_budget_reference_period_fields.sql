alter table public.budgets
  add column if not exists reference_month date not null default date_trunc('month', now())::date,
  add column if not exists reference_days integer not null default 30;

alter table public.budgets
  drop constraint if exists budgets_reference_days_positive;

alter table public.budgets
  add constraint budgets_reference_days_positive check (reference_days > 0);

create index if not exists budgets_reference_month_idx on public.budgets (reference_month);
