alter table public.tutors
add column if not exists is_active boolean not null default true;

create index if not exists tutors_is_active_idx on public.tutors (is_active);
