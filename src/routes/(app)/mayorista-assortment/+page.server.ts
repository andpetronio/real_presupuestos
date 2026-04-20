import type { PageServerLoad } from './$types';
import {
  applyListFilters,
  buildFallbackError,
  getPagination,
  getTableState,
} from '$lib/server/shared/list-helpers';
import type { AssortmentWholesalerRow } from '$lib/types/view-models/wholesale-assortment';

const EMPTY_LABELS = {
  title: 'Todavía no hay mayoristas para surtido',
  detail: 'Cuando cargues mayoristas, vas a poder gestionar su surtido desde acá.',
};

export const load: PageServerLoad = async ({ locals, url }) => {
  const { page, pageSize, offset } = getPagination(url.searchParams.get('page'));
  const filters = {
    search: url.searchParams.get('q')?.trim() ?? '',
    status: url.searchParams.get('status')?.trim() ?? 'active',
  };

  try {
    let query = locals.supabase
      .from('wholesalers')
      .select('id, name, unique_random_code, min_total_units, is_active', {
        count: 'exact',
      })
      .order('name', { ascending: true });

    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,unique_random_code.ilike.%${filters.search}%`,
      );
    }

    query = applyListFilters(query, filters, {
      searchColumn: undefined,
      hasStatusFilter: true,
    });

    const { data, count, error } = await query.range(offset, offset + pageSize - 1);
    if (error) {
      throw error;
    }

    const wholesalerIds = (data ?? []).map((wholesaler) => wholesaler.id);

    const enabledProductsResult = wholesalerIds.length
      ? await locals.supabase
          .from('wholesaler_products')
          .select('wholesaler_id')
          .eq('is_enabled', true)
          .in('wholesaler_id', wholesalerIds)
      : { data: [], error: null };

    if (enabledProductsResult.error) {
      throw enabledProductsResult.error;
    }

    const enabledProductsCountByWholesalerId = new Map<string, number>();
    for (const row of enabledProductsResult.data ?? []) {
      enabledProductsCountByWholesalerId.set(
        row.wholesaler_id,
        (enabledProductsCountByWholesalerId.get(row.wholesaler_id) ?? 0) + 1,
      );
    }

    const wholesalers: AssortmentWholesalerRow[] = (data ?? []).map((wholesaler) => ({
      ...wholesaler,
      enabledProductsCount:
        enabledProductsCountByWholesalerId.get(wholesaler.id) ?? 0,
    }));

    const total = count ?? 0;
    const { tableState, tableMessage } = getTableState(total, filters, EMPTY_LABELS);

    return {
      wholesalers,
      filters,
      pagination: {
        page,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        total,
      },
      tableState,
      tableMessage,
    };
  } catch {
    return {
      wholesalers: [] as AssortmentWholesalerRow[],
      filters,
      pagination: { page: 1, totalPages: 1, total: 0 },
      tableState: 'error' as const,
      tableMessage: buildFallbackError('surtidos mayoristas'),
    };
  }
};
