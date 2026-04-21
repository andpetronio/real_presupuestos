-- Wholesale marketplace (mayoristas) v1

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'wholesale_order_status'
      and n.nspname = 'public'
  ) then
    create type public.wholesale_order_status as enum ('pending', 'delivered', 'paid');
  end if;
end
$$;

create table if not exists public.wholesalers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unique_random_code text not null,
  min_total_units integer not null,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wholesalers_unique_random_code_unique unique (unique_random_code),
  constraint wholesalers_min_total_units_positive check (min_total_units > 0)
);

create index if not exists wholesalers_name_idx on public.wholesalers (name);
create index if not exists wholesalers_is_active_idx on public.wholesalers (is_active);

create table if not exists public.wholesale_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  presentation text not null,
  price_ars numeric(12,2) not null default 0,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wholesale_products_name_presentation_unique unique (name, presentation),
  constraint wholesale_products_price_nonnegative check (price_ars >= 0)
);

create index if not exists wholesale_products_is_active_idx on public.wholesale_products (is_active);

create table if not exists public.wholesale_product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.wholesale_products (id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wholesale_product_images_product_id_idx on public.wholesale_product_images (product_id);
create index if not exists wholesale_product_images_product_sort_idx on public.wholesale_product_images (product_id, sort_order);

create table if not exists public.wholesaler_products (
  id uuid primary key default gen_random_uuid(),
  wholesaler_id uuid not null references public.wholesalers (id) on delete cascade,
  product_id uuid not null references public.wholesale_products (id) on delete cascade,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wholesaler_products_unique unique (wholesaler_id, product_id)
);

create index if not exists wholesaler_products_wholesaler_id_idx on public.wholesaler_products (wholesaler_id);
create index if not exists wholesaler_products_product_id_idx on public.wholesaler_products (product_id);

create table if not exists public.wholesale_orders (
  id uuid primary key default gen_random_uuid(),
  wholesaler_id uuid not null references public.wholesalers (id) on delete restrict,
  status public.wholesale_order_status not null default 'pending',
  total_units integer not null,
  subtotal_ars numeric(12,2) not null default 0,
  total_ars numeric(12,2) not null default 0,
  notes text,
  placed_at timestamptz not null default now(),
  delivered_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wholesale_orders_total_units_positive check (total_units > 0),
  constraint wholesale_orders_subtotal_nonnegative check (subtotal_ars >= 0),
  constraint wholesale_orders_total_nonnegative check (total_ars >= 0)
);

create index if not exists wholesale_orders_wholesaler_id_idx on public.wholesale_orders (wholesaler_id);
create index if not exists wholesale_orders_status_idx on public.wholesale_orders (status);
create index if not exists wholesale_orders_placed_at_idx on public.wholesale_orders (placed_at desc);

create table if not exists public.wholesale_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.wholesale_orders (id) on delete cascade,
  product_id uuid not null references public.wholesale_products (id) on delete restrict,
  quantity integer not null,
  unit_price_ars_snapshot numeric(12,2) not null,
  line_total_ars_snapshot numeric(12,2) not null,
  product_name_snapshot text not null,
  presentation_snapshot text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wholesale_order_items_quantity_positive check (quantity > 0),
  constraint wholesale_order_items_unit_price_nonnegative check (unit_price_ars_snapshot >= 0),
  constraint wholesale_order_items_line_total_nonnegative check (line_total_ars_snapshot >= 0),
  constraint wholesale_order_items_unique_product_per_order unique (order_id, product_id)
);

create index if not exists wholesale_order_items_order_id_idx on public.wholesale_order_items (order_id);
create index if not exists wholesale_order_items_product_id_idx on public.wholesale_order_items (product_id);

create table if not exists public.wholesaler_sessions (
  id uuid primary key default gen_random_uuid(),
  wholesaler_id uuid not null references public.wholesalers (id) on delete cascade,
  session_token_hash text not null,
  expires_at timestamptz not null,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  constraint wholesaler_sessions_session_token_hash_unique unique (session_token_hash)
);

create index if not exists wholesaler_sessions_wholesaler_id_idx on public.wholesaler_sessions (wholesaler_id);
create index if not exists wholesaler_sessions_expires_at_idx on public.wholesaler_sessions (expires_at);

drop trigger if exists set_wholesalers_updated_at on public.wholesalers;
create trigger set_wholesalers_updated_at
before update on public.wholesalers
for each row
execute function public.set_updated_at();

drop trigger if exists set_wholesale_products_updated_at on public.wholesale_products;
create trigger set_wholesale_products_updated_at
before update on public.wholesale_products
for each row
execute function public.set_updated_at();

drop trigger if exists set_wholesale_product_images_updated_at on public.wholesale_product_images;
create trigger set_wholesale_product_images_updated_at
before update on public.wholesale_product_images
for each row
execute function public.set_updated_at();

drop trigger if exists set_wholesaler_products_updated_at on public.wholesaler_products;
create trigger set_wholesaler_products_updated_at
before update on public.wholesaler_products
for each row
execute function public.set_updated_at();

drop trigger if exists set_wholesale_orders_updated_at on public.wholesale_orders;
create trigger set_wholesale_orders_updated_at
before update on public.wholesale_orders
for each row
execute function public.set_updated_at();

drop trigger if exists set_wholesale_order_items_updated_at on public.wholesale_order_items;
create trigger set_wholesale_order_items_updated_at
before update on public.wholesale_order_items
for each row
execute function public.set_updated_at();

create or replace function public.generate_wholesaler_code(p_length integer default 10)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
begin
  if p_length < 6 then
    p_length := 6;
  end if;

  for i in 1..p_length loop
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;

  return result;
end;
$$;

create or replace function public.wholesale_login_by_code(
  p_code text,
  p_session_token_hash text,
  p_expires_at timestamptz
)
returns table(
  ok boolean,
  wholesaler_id uuid,
  wholesaler_name text,
  min_total_units integer,
  error_code text
)
language sql
security definer
set search_path = public
as $$
  with normalized as (
    select nullif(trim(p_code), '') as code
  ),
  matched_wholesaler as (
    select w.id, w.name, w.min_total_units
    from public.wholesalers as w
    cross join normalized as n
    where n.code is not null
      and w.unique_random_code = n.code
      and w.is_active = true
    limit 1
  ),
  inserted_session as (
    insert into public.wholesaler_sessions (
      wholesaler_id,
      session_token_hash,
      expires_at,
      last_seen_at
    )
    select mw.id, p_session_token_hash, p_expires_at, now()
    from matched_wholesaler as mw
    returning wholesaler_id
  )
  select
    case
      when n.code is null then false
      when mw.id is null then false
      else true
    end as ok,
    case
      when mw.id is null then null::uuid
      else mw.id
    end as wholesaler_id,
    case
      when mw.id is null then ''::text
      else mw.name
    end as wholesaler_name,
    case
      when mw.id is null then 0::integer
      else mw.min_total_units
    end as min_total_units,
    case
      when n.code is null then 'invalid_code'::text
      when mw.id is null then 'not_found'::text
      else ''::text
    end as error_code
  from normalized as n
  left join matched_wholesaler as mw on true
  left join inserted_session as s on s.wholesaler_id = mw.id;
$$;

create or replace function public.wholesale_get_portal_data(p_session_token_hash text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with active_session as (
    select
      s.id as session_id,
      w.id as wholesaler_id,
      w.name as wholesaler_name,
      w.min_total_units
    from public.wholesaler_sessions s
    join public.wholesalers w on w.id = s.wholesaler_id
    where s.session_token_hash = p_session_token_hash
      and s.expires_at > now()
      and w.is_active = true
    limit 1
  ),
  touched_session as (
    update public.wholesaler_sessions s
    set last_seen_at = now()
    where s.id in (select session_id from active_session)
    returning s.id
  ),
  products as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'presentation', p.presentation,
          'description', p.description,
          'price_ars', p.price_ars,
          'images', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', i.id,
                'public_url', i.public_url,
                'sort_order', i.sort_order
              )
              order by i.sort_order asc, i.created_at asc
            )
            from public.wholesale_product_images i
            where i.product_id = p.id
          ), '[]'::jsonb)
        )
        order by p.name asc, p.presentation asc
      ),
      '[]'::jsonb
    ) as product_list
    from public.wholesaler_products wp
    join public.wholesale_products p on p.id = wp.product_id
    where wp.wholesaler_id = (select wholesaler_id from active_session)
      and wp.is_enabled = true
      and p.is_active = true
  )
  select case
    when exists(select 1 from active_session) then jsonb_build_object(
      'ok', true,
      'wholesaler', jsonb_build_object(
        'id', (select wholesaler_id from active_session),
        'name', (select wholesaler_name from active_session),
        'min_total_units', (select min_total_units from active_session)
      ),
      'products', coalesce((select product_list from products), '[]'::jsonb)
    )
    else jsonb_build_object('ok', false, 'error_code', 'session_invalid')
  end
  from (select count(*) from touched_session) as _;
$$;

create or replace function public.wholesale_logout_by_token_hash(p_session_token_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.wholesaler_sessions where session_token_hash = p_session_token_hash;
  return true;
end;
$$;

create or replace function public.wholesale_place_order(
  p_session_token_hash text,
  p_items jsonb,
  p_notes text default null
)
returns table(
  ok boolean,
  order_id uuid,
  total_units integer,
  total_ars numeric(12,2),
  error_code text
)
language sql
security definer
set search_path = public
as $$
  with active_session as (
    select
      s.id as session_id,
      w.id as wholesaler_id,
      w.min_total_units
    from public.wholesaler_sessions s
    join public.wholesalers w on w.id = s.wholesaler_id
    where s.session_token_hash = p_session_token_hash
      and s.expires_at > now()
      and w.is_active = true
    limit 1
  ),
  parsed_items as (
    select
      (item->>'product_id')::uuid as product_id,
      greatest(0, coalesce((item->>'quantity')::integer, 0)) as quantity
    from jsonb_array_elements(
      case
        when p_items is not null and jsonb_typeof(p_items) = 'array' then p_items
        else '[]'::jsonb
      end
    ) item
  ),
  grouped as (
    select product_id, sum(quantity)::integer as quantity
    from parsed_items
    group by product_id
  ),
  validated as (
    select
      g.product_id,
      g.quantity,
      p.name,
      p.presentation,
      p.price_ars
    from grouped g
    join public.wholesaler_products wp
      on wp.product_id = g.product_id
     and wp.wholesaler_id = (select wholesaler_id from active_session)
     and wp.is_enabled = true
    join public.wholesale_products p
      on p.id = g.product_id
     and p.is_active = true
    where g.quantity > 0
  ),
  totals as (
    select
      coalesce(sum(v.quantity), 0)::integer as total_units_value,
      coalesce(sum(v.quantity * v.price_ars), 0)::numeric(12,2) as total_ars_value
    from validated v
  ),
  inserted_order as (
    insert into public.wholesale_orders (
      wholesaler_id,
      status,
      total_units,
      subtotal_ars,
      total_ars,
      notes,
      placed_at
    )
    select
      (select wholesaler_id from active_session),
      'pending',
      (select total_units_value from totals),
      (select total_ars_value from totals),
      (select total_ars_value from totals),
      nullif(trim(coalesce(p_notes, '')), ''),
      now()
    where exists(select 1 from active_session)
      and p_items is not null
      and jsonb_typeof(p_items) = 'array'
      and jsonb_array_length(p_items) > 0
      and (select total_units_value from totals) > 0
      and (select total_units_value from totals) >= (select min_total_units from active_session)
    returning id
  ),
  inserted_items as (
    insert into public.wholesale_order_items (
      order_id,
      product_id,
      quantity,
      unit_price_ars_snapshot,
      line_total_ars_snapshot,
      product_name_snapshot,
      presentation_snapshot
    )
    select
      (select id from inserted_order),
      v.product_id,
      v.quantity,
      v.price_ars,
      (v.quantity * v.price_ars)::numeric(12,2),
      v.name,
      v.presentation
    from validated v
    where exists(select 1 from inserted_order)
    returning id
  )
  select
    case
      when not exists(select 1 from active_session) then false
      when p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then false
      when (select total_units_value from totals) = 0 then false
      when (select total_units_value from totals) < (select min_total_units from active_session) then false
      else true
    end as ok,
    case
      when exists(select 1 from inserted_order) then (select id from inserted_order)
      else null::uuid
    end as order_id,
    case
      when not exists(select 1 from active_session) then 0::integer
      when p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then 0::integer
      when (select total_units_value from totals) = 0 then 0::integer
      else (select total_units_value from totals)
    end as total_units,
    case
      when not exists(select 1 from active_session) then 0::numeric(12,2)
      when p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then 0::numeric(12,2)
      when (select total_units_value from totals) = 0 then 0::numeric(12,2)
      else (select total_ars_value from totals)
    end as total_ars,
    case
      when not exists(select 1 from active_session) then 'session_invalid'::text
      when p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then 'empty_cart'::text
      when (select total_units_value from totals) = 0 then 'no_valid_items'::text
      when (select total_units_value from totals) < (select min_total_units from active_session) then 'min_units_not_met'::text
      else ''::text
    end as error_code
  from (select count(*) from inserted_items) as _;
$$;

create or replace function public.wholesale_dashboard_top_wholesalers()
returns table(
  wholesaler_name text,
  total_units bigint,
  total_ars numeric(12,2)
)
language sql
security definer
set search_path = public
as $$
  select
    w.name as wholesaler_name,
    coalesce(sum(o.total_units), 0)::bigint as total_units,
    coalesce(sum(o.total_ars), 0)::numeric(12,2) as total_ars
  from public.wholesale_orders o
  join public.wholesalers w on w.id = o.wholesaler_id
  group by w.name
  order by total_ars desc, total_units desc
  limit 10;
$$;

create or replace function public.wholesale_dashboard_top_products()
returns table(
  product_name text,
  total_units bigint,
  total_ars numeric(12,2)
)
language sql
security definer
set search_path = public
as $$
  select
    i.product_name_snapshot as product_name,
    coalesce(sum(i.quantity), 0)::bigint as total_units,
    coalesce(sum(i.line_total_ars_snapshot), 0)::numeric(12,2) as total_ars
  from public.wholesale_order_items i
  group by i.product_name_snapshot
  order by total_ars desc, total_units desc
  limit 10;
$$;

-- RLS for admin-managed tables
alter table public.wholesalers enable row level security;
alter table public.wholesale_products enable row level security;
alter table public.wholesale_product_images enable row level security;
alter table public.wholesaler_products enable row level security;
alter table public.wholesale_orders enable row level security;
alter table public.wholesale_order_items enable row level security;
alter table public.wholesaler_sessions enable row level security;

do $$
declare
  tbl text;
  tables text[] := array[
    'wholesalers',
    'wholesale_products',
    'wholesale_product_images',
    'wholesaler_products',
    'wholesale_orders',
    'wholesale_order_items',
    'wholesaler_sessions'
  ];
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

revoke all on function public.wholesale_login_by_code(text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.wholesale_get_portal_data(text) from public, anon, authenticated;
revoke all on function public.wholesale_logout_by_token_hash(text) from public, anon, authenticated;
revoke all on function public.wholesale_place_order(text, jsonb, text) from public, anon, authenticated;
revoke all on function public.wholesale_dashboard_top_wholesalers() from public, anon, authenticated;
revoke all on function public.wholesale_dashboard_top_products() from public, anon, authenticated;

grant execute on function public.wholesale_login_by_code(text, text, timestamptz) to anon, authenticated;
grant execute on function public.wholesale_get_portal_data(text) to anon, authenticated;
grant execute on function public.wholesale_logout_by_token_hash(text) to anon, authenticated;
grant execute on function public.wholesale_place_order(text, jsonb, text) to anon, authenticated;
grant execute on function public.wholesale_dashboard_top_wholesalers() to authenticated;
grant execute on function public.wholesale_dashboard_top_products() to authenticated;

-- Storage bucket for wholesale product images
insert into storage.buckets (id, name, public)
values ('wholesale-products', 'wholesale-products', true)
on conflict (id) do nothing;

drop policy if exists wholesale_products_images_authenticated_read on storage.objects;
drop policy if exists wholesale_products_images_authenticated_write on storage.objects;
drop policy if exists wholesale_products_images_authenticated_update on storage.objects;
drop policy if exists wholesale_products_images_authenticated_delete on storage.objects;

create policy wholesale_products_images_authenticated_read
on storage.objects
for select
to authenticated
using (bucket_id = 'wholesale-products');

create policy wholesale_products_images_authenticated_write
on storage.objects
for insert
to authenticated
with check (bucket_id = 'wholesale-products');

create policy wholesale_products_images_authenticated_update
on storage.objects
for update
to authenticated
using (bucket_id = 'wholesale-products')
with check (bucket_id = 'wholesale-products');

create policy wholesale_products_images_authenticated_delete
on storage.objects
for delete
to authenticated
using (bucket_id = 'wholesale-products');
