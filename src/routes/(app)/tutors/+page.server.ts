import type { PageServerLoad } from './$types';
import type { OperatorMessage } from '$lib/server/shared/ui-state';
import { parsePositiveInteger } from '$lib/server/forms/parsers';

const fallbackErrorMessage: OperatorMessage = {
  kind: 'error',
  title: 'No pudimos cargar tutores',
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
      .from('tutors')
      .select('id, full_name, whatsapp_number, notes, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (searchQuery) {
      query = query.ilike('full_name', `%${searchQuery}%`);
    }

    const { data, count, error } = await query.range(offset, offset + pageSize - 1);

    if (error) throw error;

    const tutors = data ?? [];
    const total = count ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      tutors,
      filters: { search: searchQuery },
      pagination: { page, totalPages, total },
      tableState: total > 0 ? 'success' : 'empty',
      tableMessage:
        total > 0
          ? null
          : ({
              kind: 'empty',
              title: searchQuery ? 'Sin resultados' : 'Todavía no hay tutores cargados',
              detail: searchQuery
                ? 'No se encontraron tutores para la búsqueda.'
                : 'Creá el primero desde "Nuevo tutor".'
            } satisfies OperatorMessage)
    };
  } catch {
    return {
      tutors: [],
      filters: { search: searchQuery },
      pagination: { page: 1, totalPages: 1, total: 0 },
      tableState: 'error',
      tableMessage: fallbackErrorMessage
    };
  }
};
