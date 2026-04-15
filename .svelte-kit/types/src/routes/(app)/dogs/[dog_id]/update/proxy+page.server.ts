// @ts-nocheck
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { parseFormValue, parsePositiveInteger } from '$lib/server/forms/parsers';

const DIET_TYPES = new Set(['mixta', 'cocida', 'barf']);

export const load = async ({ locals, params }: Parameters<PageServerLoad>[0]) => {
  const dogId = params.dog_id;

  const [dogResult, tutorsResult, veterinaryResult] = await Promise.all([
    locals.supabase
      .from('dogs')
      .select('id, tutor_id, veterinary_id, name, diet_type, meals_per_day, notes')
      .eq('id', dogId)
      .single(),
    locals.supabase.from('tutors').select('id, full_name').order('full_name', { ascending: true }),
    locals.supabase.from('veterinaries').select('id, name').order('name', { ascending: true })
  ]);

  if (dogResult.error || !dogResult.data) {
    throw redirect(303, '/dogs');
  }

  return {
    dog: dogResult.data,
    tutorOptions: tutorsResult.data ?? [],
    veterinaryOptions: veterinaryResult.data ?? []
  };
};

export const actions = {
  update: async ({ request, locals, params }: import('./$types').RequestEvent) => {
    const formData = await request.formData();
    const dogId = params.dog_id;
    const tutorId = parseFormValue(formData.get('tutorId'));
    const veterinaryIdRaw = parseFormValue(formData.get('veterinaryId'));
    const name = parseFormValue(formData.get('name'));
    const dietType = parseFormValue(formData.get('dietType')).toLowerCase();
    const mealsPerDayRaw = parseFormValue(formData.get('mealsPerDay'));
    const notes = parseFormValue(formData.get('notes'));
    const mealsPerDay = parsePositiveInteger(mealsPerDayRaw);

    if (!dogId || !tutorId || !name || !DIET_TYPES.has(dietType) || mealsPerDay === null) {
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

    const { error } = await locals.supabase
      .from('dogs')
      .update({
        tutor_id: tutorId,
        veterinary_id: veterinaryIdRaw || null,
        name,
        diet_type: dietType,
        meals_per_day: mealsPerDay,
        notes: notes || null
      })
      .eq('id', dogId);

    if (error) {
      return fail(400, {
        operatorError: 'No pudimos actualizar el perro. Revisá los datos e intentá nuevamente.',
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