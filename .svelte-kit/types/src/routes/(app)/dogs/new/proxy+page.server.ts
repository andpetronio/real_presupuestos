// @ts-nocheck
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { parseFormValue, parsePositiveInteger } from '$lib/server/forms/parsers';

const DIET_TYPES = new Set(['mixta', 'cocida', 'barf']);

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
  const [tutorsResult, veterinaryResult] = await Promise.all([
    locals.supabase.from('tutors').select('id, full_name').order('full_name', { ascending: true }),
    locals.supabase.from('veterinaries').select('id, name').order('name', { ascending: true })
  ]);

  return {
    tutorOptions: tutorsResult.data ?? [],
    veterinaryOptions: veterinaryResult.data ?? []
  };
};

export const actions = {
  create: async ({ request, locals }: import('./$types').RequestEvent) => {
    const formData = await request.formData();
    const tutorId = parseFormValue(formData.get('tutorId'));
    const veterinaryIdRaw = parseFormValue(formData.get('veterinaryId'));
    const name = parseFormValue(formData.get('name'));
    const dietType = parseFormValue(formData.get('dietType')).toLowerCase();
    const mealsPerDayRaw = parseFormValue(formData.get('mealsPerDay'));
    const notes = parseFormValue(formData.get('notes'));

    const mealsPerDay = parsePositiveInteger(mealsPerDayRaw);

    if (!tutorId || !name || !DIET_TYPES.has(dietType) || mealsPerDay === null) {
      return fail(400, {
        operatorError: 'Completá tutor, nombre, tipo de dieta válido y comidas diarias (> 0).',
        values: {
          tutorId,
          veterinaryId: veterinaryIdRaw,
          name,
          dietType,
          mealsPerDay: mealsPerDayRaw,
          notes
        }
      });
    }

    const { error } = await locals.supabase.from('dogs').insert({
      tutor_id: tutorId,
      veterinary_id: veterinaryIdRaw || null,
      name,
      diet_type: dietType,
      meals_per_day: mealsPerDay,
      notes: notes || null,
      is_active: true
    });

    if (error) {
      return fail(400, {
        operatorError: 'No pudimos crear el perro. Revisá los datos e intentá nuevamente.',
        values: {
          tutorId,
          veterinaryId: veterinaryIdRaw,
          name,
          dietType,
          mealsPerDay: mealsPerDayRaw,
          notes
        }
      });
    }

    throw redirect(303, '/dogs');
  }
};
;null as any as Actions;