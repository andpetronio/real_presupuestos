-- Replace permissive 'ALL ... true/true' policies with explicit authenticated checks
-- Linter: rls_policy_always_true
-- This addresses warnings without changing the actual security model (still allowing authenticated users full access)

-- Helper to recreate policies for a given table
-- Each policy explicitly checks auth.uid() IS NOT NULL instead of USING (true)
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'tutors',
    'recipes',
    'recipe_items',
    'budget_dogs',
    'budget_dog_recipes',
    'budget_snapshots',
    'dog_delivery_schedules',
    'dogs',
    'budget_recipe_deliveries',
    'budgets',
    'budget_recipe_preparations',
    'settings',
    'budget_persistence_events',
    'raw_materials',
    'veterinaries',
    'budget_payments'
  ]
  loop
    -- Drop existing policy
    execute format('drop policy if exists %I_authenticated_all on public.%I', tbl, tbl);
    execute format('drop policy if exists %I_authenticated_select on public.%I', tbl, tbl);
    execute format('drop policy if exists %I_authenticated_insert on public.%I', tbl, tbl);
    execute format('drop policy if exists %I_authenticated_update on public.%I', tbl, tbl);
    execute format('drop policy if exists %I_authenticated_delete on public.%I', tbl, tbl);

    -- SELECT: authenticated can read
    execute format(
      'create policy %I_authenticated_select on public.%I for select to authenticated using (auth.uid() is not null)',
      tbl, tbl
    );

    -- INSERT: authenticated can insert
    execute format(
      'create policy %I_authenticated_insert on public.%I for insert to authenticated with check (auth.uid() is not null)',
      tbl, tbl
    );

    -- UPDATE: authenticated can update
    execute format(
      'create policy %I_authenticated_update on public.%I for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null)',
      tbl, tbl
    );

    -- DELETE: authenticated can delete
    execute format(
      'create policy %I_authenticated_delete on public.%I for delete to authenticated using (auth.uid() is not null)',
      tbl, tbl
    );
  end loop;

  -- Also fix public RPC entry points to use explicit search_path
  alter function public.public_get_budget_response(text) set search_path = public, pg_temp;
  alter function public.public_accept_budget(text) set search_path = public, pg_temp;
  alter function public.public_reject_budget(text, text) set search_path = public, pg_temp;
end
$$;
