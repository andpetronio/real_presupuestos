create or replace function public.public_get_budget_response(p_token text)
returns table (
  id uuid,
  status public.budget_status,
  final_sale_price numeric,
  expires_at timestamptz,
  notes text,
  rejection_reason text,
  accepted_at timestamptz,
  rejected_at timestamptz,
  sent_at timestamptz,
  tutor_name text,
  can_respond boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_token text;
  v_active_statuses public.budget_status[] := array[
    'draft'::public.budget_status,
    'ready_to_send'::public.budget_status,
    'sent'::public.budget_status
  ];
  v_budget record;
begin
  v_token := nullif(trim(p_token), '');
  if v_token is null then
    return;
  end if;

  select
    b.id,
    b.status,
    b.final_sale_price,
    b.expires_at,
    b.notes,
    b.rejection_reason,
    b.accepted_at,
    b.rejected_at,
    b.sent_at,
    coalesce(t.full_name, 'Sin tutor') as tutor_name
  into v_budget
  from public.budgets b
  left join public.tutors t on t.id = b.tutor_id
  where b.public_token = v_token
  limit 1;

  if not found then
    return;
  end if;

  if
    v_budget.status = any(v_active_statuses)
    and v_budget.expires_at is not null
    and v_budget.expires_at <= now()
  then
    update public.budgets
    set status = 'expired'
    where id = v_budget.id
      and status = any(v_active_statuses);

    v_budget.status := 'expired'::public.budget_status;
  end if;

  return query
  select
    v_budget.id,
    v_budget.status,
    v_budget.final_sale_price,
    v_budget.expires_at,
    v_budget.notes,
    v_budget.rejection_reason,
    v_budget.accepted_at,
    v_budget.rejected_at,
    v_budget.sent_at,
    v_budget.tutor_name,
    (
      v_budget.status = any(v_active_statuses)
      and (v_budget.expires_at is null or v_budget.expires_at > now())
    ) as can_respond;
end;
$$;

create or replace function public.public_accept_budget(p_token text)
returns table (
  ok boolean,
  code text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_token text;
  v_active_statuses public.budget_status[] := array[
    'draft'::public.budget_status,
    'ready_to_send'::public.budget_status,
    'sent'::public.budget_status
  ];
  v_budget_id uuid;
  v_status public.budget_status;
  v_expires_at timestamptz;
begin
  v_token := nullif(trim(p_token), '');
  if v_token is null then
    return query select false, 'invalid_token';
    return;
  end if;

  select b.id, b.status, b.expires_at
  into v_budget_id, v_status, v_expires_at
  from public.budgets b
  where b.public_token = v_token
  limit 1;

  if not found then
    return query select false, 'not_found';
    return;
  end if;

  if
    v_status = any(v_active_statuses)
    and v_expires_at is not null
    and v_expires_at <= now()
  then
    update public.budgets
    set status = 'expired'
    where id = v_budget_id
      and status = any(v_active_statuses);

    v_status := 'expired'::public.budget_status;
  end if;

  if v_status <> all(v_active_statuses) then
    return query
    select
      false,
      case
        when v_status = 'accepted'::public.budget_status then 'blocked_accepted'
        when v_status = 'rejected'::public.budget_status then 'blocked_rejected'
        when v_status = 'expired'::public.budget_status then 'blocked_expired'
        else 'blocked_other'
      end;
    return;
  end if;

  update public.budgets
  set
    status = 'accepted',
    accepted_at = now(),
    rejected_at = null,
    rejection_reason = null
  where id = v_budget_id
    and status = any(v_active_statuses);

  if not found then
    return query select false, 'blocked_other';
    return;
  end if;

  return query select true, 'updated';
end;
$$;

create or replace function public.public_reject_budget(
  p_token text,
  p_rejection_reason text
)
returns table (
  ok boolean,
  code text,
  rejection_reason text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_token text;
  v_reason text;
  v_active_statuses public.budget_status[] := array[
    'draft'::public.budget_status,
    'ready_to_send'::public.budget_status,
    'sent'::public.budget_status
  ];
  v_budget_id uuid;
  v_status public.budget_status;
  v_expires_at timestamptz;
begin
  v_token := nullif(trim(p_token), '');
  if v_token is null then
    return query select false, 'invalid_token', '';
    return;
  end if;

  if char_length(trim(coalesce(p_rejection_reason, ''))) > 500 then
    return query select false, 'reason_too_long', trim(coalesce(p_rejection_reason, ''));
    return;
  end if;

  v_reason := nullif(trim(coalesce(p_rejection_reason, '')), '');

  select b.id, b.status, b.expires_at
  into v_budget_id, v_status, v_expires_at
  from public.budgets b
  where b.public_token = v_token
  limit 1;

  if not found then
    return query select false, 'not_found', coalesce(v_reason, '');
    return;
  end if;

  if
    v_status = any(v_active_statuses)
    and v_expires_at is not null
    and v_expires_at <= now()
  then
    update public.budgets
    set status = 'expired'
    where id = v_budget_id
      and status = any(v_active_statuses);

    v_status := 'expired'::public.budget_status;
  end if;

  if v_status <> all(v_active_statuses) then
    return query
    select
      false,
      case
        when v_status = 'accepted'::public.budget_status then 'blocked_accepted'
        when v_status = 'rejected'::public.budget_status then 'blocked_rejected'
        when v_status = 'expired'::public.budget_status then 'blocked_expired'
        else 'blocked_other'
      end,
      coalesce(v_reason, '');
    return;
  end if;

  update public.budgets
  set
    status = 'rejected',
    rejected_at = now(),
    accepted_at = null,
    rejection_reason = v_reason
  where id = v_budget_id
    and status = any(v_active_statuses);

  if not found then
    return query select false, 'blocked_other', coalesce(v_reason, '');
    return;
  end if;

  return query select true, 'updated', coalesce(v_reason, '');
end;
$$;

revoke all on function public.public_get_budget_response(text) from public, anon, authenticated;
revoke all on function public.public_accept_budget(text) from public, anon, authenticated;
revoke all on function public.public_reject_budget(text, text) from public, anon, authenticated;

grant execute on function public.public_get_budget_response(text) to anon, authenticated;
grant execute on function public.public_accept_budget(text) to anon, authenticated;
grant execute on function public.public_reject_budget(text, text) to anon, authenticated;
