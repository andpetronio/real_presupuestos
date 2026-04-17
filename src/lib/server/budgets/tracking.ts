import type { SupabaseClient } from '@supabase/supabase-js';

export type PaymentMethod = 'cash' | 'transfer' | 'mercadopago' | 'other';

export type PaymentRow = {
  id: string;
  budget_id: string;
  amount: number;
  payment_method: PaymentMethod;
  paid_at: string;
  notes: string | null;
};

export type RecipeTrackingRow = {
  budgetDogRecipeId: string;
  dogName: string;
  recipeName: string;
  assignedDays: number;
  preparedDays: number;
  deliveredDays: number;
};

export const getUnviewedAcceptedBudgetCount = async (supabase: SupabaseClient): Promise<number> => {
  const { count, error } = await supabase
    .from('budgets')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'accepted')
    .is('viewed_at', null);

  if (error) return 0;
  return count ?? 0;
};

export const markBudgetViewed = async (params: {
  supabase: SupabaseClient;
  budgetId: string;
}): Promise<void> => {
  const { supabase, budgetId } = params;

  await supabase
    .from('budgets')
    .update({ viewed_at: new Date().toISOString() })
    .eq('id', budgetId)
    .eq('status', 'accepted')
    .is('viewed_at', null);
};

const toPct = (current: number, total: number): number => {
  if (total <= 0) return 0;
  return Number(((current / total) * 100).toFixed(2));
};

export const buildRecipeTracking = (params: {
  recipeRows: ReadonlyArray<{
    id: string;
    assigned_days: number;
    recipe: { name?: string | null } | null;
    budget_dog: { dog?: { name?: string | null } | null } | null;
  }>;
  preparations: ReadonlyArray<{ budget_dog_recipe_id: string; recipe_days: number }>;
  deliveries: ReadonlyArray<{ budget_dog_recipe_id: string; recipe_days: number }>;
}) => {
  const { recipeRows, preparations, deliveries } = params;

  const preparedByRecipe = new Map<string, number>();
  for (const row of preparations) {
    preparedByRecipe.set(
      row.budget_dog_recipe_id,
      (preparedByRecipe.get(row.budget_dog_recipe_id) ?? 0) + Number(row.recipe_days)
    );
  }

  const deliveredByRecipe = new Map<string, number>();
  for (const row of deliveries) {
    deliveredByRecipe.set(
      row.budget_dog_recipe_id,
      (deliveredByRecipe.get(row.budget_dog_recipe_id) ?? 0) + Number(row.recipe_days)
    );
  }

  return recipeRows.map((row) => {
    const assignedDays = Number(row.assigned_days ?? 0);
    const preparedDays = Math.min(preparedByRecipe.get(row.id) ?? 0, assignedDays);
    const deliveredDays = Math.min(deliveredByRecipe.get(row.id) ?? 0, assignedDays);

    return {
      budgetDogRecipeId: row.id,
      dogName: row.budget_dog?.dog?.name ?? 'Perro',
      recipeName: row.recipe?.name ?? 'Receta',
      assignedDays,
      preparedDays,
      deliveredDays,
      pendingPreparationDays: Math.max(assignedDays - preparedDays, 0),
      pendingDeliveryDays: Math.max(assignedDays - deliveredDays, 0),
      preparedPct: toPct(preparedDays, assignedDays),
      deliveredPct: toPct(deliveredDays, assignedDays)
    };
  });
};

export const getPaymentSummary = (payments: ReadonlyArray<PaymentRow>, totalPrice: number) => {
  const paidAmount = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  return {
    totalPrice,
    paidAmount,
    pendingAmount: Math.max(totalPrice - paidAmount, 0)
  };
};

export type DeliveryAlertEntry = {
  budgetId: string;
  budgetReferenceMonth: string;
  dogId: string;
  dogName: string;
  tutorName: string;
  recipeId: string;
  recipeName: string;
  budgetDogRecipeId: string;
  assignedDays: number;
  dayOfMonth: number;
  pct: number;
  totalMealsForPortion: number;
  deliveredMeals: number;
  remainingMeals: number;
  daysUntil: number;
};

export type DeliveryAlert = DeliveryAlertEntry;

export const getDeliveryAlerts = async (
  supabase: SupabaseClient,
  alertThresholdDays: number = 5,
  filterBudgetId?: string
): Promise<DeliveryAlert[]> => {
  const today = new Date();
  const todayOfMonth = today.getDate();

  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59).toISOString();

  let query = supabase
    .from('budgets')
    .select(`
      id,
      reference_month,
      budget_dogs(
        id,
        dog_id,
        delivery_schedule:dog_delivery_schedules(
          day_of_month,
          pct
        ),
        dogs!inner(
          name,
          tutors(full_name)
        )
      ),
      budget_dog_recipes(
        id,
        recipe_id,
        assigned_days,
        recipes(name),
        budget_recipe_deliveries(
          recipe_days,
          delivered_at
        )
      )
    `)
    .in('status', ['accepted', 'closed']);

  if (filterBudgetId) {
    query = query.eq('id', filterBudgetId);
  }

  const { data: budgets, error } = await query;

  if (error || !budgets) return [];

  const alerts: DeliveryAlert[] = [];

  for (const budget of budgets as any[]) {
    for (const budgetDog of budget.budget_dogs ?? []) {
      const schedule: Array<{ day_of_month: number; pct: number }> =
        (budgetDog.delivery_schedule as any) ?? [];

      if (schedule.length === 0) continue;

      const tutorName =
        (budgetDog.dogs?.tutors as any)?.full_name ?? 'Sin tutor';
      const dogName = budgetDog.dogs?.name ?? 'Perro';

      for (const recipe of budget.budget_dog_recipes ?? []) {
        const assignedDays = Number(recipe.assigned_days ?? 0);

        const deliveriesThisMonth = (recipe.budget_recipe_deliveries ?? []).filter((d: any) => {
          const deliveredAt = d.delivered_at;
          if (!deliveredAt) return false;
          return deliveredAt >= currentMonthStart && deliveredAt <= currentMonthEnd;
        });

        const deliveredMeals = deliveriesThisMonth.reduce(
          (sum: number, d: any) => sum + Number(d.recipe_days ?? 0),
          0
        );

        for (const entry of schedule) {
          const dayOfMonth = Number(entry.day_of_month);
          const pct = Number(entry.pct);

          if (!dayOfMonth || !pct) continue;

          let daysUntil = dayOfMonth - todayOfMonth;
          if (daysUntil < 0) daysUntil += 30;

          if (daysUntil > alertThresholdDays) continue;

          const totalMealsForPortion = Math.round(assignedDays * (pct / 100));
          const remainingMeals = Math.max(totalMealsForPortion - deliveredMeals, 0);

          if (remainingMeals <= 0) continue;

          alerts.push({
            budgetId: budget.id,
            budgetReferenceMonth: budget.reference_month ?? '',
            dogId: budgetDog.dog_id,
            dogName,
            tutorName,
            recipeId: recipe.recipe_id,
            recipeName: (recipe.recipes as any)?.name ?? 'Receta',
            budgetDogRecipeId: recipe.id,
            assignedDays,
            dayOfMonth,
            pct,
            totalMealsForPortion,
            deliveredMeals,
            remainingMeals,
            daysUntil
          });
        }
      }
    }
  }

  return alerts.sort((a, b) => a.daysUntil - b.daysUntil);
};
