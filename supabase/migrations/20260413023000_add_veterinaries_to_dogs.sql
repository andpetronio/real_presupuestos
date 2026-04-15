create table if not exists public.veterinaries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists veterinaries_name_unique on public.veterinaries (name);

alter table public.dogs
add column if not exists veterinary_id uuid references public.veterinaries (id) on delete set null;

create index if not exists dogs_veterinary_id_idx on public.dogs (veterinary_id);

create trigger set_veterinaries_updated_at
before update on public.veterinaries
for each row execute function public.set_updated_at();
