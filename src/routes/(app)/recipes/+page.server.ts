import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { OperatorMessage } from '$lib/server/shared/ui-state';
import { parseFormValue, parsePositiveInteger } from '$lib/server/forms/parsers';

const fallbackErrorMessage: OperatorMessage = {
  kind: 'error',
  title: 'No pudimos cargar recetas',
  detail: 'Reintentá en unos segundos o revisá la conexión con la base de datos.',
  actionLabel: 'Reintentar'
};

export const load: PageServerLoad = async ({ locals, url }) => {
  // Pagination params
  const page = parsePositiveInteger(url.searchParams.get('page') ?? '') ?? 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  const searchQuery = url.searchParams.get('q')?.trim() ?? '';
  const statusParam = url.searchParams.get('status') ?? 'active';

  try {
    let query = locals.supabase
      .from('recipes')
      .select('id, dog_id, name, notes, is_active, created_at, dog:dogs(name)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }

    // Status filter
    if (statusParam !== 'all') {
      if (statusParam === 'active') {
        query = query.eq('is_active', true);
      } else if (statusParam === 'inactive') {
        query = query.eq('is_active', false);
      }
    }

    const { data, count, error } = await query.range(offset, offset + pageSize - 1);

    if (error) throw error;

    const recipes = data ?? [];
    const total = count ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      recipes,
      filters: { search: searchQuery, status: statusParam },
      pagination: { page, totalPages, total },
      tableState: total > 0 ? 'success' : 'empty',
      tableMessage:
        total > 0
          ? null
          : ({
              kind: 'empty',
              title: searchQuery ? 'Sin resultados' : 'Todavía no hay recetas',
              detail: searchQuery
                ? 'No se encontraron recetas para la búsqueda.'
                : 'Creá la primera desde "Nueva receta".'
            } satisfies OperatorMessage)
    };
  } catch {
    return {
      recipes: [],
      filters: { search: searchQuery, status: statusParam },
      pagination: { page: 1, totalPages: 1, total: 0 },
      tableState: 'error',
      tableMessage: fallbackErrorMessage
    };
  }
};

export const actions: Actions = {
  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const recipeId = parseFormValue(formData.get('recipeId'));

    if (!recipeId) {
      return fail(400, {
        actionType: 'delete',
        operatorError: 'No encontramos la receta a desactivar.'
      });
    }

    const { error } = await locals.supabase
      .from('recipes')
      .update({ is_active: false })
      .eq('id', recipeId);

    if (error) {
      return fail(400, {
        actionType: 'delete',
        operatorError: 'No pudimos desactivar la receta. Reintenta en unos segundos.'
      });
    }

    return {
      actionType: 'delete',
      operatorSuccess: 'Receta desactivada correctamente.'
    };
  }
};
