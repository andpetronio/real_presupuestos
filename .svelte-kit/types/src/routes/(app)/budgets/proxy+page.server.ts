// @ts-nocheck
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { parseFormValue, parsePositiveInteger } from '$lib/server/forms/parsers';
import type { OperatorMessage } from '$lib/server/shared/ui-state';
import type { BudgetStatus } from '$lib/types/budget';

import type { ActionValues } from '$lib/server/budgets/types';
import { parseActionValues } from '$lib/server/budgets/parsers';
import { calculateBudgetTotals } from '$lib/server/budgets/calculation';
import { updateBudgetStatus, deleteBudget, getBudgetById, validateBudgetInput, getBudgetExpiry, persistBudget } from '$lib/server/budgets/persistence';
import { sendBudgetWhatsapp } from '$lib/server/budgets/whatsapp';

// ─── Error messages ──────────────────────────────────────────────────────────

const fallbackErrorMessage: OperatorMessage = {
  kind: 'error',
  title: 'No pudimos cargar presupuestos',
  detail: 'Reintentá en unos segundos o revisá la conexión con la base de datos.',
  actionLabel: 'Reintentar'
};

const toOperatorError = (action: 'create' | 'update', values: ActionValues, message: string, status = 400) =>
  fail(status, {
    actionType: action,
    operatorError: message,
    values
  });

// ─── Helpers ─────────────────────────────────────────────────────────────

const getBlankValues = (): ActionValues => ({
  budgetId: '',
  tutorId: '',
  budgetMonth: '',
  budgetDays: '',
  notes: '',
  vacuumBagSmallQty: '',
  vacuumBagLargeQty: '',
  labelsQty: '',
  nonWovenBagQty: '',
  laborHoursQty: '',
  cookingHoursQty: '',
  calciumQty: '',
  kefirQty: '',
  rows: [{ dogId: '', recipeId: '', assignedDays: '' }]
});

// ─── Core operations ───────────────────────────────────────────────────

const saveBudget = async (params: {
  action: 'create' | 'update';
  values: ActionValues;
  locals: { supabase: import('@supabase/supabase-js').SupabaseClient };
}) => {
  const { action, values, locals } = params;

  // Phase 1: Validate input and read DB data
  const validation = await validateBudgetInput({ values, supabase: locals.supabase });
  if (!validation.valid) {
    return toOperatorError(action, values, validation.operatorError);
  }

  // Phase 2: Calculate totals
  const calculation = calculateBudgetTotals({
    settings: validation.settings,
    operationals: validation.operationals,
    assignments: validation.composition,
    recipeDailyCosts: validation.recipeDailyCosts
  });

  // Phase 3: Compute expiry date
  const expiry = await getBudgetExpiry({
    action,
    budgetId: values.budgetId,
    settingsValidityDays: validation.settings.budgetValidityDays ?? 7,
    values,
    supabase: locals.supabase
  });
  if (!expiry.ok) {
    return toOperatorError(action, values, expiry.operatorError);
  }

  // Phase 4: Persist
  const persistence = await persistBudget({
    action,
    budgetId: values.budgetId ?? '',
    values,
    tutorId: validation.tutorId,
    referenceMonth: validation.referenceMonth,
    referenceDays: validation.referenceDays,
    notes: values.notes || null,
    expiresAt: expiry.expiresAt,
    calculation,
    operationals: validation.operationals,
    settings: validation.settings,
    composition: validation.composition,
    supabase: locals.supabase
  });

  if (!persistence.ok) {
    return toOperatorError(action, values, persistence.operatorError);
  }

  return {
    actionType: action,
    operatorSuccess: action === 'create' 
      ? 'Presupuesto borrador creado correctamente.' 
      : 'Borrador actualizado correctamente.',
    values: getBlankValues()
  };
};

// ─── Load ─────────────────────────────────────────────────────────────────

export const load = async ({ locals, url }: Parameters<PageServerLoad>[0]) => {
  try {
    // Auto-expirar presupuestos vencidos (si falla, continuamos)
    try {
      await locals.supabase
        .from('budgets')
        .update({ status: 'expired' })
        .eq('status', 'sent')
        .lte('expires_at', new Date().toISOString());
    } catch {
      // Si falla la expiración automática no frenamos la carga del dashboard.
    }

    const editingBudgetId = url.searchParams.get('edit');

    // Solo carga budgets. Los options van en cada form (new/update).
    const { data: budgetsResult, error: budgetsError } = await locals.supabase
      .from('budgets')
      .select(
        'id, status, tutor_id, reference_month, reference_days, notes, final_sale_price, total_cost, ingredient_total_global, operational_total_global, created_at, expires_at, vacuum_bag_small_qty, vacuum_bag_large_qty, labels_qty, non_woven_bag_qty, labor_hours_qty, cooking_hours_qty, calcium_qty, kefir_qty, tutor:tutors(full_name)'
      )
      .order('created_at', { ascending: false })
      .limit(50);

    if (budgetsError) throw budgetsError;

    const budgets = budgetsResult ?? [];
    const editingBudget = editingBudgetId ? budgets.find((b) => b.id === editingBudgetId) ?? null : null;

    let editingRows: Array<{ dogId: string; recipeId: string; assignedDays: string }> = [];
    if (editingBudgetId) {
      // JOIN: budget_dog_recipes + budget_dogs en una sola query
      const { data: budgetDogRecipesData, error: budgetDogRecipesError } = await locals.supabase
        .from('budget_dog_recipes')
        .select('budget_dog_id, recipe_id, assigned_days, budget_dog:budget_dogs(dog_id)')
        .eq('budget_dog.budget_id', editingBudgetId)
        .order('created_at', { ascending: true });

      if (budgetDogRecipesError) throw budgetDogRecipesError;

      editingRows = (budgetDogRecipesData ?? []).map((row) => ({
        dogId: (row.budget_dog as { dog_id?: string } | null)?.dog_id ?? '',
        recipeId: row.recipe_id,
        assignedDays: String(row.assigned_days)
      }));
    }

    return {
      budgets,
      editingBudget,
      editingRows,
      tableState: budgets.length > 0 ? 'success' : 'empty',
      tableMessage:
        budgets.length > 0
          ? null
          : ({
              kind: 'empty',
              title: 'Todavía no hay presupuestos',
              detail: 'Creá el primero con tutor, perros, recetas y costos operativos globales.'
            } satisfies OperatorMessage)
    };
  } catch {
    return {
      budgets: [],
      editingBudget: null,
      editingRows: [],
      tableState: 'error',
      tableMessage: fallbackErrorMessage
    };
  }
};

// ─── Actions ───────────────────────────────────────────────────────────────────────

export const actions = {
  create: async ({ request, locals }: import('./$types').RequestEvent) => {
    const formData = await request.formData();
    return saveBudget({ action: 'create', values: parseActionValues(formData), locals });
  },

  update: async ({ request, locals }: import('./$types').RequestEvent) => {
    const formData = await request.formData();
    return saveBudget({ action: 'update', values: parseActionValues(formData), locals });
  },

  sendWhatsapp: async ({ request, locals, url }: import('./$types').RequestEvent) => {
    const formData = await request.formData();
    const budgetId = parseFormValue(formData.get('budgetId'));

    if (!budgetId) {
      return fail(400, {
        actionType: 'sendWhatsapp',
        operatorError: 'No encontramos qué presupuesto enviar por WhatsApp.'
      });
    }

    const result = await sendBudgetWhatsapp({
      budgetId,
      supabase: locals.supabase,
      origin: url.origin,
      userAgent: request.headers?.get?.('user-agent') ?? null
    });

    if (!result.ok) {
      return fail(400, {
        actionType: 'sendWhatsapp',
        operatorError: result.message
      });
    }

    throw redirect(303, result.waMeUrl);
  },

  undoSent: async ({ request, locals }: import('./$types').RequestEvent) => {
    const formData = await request.formData();
    const budgetId = parseFormValue(formData.get('budgetId'));

    if (!budgetId) {
      return fail(400, {
        actionType: 'undoSent',
        operatorError: 'No encontramos el presupuesto a reabrir.'
      });
    }

    const budget = await getBudgetById({ budgetId, supabase: locals.supabase });
    if (!budget) {
      return fail(400, {
        actionType: 'undoSent',
        operatorError: 'No encontramos el presupuesto a reabrir.'
      });
    }

    if (budget.status !== 'sent') {
      return fail(400, {
        actionType: 'undoSent',
        operatorError: 'Solo podés reabrir presupuestos en estado enviado.'
      });
    }

    const result = await updateBudgetStatus({
      budgetId,
      supabase: locals.supabase,
      status: 'draft',
      extraFields: { sent_at: null }
    });

    if (!result.ok) {
      return fail(400, {
        actionType: 'undoSent',
        operatorError: result.message
      });
    }

    return {
      actionType: 'undoSent',
      operatorSuccess: 'Presupuesto reabierto en borrador.'
    };
  },

  delete: async ({ request, locals }: import('./$types').RequestEvent) => {
    const formData = await request.formData();
    const budgetId = parseFormValue(formData.get('budgetId'));

    if (!budgetId) {
      return fail(400, {
        actionType: 'delete',
        operatorError: 'No encontramos el presupuesto a eliminar.'
      });
    }

    const budget = await getBudgetById({ budgetId, supabase: locals.supabase });
    if (!budget) {
      return fail(400, {
        actionType: 'delete',
        operatorError: 'No encontramos el presupuesto a eliminar.'
      });
    }

    if (budget.status !== 'draft') {
      return fail(400, {
        actionType: 'delete',
        operatorError: 'Solo se pueden eliminar presupuestos en estado borrador.'
      });
    }

    const result = await deleteBudget({ budgetId, supabase: locals.supabase });
    if (!result.ok) {
      return fail(400, {
        actionType: 'delete',
        operatorError: result.message
      });
    }

    return {
      actionType: 'delete',
      operatorSuccess: 'Presupuesto eliminado correctamente.'
    };
  }
};;null as any as Actions;