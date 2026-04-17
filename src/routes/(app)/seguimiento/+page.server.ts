import type { PageServerLoad } from './$types';
import type { OperatorMessage } from '$lib/server/shared/ui-state';

type TutorOption = { id: string; fullName: string };

const fallbackErrorMessage: OperatorMessage = {
  kind: 'error',
  title: 'No pudimos cargar seguimiento',
  detail: 'Reintentá en unos segundos o revisá la conexión con la base de datos.',
  actionLabel: 'Reintentar'
};

const toPct = (current: number, total: number): number => {
  if (total <= 0) return 0;
  return Math.round((current / total) * 100);
};

export const load: PageServerLoad = async ({ locals, url }) => {
  const tutorId = url.searchParams.get('tutor') ?? '';
  const selectedShow = (url.searchParams.get('show') ?? 'active') as 'active' | 'closed';
  const statusFilter = selectedShow === 'closed' ? 'closed' : 'accepted';

  try {
    const [{ data: tutorRows }, { data: budgetsData, error: budgetsError }] = await Promise.all([
      locals.supabase.from('tutors').select('id, full_name').order('full_name', { ascending: true }),
      tutorId
        ? locals.supabase
            .from('budgets')
            .select('id, status, tutor_id, final_sale_price, accepted_at, viewed_at, tutor:tutors(full_name)')
            .eq('status', statusFilter)
            .eq('tutor_id', tutorId)
            .order('accepted_at', { ascending: false })
        : locals.supabase
            .from('budgets')
            .select('id, status, tutor_id, final_sale_price, accepted_at, viewed_at, tutor:tutors(full_name)')
            .eq('status', statusFilter)
            .order('accepted_at', { ascending: false })
    ]);

    if (budgetsError) throw budgetsError;

    const budgets = budgetsData ?? [];
    const budgetIds = budgets.map((b) => b.id);

    const [paymentsResult, recipesResult] = await Promise.all([
      budgetIds.length
        ? locals.supabase.from('budget_payments').select('budget_id, amount').in('budget_id', budgetIds)
        : Promise.resolve({ data: [], error: null }),
      budgetIds.length
        ? locals.supabase
            .from('budget_dog_recipes')
            .select('id, assigned_days, budget_dog:budget_dogs(budget_id)')
            .in('budget_dog.budget_id', budgetIds)
        : Promise.resolve({ data: [], error: null })
    ]);

    if (paymentsResult.error || recipesResult.error) throw paymentsResult.error ?? recipesResult.error;

    const recipeIds = (recipesResult.data ?? []).map((r) => r.id);

    const [preparationsResult, deliveriesResult] = await Promise.all([
      recipeIds.length
        ? locals.supabase
            .from('budget_recipe_preparations')
            .select('budget_dog_recipe_id, recipe_days')
            .in('budget_dog_recipe_id', recipeIds)
        : Promise.resolve({ data: [], error: null }),
      recipeIds.length
        ? locals.supabase
            .from('budget_recipe_deliveries')
            .select('budget_dog_recipe_id, recipe_days')
            .in('budget_dog_recipe_id', recipeIds)
        : Promise.resolve({ data: [], error: null })
    ]);

    const paidByBudget: Map<string, number> = new Map();
    for (const row of paymentsResult.data ?? []) {
      paidByBudget.set(row.budget_id, (paidByBudget.get(row.budget_id) ?? 0) + Number(row.amount ?? 0));
    }

    const recipeToBudget: Map<string, string> = new Map();
    const recipeToAssigned: Map<string, number> = new Map();
    const assignedByBudget: Map<string, number> = new Map();
    for (const row of recipesResult.data ?? []) {
      const bid = (row.budget_dog as unknown as { budget_id: string } | null)?.budget_id;
      if (!bid) continue;
      const assigned = Number(row.assigned_days ?? 0);
      recipeToBudget.set(row.id, bid);
      recipeToAssigned.set(row.id, assigned);
      assignedByBudget.set(bid, (assignedByBudget.get(bid) ?? 0) + assigned);
    }

    const preparedByRecipe: Map<string, number> = new Map();
    for (const row of preparationsResult.data ?? []) {
      preparedByRecipe.set(
        row.budget_dog_recipe_id,
        (preparedByRecipe.get(row.budget_dog_recipe_id) ?? 0) + Number(row.recipe_days ?? 0)
      );
    }

    const deliveredByRecipe: Map<string, number> = new Map();
    for (const row of deliveriesResult.data ?? []) {
      deliveredByRecipe.set(
        row.budget_dog_recipe_id,
        (deliveredByRecipe.get(row.budget_dog_recipe_id) ?? 0) + Number(row.recipe_days ?? 0)
      );
    }

    const preparedByBudget: Map<string, number> = new Map();
    const deliveredByBudget: Map<string, number> = new Map();
    for (const [recipeId, assigned] of recipeToAssigned) {
      const bid = recipeToBudget.get(recipeId) ?? '';
      if (!bid) continue;
      const prepared = Math.min(preparedByRecipe.get(recipeId) ?? 0, assigned);
      const delivered = Math.min(deliveredByRecipe.get(recipeId) ?? 0, assigned);
      preparedByBudget.set(bid, (preparedByBudget.get(bid) ?? 0) + prepared);
      deliveredByBudget.set(bid, (deliveredByBudget.get(bid) ?? 0) + delivered);
    }

    const tutorOptions: TutorOption[] = (tutorRows ?? []).map((t) => ({
      id: t.id,
      fullName: t.full_name ?? ''
    }));

    const trackingRows = budgets.map((budget) => {
      const total = Number(budget.final_sale_price ?? 0);
      const paid = paidByBudget.get(budget.id) ?? 0;
      const assigned = assignedByBudget.get(budget.id) ?? 0;
      const prepared = preparedByBudget.get(budget.id) ?? 0;
      const delivered = deliveredByBudget.get(budget.id) ?? 0;

      return {
        id: budget.id,
        status: budget.status,
        tutorId: budget.tutor_id ?? '',
        tutorName: (budget.tutor as unknown as { full_name?: string | null } | null)?.full_name ?? 'Sin tutor',
        viewedAt: budget.viewed_at,
        total,
        paid,
        preparedPct: toPct(prepared, assigned),
        deliveredPct: toPct(delivered, assigned),
        collectedPct: toPct(paid, total)
      };
    });

    const emptyTitle =
      selectedShow === 'closed'
        ? tutorId
          ? 'Sin presupuestos cerrados para este tutor'
          : 'Sin presupuestos cerrados'
        : tutorId
          ? 'Sin presupuestos para este tutor'
          : 'Sin presupuestos aceptados';

    const emptyDetail =
      selectedShow === 'closed'
        ? tutorId
          ? 'Este tutor no tiene presupuestos cerrados.'
          : 'Cuando cierres un presupuesto, aparecerá en esta sección.'
        : tutorId
          ? 'Este tutor no tiene presupuestos aceptados.'
          : 'Cuando un tutor acepte un presupuesto, aparecerá en esta sección.';

    return {
      state: trackingRows.length > 0 ? ('success' as const) : ('empty' as const),
      message:
        trackingRows.length > 0
          ? null
          : ({
              kind: 'empty',
              title: emptyTitle,
              detail: emptyDetail
            } satisfies OperatorMessage),
      trackingRows,
      tutorOptions,
      selectedTutor: tutorId,
      selectedShow
    };
  } catch {
    return {
      state: 'error' as const,
      message: fallbackErrorMessage,
      trackingRows: [],
      tutorOptions: [],
      selectedTutor: '',
      selectedShow: 'active'
    };
  }
};
