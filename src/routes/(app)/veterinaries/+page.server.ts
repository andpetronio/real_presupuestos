import type { PageServerLoad } from './$types';
import type { OperatorMessage } from '$lib/server/shared/ui-state';
import { parsePositiveInteger } from '$lib/server/forms/parsers';

const fallbackErrorMessage: OperatorMessage = {
  kind: 'error',
  title: 'No pudimos cargar veterinarias',
  detail: 'Reintentá en unos segundos o revisá la conexión con la base de datos.',
  actionLabel: 'Reintentar'
};

export const load: PageServerLoad = async ({ locals, url }) => {
  // Pagination params
  const page = parsePositiveInteger(url.searchParams.get('page') ?? '') ?? 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  const searchQuery = url.searchParams.get('q')?.trim() ?? '';

  try {
    let query = locals.supabase
      .from('veterinaries')
      .select('id, name, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }

    const { data, count, error } = await query.range(offset, offset + pageSize - 1);

    if (error) throw error;

    const veterinaries = data ?? [];
    const total = count ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      veterinaries,
      filters: { search: searchQuery },
      pagination: { page, totalPages, total },
      tableState: total > 0 ? 'success' : 'empty',
      tableMessage:
        total > 0
          ? null
          : ({
              kind: 'empty',
              title: searchQuery ? 'Sin resultados' : 'Todavía no hay veterinarias cargadas',
              detail: searchQuery
                ? 'No se encontraron veterinarias para la búsqueda.'
                : 'Creá la primera desde "Nueva veterinaria".'
            } satisfies OperatorMessage)
    };
  } catch {
    return {
      veterinaries: [],
      filters: { search: searchQuery },
      pagination: { page: 1, totalPages: 1, total: 0 },
      tableState: 'error',
      tableMessage: fallbackErrorMessage
    };
  }
};
