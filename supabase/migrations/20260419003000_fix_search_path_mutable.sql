-- Fix search_path warnings for existing functions
-- Linter: function_search_path_mutable

alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.validate_budget_recipe_tracking_days_limit() set search_path = public, pg_temp;