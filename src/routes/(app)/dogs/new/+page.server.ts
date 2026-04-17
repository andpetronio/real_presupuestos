import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { parseFormValue, parsePositiveInteger } from '$lib/server/forms/parsers';
import { createTransaction } from '$lib/server/shared/multi-step-transaction';

const DIET_TYPES = new Set(['mixta', 'cocida', 'barf']);

export const load: PageServerLoad = async ({ locals }) => {
  const [tutorsResult, veterinaryResult] = await Promise.all([
    locals.supabase.from('tutors').select('id, full_name').order('full_name', { ascending: true }),
    locals.supabase.from('veterinaries').select('id, name').order('name', { ascending: true })
  ]);

  return {
    tutorOptions: tutorsResult.data ?? [],
    veterinaryOptions: veterinaryResult.data ?? []
  };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const tutorId = parseFormValue(formData.get('tutorId'));
    const veterinaryIdRaw = parseFormValue(formData.get('veterinaryId'));
    const name = parseFormValue(formData.get('name'));
    const dietType = parseFormValue(formData.get('dietType')).toLowerCase();
    const mealsPerDayRaw = parseFormValue(formData.get('mealsPerDay'));
    const notes = parseFormValue(formData.get('notes'));
    const deliveryScheduleRaw = parseFormValue(formData.get('deliverySchedule'));

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

    let parsedSchedule: Array<{ day_of_month: number; pct: number }> = [];
    if (deliveryScheduleRaw) {
      try {
        parsedSchedule = JSON.parse(deliveryScheduleRaw);
      } catch {
        return fail(400, {
          operatorError: 'Formato de calendario de entregas inválido.',
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

      const totalPct = parsedSchedule.reduce((sum, e) => sum + Number(e.pct), 0);
      if (totalPct > 100) {
        return fail(400, {
          operatorError: `La suma de los porcentajes no puede exceder 100% (actual: ${totalPct}%).`,
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
    }

    const tx = createTransaction(locals.supabase);

    const { data: dogData, error: dogError } = await locals.supabase.from('dogs').insert({
      tutor_id: tutorId,
      veterinary_id: veterinaryIdRaw || null,
      name,
      diet_type: dietType,
      meals_per_day: mealsPerDay,
      notes: notes || null,
      is_active: true
    }).select('id').single();

    if (dogError || !dogData) {
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

    tx.registerRollback(async () => {
      await locals.supabase.from('dogs').delete().eq('id', dogData.id);
    });

    if (parsedSchedule.length > 0) {
      const scheduleEntries = parsedSchedule.map((entry) => ({
        dog_id: dogData.id,
        day_of_month: Number(entry.day_of_month),
        pct: Number(entry.pct)
      }));

      const { error: scheduleError } = await locals.supabase
        .from('dog_delivery_schedules')
        .insert(scheduleEntries);

      if (scheduleError) {
        await tx.rollback();
        return fail(400, {
          operatorError: 'No pudimos guardar el calendario de entregas.',
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
    }

    throw redirect(303, '/dogs');
  }
};