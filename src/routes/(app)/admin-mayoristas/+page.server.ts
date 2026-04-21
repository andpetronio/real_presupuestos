import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  applyListFilters,
  buildFallbackError,
  getPagination,
  getTableState,
} from '$lib/server/shared/list-helpers';
import { parseText } from '$lib/server/wholesale-backoffice/wholesalers';
import type { WholesalerListRow } from '$lib/types/view-models/wholesalers';

const EMPTY_LABELS = {
  title: 'Todavía no hay mayoristas cargados',
  detail: 'Creá el primero para habilitar el marketplace.',
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
      .select(
        'id, name, unique_random_code, min_total_units, is_active, notes, created_at, category_id, tax_id, contact_full_name, contact_whatsapp, contact_email, address, delivery_preference, payment_preference, category:wholesaler_categories(id, name, is_active)',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false });

    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,unique_random_code.ilike.%${filters.search}%,tax_id.ilike.%${filters.search}%,contact_full_name.ilike.%${filters.search}%,contact_email.ilike.%${filters.search}%,contact_whatsapp.ilike.%${filters.search}%`,
      );
    }

    query = applyListFilters(query, filters, {
      searchColumn: undefined,
      hasStatusFilter: true,
    });

    const { data, count, error } = await query.range(offset, offset + pageSize - 1);
    if (error) throw error;

    const wholesalers: WholesalerListRow[] = (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      unique_random_code: row.unique_random_code,
      min_total_units: Number(row.min_total_units ?? 0),
      is_active: row.is_active,
      notes: row.notes,
      created_at: row.created_at,
      category_id: row.category_id,
      category_name: (row.category as { name?: string } | null)?.name ?? null,
      tax_id: row.tax_id,
      contact_full_name: row.contact_full_name,
      contact_whatsapp: row.contact_whatsapp,
      contact_email: row.contact_email,
      address: row.address,
      delivery_preference: row.delivery_preference,
      payment_preference: row.payment_preference,
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
      wholesalers: [] as WholesalerListRow[],
      filters,
      pagination: { page: 1, totalPages: 1, total: 0 },
      tableState: 'error' as const,
      tableMessage: buildFallbackError('mayoristas'),
    };
  }
};

export const actions: Actions = {
  toggleActive: async ({ request, locals }) => {
    const formData = await request.formData();
    const id = parseText(formData.get('id'));
    const shouldActivate = parseText(formData.get('activate')) === 'true';

    if (!id) {
      return fail(400, { operatorError: 'No encontramos el mayorista.' });
    }

    const { error } = await locals.supabase
      .from('wholesalers')
      .update({ is_active: shouldActivate })
      .eq('id', id);
    if (error) {
      return fail(400, { operatorError: 'No pudimos actualizar el estado del mayorista.' });
    }

    return {
      operatorSuccess: shouldActivate ? 'Mayorista restaurado.' : 'Mayorista desactivado.',
    };
  },
};
