// @ts-nocheck
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { parseFormValue, getVeterinaryError } from '$lib/server/forms/parsers';

export const load = async ({ locals, params }: Parameters<PageServerLoad>[0]) => {
  const veterinaryId = params.veterinary_id;

  const { data, error } = await locals.supabase
    .from('veterinaries')
    .select('id, name')
    .eq('id', veterinaryId)
    .single();

  if (error || !data) {
    throw redirect(303, '/veterinaries');
  }

  return { veterinary: data };
};

export const actions = {
  update: async ({ request, locals, params }: import('./$types').RequestEvent) => {
    const veterinaryId = params.veterinary_id;
    const formData = await request.formData();
    const name = parseFormValue(formData.get('name'));

    if (!veterinaryId || !name) {
      return fail(400, {
        operatorError: 'El nombre de la veterinaria es obligatorio.',
        values: { name }
      });
    }

    const { error } = await locals.supabase
      .from('veterinaries')
      .update({ name })
      .eq('id', veterinaryId);

    if (error) {
      return fail(400, {
        operatorError: getVeterinaryError('update', error.message),
        values: { name }
      });
    }

    throw redirect(303, '/veterinaries');
  }
};
;null as any as Actions;