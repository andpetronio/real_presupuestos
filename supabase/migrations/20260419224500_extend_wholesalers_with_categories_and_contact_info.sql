-- Extend wholesalers with categories and contact/commercial profile

create table if not exists public.wholesaler_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wholesaler_categories_name_unique unique (name)
);

create index if not exists wholesaler_categories_name_idx
  on public.wholesaler_categories (name);
create index if not exists wholesaler_categories_is_active_idx
  on public.wholesaler_categories (is_active);

alter table public.wholesaler_categories enable row level security;

drop trigger if exists set_wholesaler_categories_updated_at on public.wholesaler_categories;
create trigger set_wholesaler_categories_updated_at
before update on public.wholesaler_categories
for each row
execute function public.set_updated_at();

alter table public.wholesalers
  add column if not exists category_id uuid references public.wholesaler_categories (id) on delete set null,
  add column if not exists tax_id text,
  add column if not exists contact_full_name text,
  add column if not exists contact_whatsapp text,
  add column if not exists contact_email text,
  add column if not exists address text,
  add column if not exists delivery_preference text,
  add column if not exists payment_preference text;

create index if not exists wholesalers_category_id_idx
  on public.wholesalers (category_id);

create unique index if not exists wholesalers_tax_id_unique
  on public.wholesalers (tax_id)
  where tax_id is not null and tax_id <> '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'wholesalers_tax_id_max_length'
      and conrelid = 'public.wholesalers'::regclass
  ) then
    alter table public.wholesalers
      add constraint wholesalers_tax_id_max_length check (
        tax_id is null or char_length(tax_id) <= 13
      );
  end if;
end
$$;

do $$
declare
  tbl text;
  tables text[] := array['wholesaler_categories'];
begin
  foreach tbl in array tables loop
    execute format('drop policy if exists %I_authenticated_select on public.%I', tbl, tbl);
    execute format('drop policy if exists %I_authenticated_insert on public.%I', tbl, tbl);
    execute format('drop policy if exists %I_authenticated_update on public.%I', tbl, tbl);
    execute format('drop policy if exists %I_authenticated_delete on public.%I', tbl, tbl);

    execute format(
      'create policy %I_authenticated_select on public.%I for select to authenticated using (auth.uid() is not null)',
      tbl,
      tbl
    );
    execute format(
      'create policy %I_authenticated_insert on public.%I for insert to authenticated with check (auth.uid() is not null)',
      tbl,
      tbl
    );
    execute format(
      'create policy %I_authenticated_update on public.%I for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null)',
      tbl,
      tbl
    );
    execute format(
      'create policy %I_authenticated_delete on public.%I for delete to authenticated using (auth.uid() is not null)',
      tbl,
      tbl
    );
  end loop;
end
$$;
