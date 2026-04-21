import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  applyListFilters,
  buildFallbackError,
  getPagination,
  getTableState,
} from '$lib/server/shared/list-helpers';
import { parseText } from '$lib/server/wholesale-backoffice/wholesalers';
import type { WholesalerCategoryListRow } from '$lib/types/view-models/wholesaler-categories';

const EMPTY_LABELS = {
  title: 'Todavía no hay categorías mayoristas',
  detail: 'Creá la primera categoría para clasificar mayoristas.',
};

export const load: PageServerLoad = async ({ locals, url }) => {
  const { page, pageSize, offset } = getPagination(url.searchParams.get('page'));
  const filters = {
    search: url.searchParams.get('q')?.trim() ?? '',
    status: url.searchParams.get('status')?.trim() ?? 'active',
  };

  try {
    let query = locals.supabase
      .from('wholesaler_categories')
      .select('id, name, is_active, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });

    query = applyListFilters(query, filters, {
      searchColumn: 'name',
      hasStatusFilter: true,
    });

    const { data, count, error } = await query.range(offset, offset + pageSize - 1);
    if (error) throw error;

    const total = count ?? 0;
    const { tableState, tableMessage } = getTableState(total, filters, EMPTY_LABELS);

    return {
      categories: (data ?? []) as WholesalerCategoryListRow[],
      filters,
      pagination: { page, totalPages: Math.max(1, Math.ceil(total / pageSize)), total },
      tableState,
      tableMessage,
    };
  } catch {
    return {
      categories: [] as WholesalerCategoryListRow[],
      filters,
      pagination: { page: 1, totalPages: 1, total: 0 },
      tableState: 'error' as const,
      tableMessage: buildFallbackError('categorías mayoristas'),
    };
  }
};

export const actions: Actions = {
  toggleActive: async ({ request, locals }) => {
    const formData = await request.formData();
    const id = parseText(formData.get('id'));
    const shouldActivate = parseText(formData.get('activate')) === 'true';

    if (!id) {
      return fail(400, { operatorError: 'No encontramos la categoría.' });
    }

    const { error } = await locals.supabase
      .from('wholesaler_categories')
      .update({ is_active: shouldActivate })
      .eq('id', id);

    if (error) {
      return fail(400, { operatorError: 'No pudimos actualizar el estado de la categoría.' });
    }

    return {
      operatorSuccess: shouldActivate ? 'Categoría restaurada.' : 'Categoría desactivada.',
    };
  },
};
