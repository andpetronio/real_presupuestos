import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { parseFormValue, getTutorError } from "$lib/server/forms/parsers";

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const fullName = parseFormValue(formData.get("fullName"));
    const whatsappNumber = parseFormValue(formData.get("whatsappNumber"));
    const notes = parseFormValue(formData.get("notes"));

    if (!fullName || !whatsappNumber) {
      return fail(400, {
        operatorError: "Nombre completo y WhatsApp son obligatorios.",
        values: { fullName, whatsappNumber, notes },
      });
    }

    const { error } = await locals.supabase.from("tutors").insert({
      full_name: fullName,
      whatsapp_number: whatsappNumber,
      notes: notes || null,
    });

    if (error) {
      return fail(400, {
        operatorError: getTutorError("create", error.message),
        values: { fullName, whatsappNumber, notes },
      });
    }

    throw redirect(303, "/tutors");
  },
};
