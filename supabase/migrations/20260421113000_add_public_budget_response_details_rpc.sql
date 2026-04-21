create or replace function public.public_get_budget_response_details(p_token text)
returns table (
  dog_id uuid,
  dog_name text,
  recipe_id uuid,
  recipe_name text,
  raw_material_name text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_token text;
begin
  v_token := nullif(trim(p_token), '');
  if v_token is null then
    return;
  end if;

  return query
  with budget_target as (
    select b.id as budget_id
    from public.budgets b
    where b.public_token = v_token
    limit 1
  ),
  assignments as (
    select distinct bd.dog_id, bdr.recipe_id
    from public.budget_dogs bd
    join budget_target bt on bt.budget_id = bd.budget_id
    join public.budget_dog_recipes bdr on bdr.budget_dog_id = bd.id
  )
  select
    a.dog_id as dog_id,
    coalesce(nullif(trim(d.name), ''), 'Perro') as dog_name,
    a.recipe_id as recipe_id,
    coalesce(nullif(trim(r.name), ''), 'Receta') as recipe_name,
    nullif(trim(rm.name), '') as raw_material_name
  from assignments a
  left join public.dogs d on d.id = a.dog_id
  left join public.recipes r on r.id = a.recipe_id
  left join public.recipe_items ri on ri.recipe_id = a.recipe_id
  left join public.raw_materials rm on rm.id = ri.raw_material_id
  order by
    coalesce(nullif(trim(d.name), ''), 'Perro'),
    a.dog_id,
    coalesce(nullif(trim(r.name), ''), 'Receta'),
    a.recipe_id,
    nullif(trim(rm.name), '');
end;
$$;

revoke all on function public.public_get_budget_response_details(text) from public, anon, authenticated;
grant execute on function public.public_get_budget_response_details(text) to anon, authenticated;
