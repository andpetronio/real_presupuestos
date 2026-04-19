import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadBudgetOptions } from '$lib/server/budgets/queries';
import { actions as budgetsActions, load as budgetsLoad } from '../+page.server';

export const load: PageServerLoad = async ({ locals, url }) => {
  const [options] = await Promise.all([loadBudgetOptions(locals.supabase)]);

  const data = (await budgetsLoad({ locals, url } as unknown as Parameters<typeof budgetsLoad>[0])) as {
    editingBudget: unknown;
    editingRows: unknown;
  };

  return {
    tutorOptions: options.tutorOptions,
    dogOptions: options.dogOptions,
    recipeOptions: options.recipeOptions,
    settings: options.settings,
    editingBudget: data.editingBudget,
    editingRows: data.editingRows
  };
};

export const actions: Actions = {
  create: async (event) => {
    const result = await budgetsActions.create(
      event as unknown as Parameters<(typeof budgetsActions)['create']>[0]
    );

    if (result && typeof result === 'object' && 'status' in result) {
      return result;
    }

    const budgetId =
      result && typeof result === 'object' && 'budgetId' in result && typeof result.budgetId === 'string'
        ? result.budgetId
        : null;

    if (budgetId) {
      throw redirect(303, `/budgets/${budgetId}/preview`);
    }

    throw redirect(303, '/budgets');
  }
};
