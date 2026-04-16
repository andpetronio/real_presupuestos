import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { parseFormValue, parsePositiveInteger } from '$lib/server/forms/parsers';
import { buildRecipeTracking, getPaymentSummary, markBudgetViewed, type PaymentMethod } from '$lib/server/budgets/tracking';

const paymentMethods = new Set<PaymentMethod>(['cash', 'transfer', 'mercadopago', 'other']);

const parseDateToIso = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

export const load: PageServerLoad = async ({ locals, params }) => {
  const budgetId = params.budget_id;

  const { data: budget, error: budgetError } = await locals.supabase
    .from('budgets')
    .select('id, status, final_sale_price, accepted_at, tutor:tutors(full_name)')
    .eq('id', budgetId)
    .maybeSingle();

  if (budgetError || !budget || budget.status !== 'accepted') {
    throw redirect(303, '/seguimiento');
  }

  await markBudgetViewed({ supabase: locals.supabase, budgetId });

  const { data: recipeRows, error: recipeError } = await locals.supabase
    .from('budget_dog_recipes')
    .select('id, assigned_days, recipe:recipes(name), budget_dog:budget_dogs(id, budget_id, dog:dogs(name))')
    .eq('budget_dog.budget_id', budgetId)
    .order('created_at', { ascending: true });

  if (recipeError) {
    throw redirect(303, '/seguimiento');
  }

  const budgetRecipeIds = (recipeRows ?? []).map((row) => row.id);

  const [preparationsResult, deliveriesResult, paymentsResult] = await Promise.all([
    budgetRecipeIds.length
      ? locals.supabase
          .from('budget_recipe_preparations')
          .select('id, budget_dog_recipe_id, recipe_days, prepared_at, notes')
          .in('budget_dog_recipe_id', budgetRecipeIds)
          .order('prepared_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    budgetRecipeIds.length
      ? locals.supabase
          .from('budget_recipe_deliveries')
          .select('id, budget_dog_recipe_id, recipe_days, delivered_at, notes')
          .in('budget_dog_recipe_id', budgetRecipeIds)
          .order('delivered_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    locals.supabase
      .from('budget_payments')
      .select('id, budget_id, amount, payment_method, paid_at, notes')
      .eq('budget_id', budgetId)
      .order('paid_at', { ascending: false })
  ]);

  if (preparationsResult.error || deliveriesResult.error || paymentsResult.error) {
    throw redirect(303, '/seguimiento');
  }

  const recipeTracking = buildRecipeTracking({
    recipeRows:
      (recipeRows as Array<{
        id: string;
        assigned_days: number;
        recipe: { name?: string | null } | null;
        budget_dog: { dog?: { name?: string | null } | null } | null;
      }>) ?? [],
    preparations:
      (preparationsResult.data as Array<{ budget_dog_recipe_id: string; recipe_days: number }>) ?? [],
    deliveries:
      (deliveriesResult.data as Array<{ budget_dog_recipe_id: string; recipe_days: number }>) ?? []
  });

  const groupedByDog = new Map<string, Array<(typeof recipeTracking)[number]>>();
  for (const row of recipeTracking) {
    if (!groupedByDog.has(row.dogName)) groupedByDog.set(row.dogName, []);
    groupedByDog.get(row.dogName)?.push(row);
  }

  const dogs = Array.from(groupedByDog.entries()).map(([dogName, recipes]) => ({
    dogName,
    recipes,
    totalAssignedDays: recipes.reduce((sum, recipe) => sum + recipe.assignedDays, 0)
  }));

  const payments =
    (paymentsResult.data as Array<{
      id: string;
      budget_id: string;
      amount: number;
      payment_method: PaymentMethod;
      paid_at: string;
      notes: string | null;
    }>) ?? [];

  return {
    budget: {
      id: budget.id,
      tutorName: (budget.tutor as { full_name?: string | null } | null)?.full_name ?? 'Sin tutor',
      acceptedAt: budget.accepted_at,
      totalPrice: Number(budget.final_sale_price ?? 0)
    },
    dogs,
    recipeOptions: recipeTracking.map((recipe) => ({
      budgetDogRecipeId: recipe.budgetDogRecipeId,
      label: `${recipe.dogName} · ${recipe.recipeName} (${recipe.assignedDays} días)`
    })),
    preparations: preparationsResult.data ?? [],
    deliveries: deliveriesResult.data ?? [],
    payments,
    paymentSummary: getPaymentSummary(payments, Number(budget.final_sale_price ?? 0))
  };
};

export const actions: Actions = {
  addPayment: async ({ request, locals, params }) => {
    const formData = await request.formData();
    const amountRaw = parseFormValue(formData.get('amount'));
    const methodRaw = parseFormValue(formData.get('paymentMethod')) as PaymentMethod;
    const paidAtRaw = parseFormValue(formData.get('paidAt'));
    const notes = parseFormValue(formData.get('notes'));

    const amount = Number(amountRaw);
    const paidAt = parseDateToIso(paidAtRaw);

    if (!Number.isFinite(amount) || amount <= 0 || !paymentMethods.has(methodRaw) || !paidAt) {
      return fail(400, {
        operatorError: 'Completá monto (> 0), medio de pago y fecha válida para registrar el cobro.'
      });
    }

    const { error } = await locals.supabase.from('budget_payments').insert({
      budget_id: params.budget_id,
      amount,
      payment_method: methodRaw,
      paid_at: paidAt,
      notes: notes || null
    });

    if (error) {
      return fail(400, {
        operatorError: 'No pudimos registrar el cobro. Reintentá en unos segundos.'
      });
    }

    return { operatorSuccess: 'Cobro parcial registrado correctamente.' };
  },

  deletePayment: async ({ request, locals, params }) => {
    const formData = await request.formData();
    const paymentId = parseFormValue(formData.get('paymentId'));

    if (!paymentId) {
      return fail(400, { operatorError: 'No encontramos el cobro a eliminar.' });
    }

    const { error } = await locals.supabase
      .from('budget_payments')
      .delete()
      .eq('id', paymentId)
      .eq('budget_id', params.budget_id);

    if (error) {
      return fail(400, { operatorError: 'No pudimos eliminar el cobro.' });
    }

    return { operatorSuccess: 'Cobro eliminado.' };
  },

  addPreparation: async ({ request, locals }) => {
    const formData = await request.formData();
    const budgetDogRecipeId = parseFormValue(formData.get('budgetDogRecipeId'));
    const recipeDaysRaw = parseFormValue(formData.get('recipeDays'));
    const preparedAtRaw = parseFormValue(formData.get('entryDate'));
    const notes = parseFormValue(formData.get('notes'));

    const recipeDays = parsePositiveInteger(recipeDaysRaw);
    const preparedAt = parseDateToIso(preparedAtRaw);

    if (!budgetDogRecipeId || recipeDays === null || !preparedAt) {
      return fail(400, {
        operatorError: 'Seleccioná receta, días (> 0) y fecha válida para registrar preparación.'
      });
    }

    const { error } = await locals.supabase.from('budget_recipe_preparations').insert({
      budget_dog_recipe_id: budgetDogRecipeId,
      recipe_days: recipeDays,
      prepared_at: preparedAt,
      notes: notes || null
    });

    if (error) {
      return fail(400, {
        operatorError:
          error.code === '23514'
            ? 'No podés preparar más días que los asignados para esa receta.'
            : 'No pudimos registrar la preparación.'
      });
    }

    return { operatorSuccess: 'Preparación registrada correctamente.' };
  },

  deletePreparation: async ({ request, locals }) => {
    const formData = await request.formData();
    const preparationId = parseFormValue(formData.get('preparationId'));

    if (!preparationId) {
      return fail(400, { operatorError: 'No encontramos la preparación a eliminar.' });
    }

    const { error } = await locals.supabase
      .from('budget_recipe_preparations')
      .delete()
      .eq('id', preparationId);

    if (error) {
      return fail(400, { operatorError: 'No pudimos eliminar la preparación.' });
    }

    return { operatorSuccess: 'Preparación eliminada.' };
  },

  addDelivery: async ({ request, locals }) => {
    const formData = await request.formData();
    const budgetDogRecipeId = parseFormValue(formData.get('budgetDogRecipeId'));
    const recipeDaysRaw = parseFormValue(formData.get('recipeDays'));
    const deliveredAtRaw = parseFormValue(formData.get('entryDate'));
    const notes = parseFormValue(formData.get('notes'));

    const recipeDays = parsePositiveInteger(recipeDaysRaw);
    const deliveredAt = parseDateToIso(deliveredAtRaw);

    if (!budgetDogRecipeId || recipeDays === null || !deliveredAt) {
      return fail(400, {
        operatorError: 'Seleccioná receta, días (> 0) y fecha válida para registrar entrega.'
      });
    }

    const { error } = await locals.supabase.from('budget_recipe_deliveries').insert({
      budget_dog_recipe_id: budgetDogRecipeId,
      recipe_days: recipeDays,
      delivered_at: deliveredAt,
      notes: notes || null
    });

    if (error) {
      return fail(400, {
        operatorError:
          error.code === '23514'
            ? 'No podés entregar más días que los asignados para esa receta.'
            : 'No pudimos registrar la entrega.'
      });
    }

    return { operatorSuccess: 'Entrega registrada correctamente.' };
  },

  deleteDelivery: async ({ request, locals }) => {
    const formData = await request.formData();
    const deliveryId = parseFormValue(formData.get('deliveryId'));

    if (!deliveryId) {
      return fail(400, { operatorError: 'No encontramos la entrega a eliminar.' });
    }

    const { error } = await locals.supabase
      .from('budget_recipe_deliveries')
      .delete()
      .eq('id', deliveryId);

    if (error) {
      return fail(400, { operatorError: 'No pudimos eliminar la entrega.' });
    }

    return { operatorSuccess: 'Entrega eliminada.' };
  }
};
