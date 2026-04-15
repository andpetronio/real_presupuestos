// @ts-nocheck
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadBudgetOptions } from '$lib/server/budgets/queries';
import { actions as budgetsActions, load as budgetsLoad } from '../+page.server';

export const load = async ({ locals, url }: Parameters<PageServerLoad>[0]) => {
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

export const actions = {
  create: async (event: import('./$types').RequestEvent) => {
    const result = await budgetsActions.create(
      event as unknown as Parameters<(typeof budgetsActions)['create']>[0]
    );

    if (result && typeof result === 'object' && 'status' in result) {
      return result;
    }

    throw redirect(303, '/budgets');
  }
};
;null as any as Actions;