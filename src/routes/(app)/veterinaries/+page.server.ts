import type { PageServerLoad } from './$types';
import type { OperatorMessage } from '$lib/server/shared/ui-state';

const fallbackErrorMessage: OperatorMessage = {
  kind: 'error',
  title: 'No pudimos cargar veterinarias',
  detail: 'Reintentá en unos segundos o revisá la conexión con la base de datos.',
  actionLabel: 'Reintentar'
};

export const load: PageServerLoad = async ({ locals }) => {
  try {
    const { data, error } = await locals.supabase
      .from('veterinaries')
      .select('id, name, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const veterinaries = data ?? [];

    return {
      veterinaries,
      tableState: veterinaries.length > 0 ? 'success' : 'empty',
      tableMessage:
        veterinaries.length > 0
          ? null
          : ({
              kind: 'empty',
              title: 'Todavía no hay veterinarias cargadas',
              detail: 'Creá la primera desde “Nueva veterinaria”.'
            } satisfies OperatorMessage)
    };
  } catch {
    return {
      veterinaries: [],
      tableState: 'error',
      tableMessage: fallbackErrorMessage
    };
  }
};
