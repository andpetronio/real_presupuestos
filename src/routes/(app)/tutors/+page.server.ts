import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { OperatorMessage } from '$lib/server/shared/ui-state';
import { parseFormValue, parsePositiveInteger } from '$lib/server/forms/parsers';

const fallbackErrorMessage: OperatorMessage = {
  kind: 'error',
  title: 'No pudimos cargar tutores',
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
      .from('tutors')
      .select('id, full_name, whatsapp_number, notes, is_active, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (searchQuery) {
      query = query.ilike('full_name', `%${searchQuery}%`);
    }

    if (statusParam === 'active') {
      query = query.eq('is_active', true);
    } else if (statusParam === 'inactive') {
      query = query.eq('is_active', false);
    }

    const { data, count, error } = await query.range(offset, offset + pageSize - 1);

    if (error) throw error;

    const tutors = data ?? [];
    const total = count ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      tutors,
      filters: { search: searchQuery, status: statusParam },
      pagination: { page, totalPages, total },
      tableState: total > 0 ? 'success' : 'empty',
      tableMessage:
        total > 0
          ? null
          : ({
              kind: 'empty',
              title: searchQuery ? 'Sin resultados' : 'Todavía no hay tutores cargados',
              detail: searchQuery
                ? 'No se encontraron tutores para la búsqueda.'
                : 'Creá el primero desde "Nuevo tutor".'
            } satisfies OperatorMessage)
    };
  } catch {
    return {
      tutors: [],
      filters: { search: searchQuery, status: statusParam },
      pagination: { page: 1, totalPages: 1, total: 0 },
      tableState: 'error',
      tableMessage: fallbackErrorMessage
    };
  }
};

export const actions: Actions = {
  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const tutorId = parseFormValue(formData.get('tutorId'));

    if (!tutorId) {
      return fail(400, {
        actionType: 'delete',
        operatorError: 'No encontramos el tutor a desactivar.'
      });
    }

    const { error: tutorError } = await locals.supabase
      .from('tutors')
      .update({ is_active: false })
      .eq('id', tutorId);

    if (tutorError) {
      return fail(400, {
        actionType: 'delete',
        operatorError: 'No pudimos desactivar el tutor. Reintenta en unos segundos.'
      });
    }

    const { data: dogRows, error: dogsQueryError } = await locals.supabase
      .from('dogs')
      .select('id')
      .eq('tutor_id', tutorId);

    if (dogsQueryError) {
      return fail(400, {
        actionType: 'delete',
        operatorError: 'No pudimos aplicar la cascada de desactivacion para perros y recetas.'
      });
    }

    const dogIds = (dogRows ?? []).map((dog) => dog.id);

    const { error: dogsUpdateError } = await locals.supabase
      .from('dogs')
      .update({ is_active: false })
      .eq('tutor_id', tutorId);

    if (dogsUpdateError) {
      return fail(400, {
        actionType: 'delete',
        operatorError: 'No pudimos desactivar los perros del tutor.'
      });
    }

    if (dogIds.length > 0) {
      const { error: recipesUpdateError } = await locals.supabase
        .from('recipes')
        .update({ is_active: false })
        .in('dog_id', dogIds);

      if (recipesUpdateError) {
        return fail(400, {
          actionType: 'delete',
          operatorError: 'No pudimos desactivar las recetas del tutor.'
        });
      }
    }

    return {
      actionType: 'delete',
      operatorSuccess: 'Tutor desactivado correctamente. Perros y recetas asociados quedaron inactivos.'
    };
  },

  restore: async ({ request, locals }) => {
    const formData = await request.formData();
    const tutorId = parseFormValue(formData.get('tutorId'));

    if (!tutorId) {
      return fail(400, {
        actionType: 'restore',
        operatorError: 'No encontramos el tutor a restaurar.'
      });
    }

    const { error: tutorError } = await locals.supabase
      .from('tutors')
      .update({ is_active: true })
      .eq('id', tutorId);

    if (tutorError) {
      return fail(400, {
        actionType: 'restore',
        operatorError: 'No pudimos restaurar el tutor. Reintenta en unos segundos.'
      });
    }

    const { data: dogRows, error: dogsQueryError } = await locals.supabase
      .from('dogs')
      .select('id')
      .eq('tutor_id', tutorId);

    if (dogsQueryError) {
      return fail(400, {
        actionType: 'restore',
        operatorError: 'No pudimos aplicar la cascada de restauracion para perros y recetas.'
      });
    }

    const dogIds = (dogRows ?? []).map((dog) => dog.id);

    const { error: dogsUpdateError } = await locals.supabase
      .from('dogs')
      .update({ is_active: true })
      .eq('tutor_id', tutorId);

    if (dogsUpdateError) {
      return fail(400, {
        actionType: 'restore',
        operatorError: 'No pudimos restaurar los perros del tutor.'
      });
    }

    if (dogIds.length > 0) {
      const { error: recipesUpdateError } = await locals.supabase
        .from('recipes')
        .update({ is_active: true })
        .in('dog_id', dogIds);

      if (recipesUpdateError) {
        return fail(400, {
          actionType: 'restore',
          operatorError: 'No pudimos restaurar las recetas del tutor.'
        });
      }
    }

    return {
      actionType: 'restore',
      operatorSuccess: 'Tutor restaurado correctamente. Perros y recetas asociados quedaron activos.'
    };
  }
};
