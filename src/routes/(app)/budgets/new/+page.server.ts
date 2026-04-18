import type { PageServerLoad } from "./$types";
import { loadBudgetFormData } from "$lib/server/budgets/form-data";
import { parseActionValues } from "$lib/server/budgets/parsers";
import { saveBudget } from "$lib/server/budgets/save";

export const load: PageServerLoad = async ({ locals }) => {
  const formData = await loadBudgetFormData({
    supabase: locals.supabase,
    editingBudgetId: null,
  });

  return {
    tutorOptions: formData.tutorOptions,
    dogOptions: formData.dogOptions,
    recipeOptions: formData.recipeOptions,
    settings: formData.settings,
    editingBudget: formData.editingBudget,
    editingRows: formData.editingRows,
  };
};

export const actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const values = parseActionValues(formData);

    return saveBudget({
      action: "create",
      values,
      locals,
    });
  },
};
