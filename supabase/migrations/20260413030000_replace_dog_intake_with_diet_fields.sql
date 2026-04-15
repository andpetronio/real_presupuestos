alter table public.dogs
add column if not exists diet_type text,
add column if not exists meals_per_day integer;

update public.dogs
set diet_type = coalesce(diet_type, 'mixta'),
    meals_per_day = coalesce(meals_per_day, 2);

alter table public.dogs
alter column diet_type set not null,
alter column meals_per_day set not null;

alter table public.dogs
add constraint dogs_diet_type_allowed check (diet_type in ('mixta', 'cocida', 'barf')),
add constraint dogs_meals_per_day_positive check (meals_per_day > 0);

alter table public.dogs
drop constraint if exists dogs_daily_food_intake_positive;

alter table public.dogs
drop column if exists daily_food_intake,
drop column if exists intake_unit;
