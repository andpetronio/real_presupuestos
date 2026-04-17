import { redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { loadBudgetOptions } from "$lib/server/budgets/queries";
import {
  actions as budgetsActions,
  load as budgetsLoad,
} from "../+page.server";

export const load: PageServerLoad = async ({ locals, url }) => {
  const [options, listData] = await Promise.all([
    loadBudgetOptions(locals.supabase),
    budgetsLoad({ locals, url } as unknown as Parameters<
      typeof budgetsLoad
    >[0]),
  ]);

  return {
    tutorOptions: options.tutorOptions,
    dogOptions: options.dogOptions,
    recipeOptions: options.recipeOptions,
    settings: options.settings,
    editingBudget: (listData as { editingBudget?: unknown }).editingBudget,
    editingRows: (listData as { editingRows?: unknown }).editingRows,
  };
};

export const actions: Actions = {
  create: async (event) => {
    const result = await budgetsActions.create(
      event as unknown as Parameters<typeof budgetsActions.create>[0],
    );

    if (result && typeof result === "object" && "status" in result) {
      return result;
    }

    throw redirect(303, "/budgets");
  },
};
