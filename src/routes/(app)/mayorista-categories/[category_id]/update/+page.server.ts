import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { parseText } from '$lib/server/wholesale-backoffice/wholesalers';

const getCategoryError = (errorMessage: string | undefined): string => {
  if (!errorMessage) {
    return 'No pudimos guardar los cambios de la categoría. Reintentá en unos segundos.';
  }

  const normalized = errorMessage.toLowerCase();
  if (normalized.includes('wholesaler_categories_name_unique')) {
    return 'Ya existe una categoría con ese nombre.';
  }

  return 'No pudimos guardar los cambios de la categoría. Reintentá en unos segundos.';
};

export const load: PageServerLoad = async ({ locals, params }) => {
  const { data, error } = await locals.supabase
    .from('wholesaler_categories')
    .select('id, name, is_active, created_at')
    .eq('id', params.category_id)
    .maybeSingle();

  if (error || !data) {
    throw redirect(303, '/mayorista-categories');
  }

  return { category: data };
};

export const actions: Actions = {
  update: async ({ request, locals, params }) => {
    const formData = await request.formData();
    const name = parseText(formData.get('name'));

    if (!name) {
      return fail(400, {
        operatorError: 'Ingresá un nombre para la categoría.',
        values: { name },
      });
    }

    const { error } = await locals.supabase
      .from('wholesaler_categories')
      .update({ name })
      .eq('id', params.category_id);

    if (error) {
      return fail(400, {
        operatorError: getCategoryError(error.message),
        values: { name },
      });
    }

    throw redirect(303, '/mayorista-categories');
  },
  toggleActive: async ({ request, locals, params }) => {
    const formData = await request.formData();
    const shouldActivate = parseText(formData.get('activate')) === 'true';

    const { error } = await locals.supabase
      .from('wholesaler_categories')
      .update({ is_active: shouldActivate })
      .eq('id', params.category_id);

    if (error) {
      return fail(400, { operatorError: 'No pudimos actualizar el estado de la categoría.' });
    }

    return {
      operatorSuccess: shouldActivate ? 'Categoría restaurada.' : 'Categoría desactivada.',
    };
  },
};
