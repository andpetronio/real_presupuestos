revoke all on function public.expire_overdue_budgets() from public, anon, authenticated;

revoke all on function public.generate_wholesaler_code(integer) from public, anon, authenticated;

drop policy if exists wholesale_products_images_authenticated_read on storage.objects;
