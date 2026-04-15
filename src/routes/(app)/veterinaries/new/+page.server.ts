import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { parseFormValue, getVeterinaryError } from '$lib/server/forms/parsers';

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = parseFormValue(formData.get('name'));

    if (!name) {
      return fail(400, {
        operatorError: 'El nombre de la veterinaria es obligatorio.',
        values: { name }
      });
    }

    const { error } = await locals.supabase.from('veterinaries').insert({
      name
    });

    if (error) {
      return fail(400, {
        operatorError: getVeterinaryError('create', error.message),
        values: { name }
      });
    }

    throw redirect(303, '/veterinaries');
  }
};
