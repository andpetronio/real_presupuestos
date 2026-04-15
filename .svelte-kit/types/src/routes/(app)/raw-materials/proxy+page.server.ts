// @ts-nocheck
import type { PageServerLoad } from './$types';
import type { OperatorMessage } from '$lib/server/shared/ui-state';

const fallbackErrorMessage: OperatorMessage = {
  kind: 'error',
  title: 'No pudimos cargar materias primas',
  detail: 'Reintentá en unos segundos o revisá la conexión con la base de datos.',
  actionLabel: 'Reintentar'
};

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
  try {
    const { data, error } = await locals.supabase
      .from('raw_materials')
      .select('id, name, base_unit, purchase_quantity, base_cost, wastage_percentage, cost_with_wastage, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const rawMaterials = data ?? [];

    return {
      rawMaterials,
      tableState: rawMaterials.length > 0 ? 'success' : 'empty',
      tableMessage:
        rawMaterials.length > 0
          ? null
          : ({
              kind: 'empty',
              title: 'Todavía no hay materias primas',
              detail: 'Creá la primera desde “Nueva materia prima”.'
            } satisfies OperatorMessage)
    };
  } catch {
    return {
      rawMaterials: [],
      tableState: 'error',
      tableMessage: fallbackErrorMessage
    };
  }
};
