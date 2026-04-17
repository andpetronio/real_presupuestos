import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
  const dogId = params.dog_id;

  const { data: dogData, error: dogError } = await locals.supabase
    .from('dogs')
    .select('id, name, tutor_id, diet_type, meals_per_day, is_active, tutors(full_name)')
    .eq('id', dogId)
    .single();

  if (dogError || !dogData) {
    throw redirect(303, '/dogs');
  }

  const tutorName = (dogData.tutors as { full_name?: string | null } | null)?.full_name ?? 'Sin tutor';

  const { data: budgetDogRows, error: budgetDogError } = await locals.supabase
    .from('budget_dogs')
    .select('id, budget_id')
    .eq('dog_id', dogId);

  if (budgetDogError) {
    throw redirect(303, '/dogs');
  }

  const budgetIds = [...new Set((budgetDogRows ?? []).map((r) => r.budget_id))];

  const [budgetsResult, recipesResult, paymentsResult] = await Promise.all([
    budgetIds.length
      ? locals.supabase
          .from('budgets')
          .select('id, status, reference_month, final_sale_price, accepted_at')
          .in('id', budgetIds)
      : Promise.resolve({ data: [], error: null }),
    budgetIds.length
      ? locals.supabase
          .from('budget_dog_recipes')
          .select('id, assigned_days, budget_dog_id, recipe:recipes(name)')
          .in('budget_dog_id', (budgetDogRows ?? []).map((r) => r.id))
      : Promise.resolve({ data: [], error: null }),
    budgetIds.length
      ? locals.supabase
          .from('budget_payments')
          .select('budget_id, amount, payment_method, paid_at')
          .in('budget_id', budgetIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  const recipes = recipesResult.data ?? [];
  const recipeIds = recipes.map((r) => r.id);

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

  const recipeToBudgetDog = new Map(recipes.map((r) => [r.id, r.budget_dog_id]));
  const budgetDogToBudget = new Map((budgetDogRows ?? []).map((r) => [r.id, r.budget_id]));

  const recipeToPrepared = new Map<string, number>();
  for (const p of preparationsResult.data ?? []) {
    recipeToPrepared.set(p.budget_dog_recipe_id, (recipeToPrepared.get(p.budget_dog_recipe_id) ?? 0) + Number(p.recipe_days));
  }

  const recipeToDelivered = new Map<string, number>();
  for (const d of deliveriesResult.data ?? []) {
    recipeToDelivered.set(d.budget_dog_recipe_id, (recipeToDelivered.get(d.budget_dog_recipe_id) ?? 0) + Number(d.recipe_days));
  }

  const paidByBudget = new Map<string, number>();
  for (const p of paymentsResult.data ?? []) {
    paidByBudget.set(p.budget_id, (paidByBudget.get(p.budget_id) ?? 0) + Number(p.amount));
  }

  const recipesByBudgetDog = new Map<string, typeof recipes>();
  for (const r of recipes) {
    const list = recipesByBudgetDog.get(r.budget_dog_id) ?? [];
    list.push(r);
    recipesByBudgetDog.set(r.budget_dog_id, list);
  }

  const budgetsMap = new Map((budgetsResult.data ?? []).map((b) => [b.id, b]));

  const budgetSummaries = budgetIds
    .map((bid) => {
      const budget = budgetsMap.get(bid);
      if (!budget) return null;

      const budgetDogs = (budgetDogRows ?? []).filter((bd) => bd.budget_id === bid);
      const budgetDogIds = budgetDogs.map((bd) => bd.id);

      const budgetRecipes = recipes.filter((r) => budgetDogIds.includes(r.budget_dog_id));

      const recipesSummary = budgetRecipes.map((r) => {
        const assigned = Number(r.assigned_days ?? 0);
        return {
          recipeName: (r.recipe as { name?: string | null } | null)?.name ?? 'Receta',
          assignedDays: assigned,
          preparedDays: Math.min(recipeToPrepared.get(r.id) ?? 0, assigned),
          deliveredDays: Math.min(recipeToDelivered.get(r.id) ?? 0, assigned)
        };
      });

      const totalAssigned = budgetRecipes.reduce((sum, r) => sum + Number(r.assigned_days ?? 0), 0);
      const totalPrepared = budgetRecipes.reduce((sum, r) => sum + Math.min(recipeToPrepared.get(r.id) ?? 0, Number(r.assigned_days ?? 0)), 0);
      const totalDelivered = budgetRecipes.reduce((sum, r) => sum + Math.min(recipeToDelivered.get(r.id) ?? 0, Number(r.assigned_days ?? 0)), 0);

      return {
        budgetId: bid,
        status: budget.status,
        referenceMonth: budget.reference_month,
        acceptedAt: budget.accepted_at,
        totalPrice: Number(budget.final_sale_price ?? 0),
        paid: paidByBudget.get(bid) ?? 0,
        totalAssignedDays: totalAssigned,
        totalPreparedDays: totalPrepared,
        totalDeliveredDays: totalDelivered,
        recipes: recipesSummary
      };
    })
    .filter(Boolean);

  return {
    dog: {
      id: dogData.id,
      name: dogData.name,
      tutorName,
      dietType: dogData.diet_type,
      mealsPerDay: dogData.meals_per_day,
      isActive: dogData.is_active
    },
    budgets: budgetSummaries
  };
};
