import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { OperatorMessage } from '$lib/server/shared/ui-state';
import { parsePositiveInteger } from '$lib/server/forms/parsers';

const fallbackErrorMessage: OperatorMessage = {
  kind: 'error',
  title: 'No pudimos cargar perros',
  detail: 'Reintentá en unos segundos o revisá la conexión con la base de datos.',
  actionLabel: 'Reintentar'
};

const parseFormValue = (value: FormDataEntryValue | null): string =>
  typeof value === 'string' ? value.trim() : '';

export const load: PageServerLoad = async ({ locals, url }) => {
  // Pagination params
  const page = parsePositiveInteger(url.searchParams.get('page') ?? '') ?? 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  const searchQuery = url.searchParams.get('q')?.trim() ?? '';
  const statusParam = url.searchParams.get('status') ?? 'active';

  try {
    let query = locals.supabase
      .from('dogs')
      .select(
        'id, name, diet_type, meals_per_day, is_active, notes, created_at, tutor:tutors(full_name), veterinary:veterinaries(name)',
        { count: 'exact' }
      )
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

    const dogs = data ?? [];
    const total = count ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      dogs,
      filters: { search: searchQuery, status: statusParam },
      pagination: { page, totalPages, total },
      tableState: total > 0 ? 'success' : 'empty',
      tableMessage:
        total > 0
          ? null
          : ({
              kind: 'empty',
              title: searchQuery ? 'Sin resultados' : 'Todavía no hay perros cargados',
              detail: searchQuery
                ? 'No se encontraron perros para la búsqueda.'
                : 'Creá el primero desde "Nuevo perro".'
            } satisfies OperatorMessage)
    };
  } catch {
    return {
      dogs: [],
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
    const dogId = parseFormValue(formData.get('dogId'));

    if (!dogId) {
      return fail(400, {
        actionType: 'delete',
        operatorError: 'No encontramos el perro a desactivar.'
      });
    }

    const { error } = await locals.supabase.from('dogs').update({ is_active: false }).eq('id', dogId);

    if (error) {
      return fail(400, {
        actionType: 'delete',
        operatorError: 'No pudimos desactivar el perro. Reintentá en unos segundos.'
      });
    }

    return {
      actionType: 'delete',
      operatorSuccess: 'Perro desactivado correctamente.'
    };
  }
};
