do $$
declare
  table_name text;
begin
  foreach table_name in array array[
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
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I_authenticated_all on public.%I', table_name, table_name);
    execute format(
      'create policy %I_authenticated_all on public.%I for all to authenticated using (true) with check (true)',
      table_name,
      table_name
    );
  end loop;
end
$$;
