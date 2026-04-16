import type { PageServerLoad } from './$types';
import type { OperatorMessage } from '$lib/server/shared/ui-state';

type AcceptedBudgetRow = {
  id: string;
  final_sale_price: number | null;
  accepted_at: string | null;
  viewed_at: string | null;
  tutor: { full_name?: string | null } | null;
};

const fallbackErrorMessage: OperatorMessage = {
  kind: 'error',
  title: 'No pudimos cargar seguimiento',
  detail: 'Reintentá en unos segundos o revisá la conexión con la base de datos.',
  actionLabel: 'Reintentar'
};

export const load: PageServerLoad = async ({ locals }) => {
  try {
    const { data: acceptedBudgets, error: budgetsError } = await locals.supabase
      .from('budgets')
      .select('id, final_sale_price, accepted_at, viewed_at, tutor:tutors(full_name)')
      .eq('status', 'accepted')
      .order('accepted_at', { ascending: false });

    if (budgetsError) throw budgetsError;

    const budgets = (acceptedBudgets ?? []) as AcceptedBudgetRow[];
    const budgetIds = budgets.map((budget) => budget.id);

    const { data: paymentsRows, error: paymentsError } = budgetIds.length
      ? await locals.supabase
          .from('budget_payments')
          .select('budget_id, amount')
          .in('budget_id', budgetIds)
      : { data: [], error: null };

    if (paymentsError) throw paymentsError;

    const paidByBudget = new Map<string, number>();
    for (const row of paymentsRows ?? []) {
      const current = paidByBudget.get(row.budget_id) ?? 0;
      paidByBudget.set(row.budget_id, current + Number(row.amount ?? 0));
    }

    const trackingRows = budgets.map((budget) => {
      const total = Number(budget.final_sale_price ?? 0);
      const paid = paidByBudget.get(budget.id) ?? 0;
      return {
        id: budget.id,
        tutorName: budget.tutor?.full_name ?? 'Sin tutor',
        acceptedAt: budget.accepted_at,
        viewedAt: budget.viewed_at,
        total,
        paid,
        pending: Math.max(total - paid, 0)
      };
    });

    return {
      state: trackingRows.length > 0 ? ('success' as const) : ('empty' as const),
      message:
        trackingRows.length > 0
          ? null
          : ({
              kind: 'empty',
              title: 'Sin presupuestos aceptados',
              detail: 'Cuando un tutor acepte un presupuesto, aparecerá en esta sección.'
            } satisfies OperatorMessage),
      trackingRows
    };
  } catch {
    return {
      state: 'error' as const,
      message: fallbackErrorMessage,
      trackingRows: []
    };
  }
};
