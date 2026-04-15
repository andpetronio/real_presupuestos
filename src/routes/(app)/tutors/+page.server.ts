import type { PageServerLoad } from './$types';
import type { OperatorMessage } from '$lib/server/shared/ui-state';

const fallbackErrorMessage: OperatorMessage = {
  kind: 'error',
  title: 'No pudimos cargar tutores',
  detail: 'Reintentá en unos segundos o revisá la conexión con la base de datos.',
  actionLabel: 'Reintentar'
};

export const load: PageServerLoad = async ({ locals }) => {
  try {
    const { data, error } = await locals.supabase
      .from('tutors')
      .select('id, full_name, whatsapp_number, notes, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const tutors = data ?? [];

    return {
      tutors,
      tableState: tutors.length > 0 ? 'success' : 'empty',
      tableMessage:
        tutors.length > 0
          ? null
          : ({
              kind: 'empty',
              title: 'Todavía no hay tutores cargados',
              detail: 'Creá el primero desde “Nuevo tutor”.'
            } satisfies OperatorMessage)
    };
  } catch {
    return {
      tutors: [],
      tableState: 'error',
      tableMessage: fallbackErrorMessage
    };
  }
};
