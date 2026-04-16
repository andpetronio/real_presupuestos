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
