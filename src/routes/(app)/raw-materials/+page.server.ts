import type { PageServerLoad } from './$types';
import type { OperatorMessage } from '$lib/server/shared/ui-state';
import { parsePositiveInteger } from '$lib/server/forms/parsers';

const fallbackErrorMessage: OperatorMessage = {
  kind: 'error',
  title: 'No pudimos cargar materias primas',
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
      .from('raw_materials')
      .select('id, name, base_unit, purchase_quantity, base_cost, wastage_percentage, cost_with_wastage, is_active, created_at', { count: 'exact' })
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

    const rawMaterials = data ?? [];
    const total = count ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      rawMaterials,
      filters: { search: searchQuery, status: statusParam },
      pagination: { page, totalPages, total },
      tableState: total > 0 ? 'success' : 'empty',
      tableMessage:
        total > 0
          ? null
          : ({
              kind: 'empty',
              title: searchQuery ? 'Sin resultados' : 'Todavía no hay materias primas',
              detail: searchQuery
                ? 'No se encontraron materias primas para la búsqueda.'
                : 'Creá la primera desde "Nueva materia prima".'
            } satisfies OperatorMessage)
    };
  } catch {
    return {
      rawMaterials: [],
      filters: { search: searchQuery, status: statusParam },
      pagination: { page: 1, totalPages: 1, total: 0 },
      tableState: 'error',
      tableMessage: fallbackErrorMessage
    };
  }
};
