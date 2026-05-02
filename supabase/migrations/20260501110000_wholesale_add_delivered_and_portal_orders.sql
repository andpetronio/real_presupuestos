-- Wholesale v2.1: add delivered status and dedicated portal orders RPC

alter table public.wholesale_orders
  alter column status drop default;

alter table public.wholesale_orders
  alter column status type text using status::text;

update public.wholesale_orders
set status = case
  when status = 'received' then 'received'
  when status = 'in_preparation' then 'in_preparation'
  when status = 'ready' then 'ready'
  when status = 'paid' then 'paid'
  else status
end;

drop type if exists public.wholesale_order_status;
create type public.wholesale_order_status as enum (
  'received',
  'in_preparation',
  'ready',
  'delivered',
  'paid'
);

alter table public.wholesale_orders
  alter column status type public.wholesale_order_status using status::public.wholesale_order_status,
  alter column status set default 'received';

create or replace function public.wholesale_get_portal_orders(
  p_session_token_hash text,
  p_status text default 'all'
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with active_session as (
    select
      s.id as session_id,
      w.id as wholesaler_id,
      w.name as wholesaler_name
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
  filtered_orders as (
    select o.*
    from public.wholesale_orders o
    where o.wholesaler_id = (select wholesaler_id from active_session)
      and (
        p_status = 'all'
        or o.status::text = p_status
      )
  ),
  orders as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', o.id,
          'status', o.status,
          'total_units', o.total_units,
          'total_ars', o.total_ars,
          'notes', o.notes,
          'placed_at', o.placed_at,
          'expected_delivery_at', o.expected_delivery_at,
          'ready_at', o.ready_at,
          'delivered_at', o.delivered_at,
          'paid_at', o.paid_at,
          'payment_method', o.payment_method,
          'items', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', i.id,
                'quantity', i.quantity,
                'unit_price_ars_snapshot', i.unit_price_ars_snapshot,
                'line_total_ars_snapshot', i.line_total_ars_snapshot,
                'product_name_snapshot', i.product_name_snapshot,
                'presentation_snapshot', i.presentation_snapshot
              )
              order by i.created_at asc
            )
            from public.wholesale_order_items i
            where i.order_id = o.id
          ), '[]'::jsonb)
        )
        order by o.placed_at desc
      ),
      '[]'::jsonb
    ) as order_list
    from filtered_orders o
  )
  select case
    when exists(select 1 from active_session) then jsonb_build_object(
      'ok', true,
      'wholesaler', jsonb_build_object(
        'id', (select wholesaler_id from active_session),
        'name', (select wholesaler_name from active_session)
      ),
      'orders', coalesce((select order_list from orders), '[]'::jsonb)
    )
    else jsonb_build_object('ok', false, 'error_code', 'session_invalid')
  end
  from (select count(*) from touched_session) as _;
$$;

revoke all on function public.wholesale_get_portal_orders(text, text) from public, anon, authenticated;
grant execute on function public.wholesale_get_portal_orders(text, text) to anon, authenticated;
