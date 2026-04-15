// @ts-nocheck
import type { PageServerLoad } from './$types';
import type { OperatorMessage } from '$lib/server/shared/ui-state';

const fallbackErrorMessage: OperatorMessage = {
  kind: 'error',
  title: 'No pudimos cargar recetas',
  detail: 'Reintentá en unos segundos o revisá la conexión con la base de datos.',
  actionLabel: 'Reintentar'
};

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
  try {
    const { data, error } = await locals.supabase
      .from('recipes')
      .select('id, dog_id, name, notes, is_active, created_at, dog:dogs(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const recipes = data ?? [];

    return {
      recipes,
      tableState: recipes.length > 0 ? 'success' : 'empty',
      tableMessage:
        recipes.length > 0
          ? null
          : ({
              kind: 'empty',
              title: 'Todavía no hay recetas',
              detail: 'Creá la primera desde “Nueva receta”.'
            } satisfies OperatorMessage)
    };
  } catch {
    return {
      recipes: [],
      tableState: 'error',
      tableMessage: fallbackErrorMessage
    };
  }
};
