import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import {
  parseFormValue,
  parsePositiveInteger,
} from "$lib/server/forms/parsers";

const DIET_TYPES = new Set(["mixta", "cocida", "barf"]);

export const load: PageServerLoad = async ({ locals, params }) => {
  const dogId = params.dog_id;

  const [dogResult, tutorsResult, veterinaryResult, scheduleResult] =
    await Promise.all([
      locals.supabase
        .from("dogs")
        .select(
          "id, tutor_id, veterinary_id, name, diet_type, meals_per_day, notes",
        )
        .eq("id", dogId)
        .single(),
      locals.supabase
        .from("tutors")
        .select("id, full_name")
        .order("full_name", { ascending: true }),
      locals.supabase
        .from("veterinaries")
        .select("id, name")
        .order("name", { ascending: true }),
      locals.supabase
        .from("dog_delivery_schedules")
        .select("day_of_month, pct")
        .eq("dog_id", dogId)
        .order("day_of_month", { ascending: true }),
    ]);

  if (dogResult.error || !dogResult.data) {
    throw redirect(303, "/dogs");
  }

  const activeTutors = tutorsResult.data ?? [];
  let tutorOptions = activeTutors;

  if (!activeTutors.some((tutor) => tutor.id === dogResult.data.tutor_id)) {
    const { data: currentTutor } = await locals.supabase
      .from('tutors')
      .select('id, full_name')
      .eq('id', dogResult.data.tutor_id)
      .maybeSingle();

    if (currentTutor) {
      tutorOptions = [currentTutor, ...activeTutors];
    }
  }

  return {
    dog: dogResult.data,
    tutorOptions,
    veterinaryOptions: veterinaryResult.data ?? [],
    deliverySchedule: scheduleResult.data ?? [],
  };
};

export const actions: Actions = {
  update: async ({ request, locals, params }) => {
    const formData = await request.formData();
    const dogId = params.dog_id;
    const tutorId = parseFormValue(formData.get("tutorId"));
    const veterinaryIdRaw = parseFormValue(formData.get("veterinaryId"));
    const name = parseFormValue(formData.get("name"));
    const dietType = parseFormValue(formData.get("dietType")).toLowerCase();
    const mealsPerDayRaw = parseFormValue(formData.get("mealsPerDay"));
    const notes = parseFormValue(formData.get("notes"));
    const deliveryScheduleRaw = parseFormValue(
      formData.get("deliverySchedule"),
    );

    const mealsPerDay = parsePositiveInteger(mealsPerDayRaw);

    if (
      !dogId ||
      !tutorId ||
      !name ||
      !DIET_TYPES.has(dietType) ||
      mealsPerDay === null
    ) {
      return fail(400, {
        operatorError:
          "Completá tutor, nombre, tipo de dieta válido y comidas diarias (> 0).",
        values: {
          tutorId,
          veterinaryId: veterinaryIdRaw,
          name,
          dietType,
          mealsPerDay: mealsPerDayRaw,
          notes,
        },
      });
    }

    let parsedSchedule: Array<{ day_of_month: number; pct: number }> = [];
    if (deliveryScheduleRaw) {
      try {
        parsedSchedule = JSON.parse(deliveryScheduleRaw);
      } catch {
        return fail(400, {
          operatorError: "Formato de calendario de entregas inválido.",
          values: {
            tutorId,
            veterinaryId: veterinaryIdRaw,
            name,
            dietType,
            mealsPerDay: mealsPerDayRaw,
            notes,
          },
        });
      }

      const totalPct = parsedSchedule.reduce(
        (sum, e) => sum + Number(e.pct),
        0,
      );
      if (totalPct > 100) {
        return fail(400, {
          operatorError: `La suma de los porcentajes no puede exceder 100% (actual: ${totalPct}%).`,
          values: {
            tutorId,
            veterinaryId: veterinaryIdRaw,
            name,
            dietType,
            mealsPerDay: mealsPerDayRaw,
            notes,
          },
        });
      }
    }

    const { error: dogError } = await locals.supabase
      .from("dogs")
      .update({
        tutor_id: tutorId,
        veterinary_id: veterinaryIdRaw || null,
        name,
        diet_type: dietType,
        meals_per_day: mealsPerDay,
        notes: notes || null,
      })
      .eq("id", dogId);

    if (dogError) {
      return fail(400, {
        operatorError:
          "No pudimos actualizar el perro. Revisá los datos e intentá nuevamente.",
        values: {
          tutorId,
          veterinaryId: veterinaryIdRaw,
          name,
          dietType,
          mealsPerDay: mealsPerDayRaw,
          notes,
        },
      });
    }

    await locals.supabase
      .from("dog_delivery_schedules")
      .delete()
      .eq("dog_id", dogId);

    if (parsedSchedule.length > 0) {
      const scheduleEntries = parsedSchedule.map((entry) => ({
        dog_id: dogId,
        day_of_month: Number(entry.day_of_month),
        pct: Number(entry.pct),
      }));

      const { error: scheduleError } = await locals.supabase
        .from("dog_delivery_schedules")
        .insert(scheduleEntries);

      if (scheduleError) {
        return fail(400, {
          operatorError: "No pudimos guardar el calendario de entregas.",
          values: {
            tutorId,
            veterinaryId: veterinaryIdRaw,
            name,
            dietType,
            mealsPerDay: mealsPerDayRaw,
            notes,
          },
        });
      }
    }

    throw redirect(303, "/dogs");
  },
};
