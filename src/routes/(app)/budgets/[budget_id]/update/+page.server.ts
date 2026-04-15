import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loadBudgetOptions } from '$lib/server/budgets/queries';
import { actions as budgetsActions, load as budgetsLoad } from '../../+page.server';

export const load: PageServerLoad = async ({ locals, params, url }) => {
  const nextUrl = new URL(url);
  nextUrl.searchParams.set('edit', params.budget_id);

  const [options, data] = await Promise.all([
    loadBudgetOptions(locals.supabase),
    budgetsLoad({ locals, url: nextUrl } as unknown as Parameters<typeof budgetsLoad>[0])
  ]);

  const typedData = data as {
    editingBudget: {
      id: string;
      tutor_id: string | null;
      reference_month?: string | null;
      reference_days?: number | null;
      notes: string | null;
      vacuum_bag_small_qty?: number;
      vacuum_bag_large_qty?: number;
      labels_qty?: number;
      non_woven_bag_qty?: number;
      labor_hours_qty?: number;
      cooking_hours_qty?: number;
      calcium_qty?: number;
      kefir_qty?: number;
    } | null;
    editingRows: ReadonlyArray<{ dogId: string; recipeId: string; assignedDays: string }>;
  };

  if (!typedData.editingBudget) {
    throw redirect(303, '/budgets');
  }

  return {
    tutorOptions: options.tutorOptions,
    dogOptions: options.dogOptions,
    recipeOptions: options.recipeOptions,
    settings: options.settings,
    budget: typedData.editingBudget,
    editingRows: typedData.editingRows
  };
};

export const actions: Actions = {
  update: async (event) => {
    const result = await budgetsActions.update(
      event as unknown as Parameters<(typeof budgetsActions)['update']>[0]
    );

    if (result && typeof result === 'object' && 'status' in result) {
      return result;
    }

    throw redirect(303, '/budgets');
  }
};
