// @ts-nocheck
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { parseFormValue, getTutorError } from '$lib/server/forms/parsers';

export const load = async ({ locals, params }: Parameters<PageServerLoad>[0]) => {
  const tutorId = params.tutor_id;

  const { data, error } = await locals.supabase
    .from('tutors')
    .select('id, full_name, whatsapp_number, notes')
    .eq('id', tutorId)
    .single();

  if (error || !data) {
    throw redirect(303, '/tutors');
  }

  return { tutor: data };
};

export const actions = {
  update: async ({ request, locals, params }: import('./$types').RequestEvent) => {
    const tutorId = params.tutor_id;
    const formData = await request.formData();
    const fullName = parseFormValue(formData.get('fullName'));
    const whatsappNumber = parseFormValue(formData.get('whatsappNumber'));
    const notes = parseFormValue(formData.get('notes'));

    if (!tutorId || !fullName || !whatsappNumber) {
      return fail(400, {
        operatorError: 'Nombre completo y WhatsApp son obligatorios.',
        values: { fullName, whatsappNumber, notes }
      });
    }

    const { error } = await locals.supabase
      .from('tutors')
      .update({
        full_name: fullName,
        whatsapp_number: whatsappNumber,
        notes: notes || null
      })
      .eq('id', tutorId);

    if (error) {
      return fail(400, {
        operatorError: getTutorError('update', error.message),
        values: { fullName, whatsappNumber, notes }
      });
    }

    throw redirect(303, '/tutors');
  }
};
;null as any as Actions;