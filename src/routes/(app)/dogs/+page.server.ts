import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { OperatorMessage } from '$lib/server/shared/ui-state';

const fallbackErrorMessage: OperatorMessage = {
  kind: 'error',
  title: 'No pudimos cargar perros',
  detail: 'Reintentá en unos segundos o revisá la conexión con la base de datos.',
  actionLabel: 'Reintentar'
};

const parseFormValue = (value: FormDataEntryValue | null): string =>
  typeof value === 'string' ? value.trim() : '';

export const load: PageServerLoad = async ({ locals }) => {
  try {
    const { data, error } = await locals.supabase
      .from('dogs')
      .select(
        'id, name, diet_type, meals_per_day, is_active, notes, created_at, tutor:tutors(full_name), veterinary:veterinaries(name)'
      )
      .order('created_at', { ascending: false });

    if (error) throw error;

    const dogs = data ?? [];

    return {
      dogs,
      tableState: dogs.length > 0 ? 'success' : 'empty',
      tableMessage:
        dogs.length > 0
          ? null
          : ({
              kind: 'empty',
              title: 'Todavía no hay perros cargados',
              detail: 'Creá el primero desde “Nuevo perro”.'
            } satisfies OperatorMessage)
    };
  } catch {
    return {
      dogs: [],
      tableState: 'error',
      tableMessage: fallbackErrorMessage
    };
  }
};

export const actions: Actions = {
  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const dogId = parseFormValue(formData.get('dogId'));

    if (!dogId) {
      return fail(400, {
        actionType: 'delete',
        operatorError: 'No encontramos el perro a desactivar.'
      });
    }

    const { error } = await locals.supabase.from('dogs').update({ is_active: false }).eq('id', dogId);

    if (error) {
      return fail(400, {
        actionType: 'delete',
        operatorError: 'No pudimos desactivar el perro. Reintentá en unos segundos.'
      });
    }

    return {
      actionType: 'delete',
      operatorSuccess: 'Perro desactivado correctamente.'
    };
  }
};
