-- Wholesale v2: delivery days, operational statuses, expected delivery, partial prep and payment method

alter table public.wholesalers
  add column if not exists delivery_days integer not null default 7;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'wholesalers_delivery_days_positive'
      AND conrelid = 'public.wholesalers'::regclass
  ) THEN
    ALTER TABLE public.wholesalers
      ADD CONSTRAINT wholesalers_delivery_days_positive CHECK (delivery_days > 0);
  END IF;
END
$$;

alter table public.wholesale_orders
  add column if not exists expected_delivery_at timestamptz,
  add column if not exists ready_at timestamptz,
  add column if not exists payment_method text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'wholesale_orders_payment_method_valid'
      AND conrelid = 'public.wholesale_orders'::regclass
  ) THEN
    ALTER TABLE public.wholesale_orders
      ADD CONSTRAINT wholesale_orders_payment_method_valid
      CHECK (payment_method in ('cash', 'transfer', 'mercadopago', 'other') or payment_method is null);
  END IF;
END
$$;

alter table public.wholesale_order_items
  add column if not exists prepared_quantity integer not null default 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'wholesale_order_items_prepared_quantity_nonnegative'
      AND conrelid = 'public.wholesale_order_items'::regclass
  ) THEN
    ALTER TABLE public.wholesale_order_items
      ADD CONSTRAINT wholesale_order_items_prepared_quantity_nonnegative
      CHECK (prepared_quantity >= 0);
  END IF;
END
$$;

-- Populate expected delivery for historical rows
update public.wholesale_orders o
set expected_delivery_at = o.placed_at + make_interval(days => greatest(1, coalesce(w.delivery_days, 7)))
from public.wholesalers w
where o.wholesaler_id = w.id
  and o.expected_delivery_at is null;

alter table public.wholesale_orders
  alter column expected_delivery_at set not null;

-- Migrate enum values: pending/delivered/paid -> received/in_preparation/ready/paid (using ready as legacy delivered)
alter table public.wholesale_orders
  alter column status drop default;

alter table public.wholesale_orders
  alter column status type text using status::text;

update public.wholesale_orders
set status = case
  when status = 'pending' then 'received'
  when status = 'delivered' then 'ready'
  when status = 'paid' then 'paid'
  else status
end;

DROP TYPE IF EXISTS public.wholesale_order_status;
create type public.wholesale_order_status as enum ('received', 'in_preparation', 'ready', 'paid');

alter table public.wholesale_orders
  alter column status type public.wholesale_order_status using status::public.wholesale_order_status,
  alter column status set default 'received';

-- Backfill ready_at for rows already ready/paid when missing
update public.wholesale_orders
set ready_at = coalesce(ready_at, delivered_at, paid_at, placed_at)
where status in ('ready', 'paid')
  and ready_at is null;

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
      w.min_total_units,
      w.delivery_days
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
  ),
  orders as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', o.id,
          'status', o.status,
          'total_units', o.total_units,
          'total_ars', o.total_ars,
          'placed_at', o.placed_at,
          'expected_delivery_at', o.expected_delivery_at
        )
        order by o.placed_at desc
      ),
      '[]'::jsonb
    ) as order_list
    from public.wholesale_orders o
    where o.wholesaler_id = (select wholesaler_id from active_session)
  )
  select case
    when exists(select 1 from active_session) then jsonb_build_object(
      'ok', true,
      'wholesaler', jsonb_build_object(
        'id', (select wholesaler_id from active_session),
        'name', (select wholesaler_name from active_session),
        'min_total_units', (select min_total_units from active_session),
        'delivery_days', (select delivery_days from active_session)
      ),
      'products', coalesce((select product_list from products), '[]'::jsonb),
      'orders', coalesce((select order_list from orders), '[]'::jsonb)
    )
    else jsonb_build_object('ok', false, 'error_code', 'session_invalid')
  end
  from (select count(*) from touched_session) as _;
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
      w.min_total_units,
      w.delivery_days
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
      placed_at,
      expected_delivery_at
    )
    select
      (select wholesaler_id from active_session),
      'received',
      (select total_units_value from totals),
      (select total_ars_value from totals),
      (select total_ars_value from totals),
      nullif(trim(coalesce(p_notes, '')), ''),
      now(),
      now() + make_interval(days => (select greatest(1, delivery_days) from active_session))
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
      prepared_quantity,
      unit_price_ars_snapshot,
      line_total_ars_snapshot,
      product_name_snapshot,
      presentation_snapshot
    )
    select
      (select id from inserted_order),
      v.product_id,
      v.quantity,
      0,
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
