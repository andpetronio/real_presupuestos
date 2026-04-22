import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { parseText } from "$lib/server/wholesale-backoffice/wholesalers";

const getCategoryError = (errorMessage: string | undefined): string => {
  if (!errorMessage) {
    return "No pudimos crear la categoría. Reintentá en unos segundos.";
  }

  const normalized = errorMessage.toLowerCase();
  if (normalized.includes("wholesaler_categories_name_unique")) {
    return "Ya existe una categoría con ese nombre.";
  }

  return "No pudimos crear la categoría. Reintentá en unos segundos.";
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = parseText(formData.get("name"));

    if (!name) {
      return fail(400, {
        operatorError: "Ingresá un nombre para la categoría.",
        values: { name },
      });
    }

    const { error } = await locals.supabase
      .from("wholesaler_categories")
      .insert({ name });

    if (error) {
      return fail(400, {
        operatorError: getCategoryError(error.message),
        values: { name },
      });
    }

    throw redirect(303, "/mayorista-categories");
  },
};
