import { redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { loadBudgetFormData } from "$lib/server/budgets/form-data";
import { parseActionValues } from "$lib/server/budgets/parsers";
import { saveBudget } from "$lib/server/budgets/save";

export const load: PageServerLoad = async ({ locals, params }) => {
  const formData = await loadBudgetFormData({
    supabase: locals.supabase,
    editingBudgetId: params.budget_id,
  });

  if (!formData.editingBudget) {
    throw redirect(303, "/budgets");
  }

  return {
    tutorOptions: formData.tutorOptions,
    dogOptions: formData.dogOptions,
    recipeOptions: formData.recipeOptions,
    settings: formData.settings,
    budget: formData.editingBudget,
    editingRows: formData.editingRows,
  };
};

export const actions: Actions = {
  update: async ({ request, locals }) => {
    const formData = await request.formData();
    const values = parseActionValues(formData);

    return saveBudget({
      action: "update",
      values,
      locals,
    });
  },
};
