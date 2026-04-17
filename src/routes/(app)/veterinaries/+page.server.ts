import type { PageServerLoad } from './$types';
import {
  buildFallbackError,
  getTableState,
  getPagination,
  applyListFilters
} from '$lib/server/shared/list-helpers';

const EMPTY_LABELS = {
  title: 'Todavía no hay veterinarias cargadas',
  detail: 'Creá la primera desde "Nueva veterinaria".'
};

export const load: PageServerLoad = async ({ locals, url }) => {
  const { page, pageSize, offset } = getPagination(url.searchParams.get('page'));
  const filters = {
    search: url.searchParams.get('q')?.trim() ?? ''
  };

  try {
    let query = locals.supabase
      .from('veterinaries')
      .select('id, name, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });

    query = applyListFilters(query, filters, { searchColumn: 'name' });

    const { data, count, error } = await query.range(offset, offset + pageSize - 1);

    if (error) throw error;

    const veterinaries = data ?? [];
    const total = count ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    const { tableState, tableMessage } = getTableState(total, filters, EMPTY_LABELS);

    return {
      veterinaries,
      filters,
      pagination: { page, totalPages, total },
      tableState,
      tableMessage
    };
  } catch {
    return {
      veterinaries: [],
      filters,
      pagination: { page: 1, totalPages: 1, total: 0 },
      tableState: 'error',
      tableMessage: buildFallbackError('veterinarias')
    };
  }
};