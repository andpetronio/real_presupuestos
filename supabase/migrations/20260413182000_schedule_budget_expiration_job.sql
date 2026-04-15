create or replace function public.expire_overdue_budgets()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_count integer := 0;
begin
  update public.budgets
  set status = 'expired'
  where status in ('draft', 'ready_to_send', 'sent')
    and expires_at is not null
    and expires_at <= now();

  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'expire_overdue_budgets_job';

    perform cron.schedule(
      'expire_overdue_budgets_job',
      '*/15 * * * *',
      $$select public.expire_overdue_budgets();$$
    );
  end if;
end;
$$;
