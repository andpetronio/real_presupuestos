/**
 * Persistencia de budgets en Supabase.
 * Maneja inserts, updates y deletes de budgets y relaciones.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { BudgetStatus } from '$lib/types/budget';
import type { BudgetOperationalInputs, CalculatedDogTotals } from './calculation';
import type { ParsedCompositionRow, OperationResult } from './types';
import { createTransaction } from '$lib/server/shared/multi-step-transaction';

/**
 * Guarda la composición del presupuesto (budget_dogs + budget_dog_recipes).
 * Ejecuta operaciones en orden seguro con rollback automático.
 *
 * @param params.budgetId ID del presupuesto padre.
 * @param params.supabase Instancia de Supabase.
 * @param params.composition Filas de composición parseadas.
 * @param params.dogTotals Totales calculados por perro.
 */
export const saveBudgetComposition = async (params: {
  budgetId: string;
  supabase: SupabaseClient;
  composition: ReadonlyArray<ParsedCompositionRow>;
  dogTotals: ReadonlyArray<CalculatedDogTotals>;
}): Promise<OperationResult> => {
  const { budgetId, supabase, composition, dogTotals } = params;

  const tx = createTransaction(supabase);

  // Mapear días requeridos por perro
  const requestedDaysByDog = new Map<string, number>();
  for (const row of composition) {
    requestedDaysByDog.set(row.dogId, (requestedDaysByDog.get(row.dogId) ?? 0) + row.assignedDays);
  }

  // Preparar budget_dogs rows
  const dogRows = dogTotals.map((dogTotal) => ({
    budget_id: budgetId,
    dog_id: dogTotal.dogId,
    requested_days: requestedDaysByDog.get(dogTotal.dogId) ?? 1,
    ingredient_total: dogTotal.ingredientTotal,
    operational_total: dogTotal.operationalTotal,
    total_cost: dogTotal.totalCost,
    final_sale_price: dogTotal.finalSalePrice
  }));

  // Insertar budget_dogs
  const { data: createdBudgetDogs, error: budgetDogsError } = await supabase
    .from('budget_dogs')
    .insert(dogRows)
    .select('id, dog_id');

  if (budgetDogsError || !createdBudgetDogs) {
    return { ok: false, message: 'No pudimos guardar los perros del presupuesto.' };
  }

  // Registrar rollback para budget_dogs si falla el siguiente paso
  const createdBudgetDogIds = createdBudgetDogs.map((b) => b.id);
  tx.registerRollback(async () => {
    await supabase.from('budget_dogs').delete().in('id', createdBudgetDogIds);
  });

  // Mapear budget_dog_id por dog_id
  const budgetDogIdByDogId = new Map(createdBudgetDogs.map((row) => [row.dog_id, row.id]));

  // Preparar budget_dog_recipes rows
  const recipeRows = composition.map((row) => ({
    budget_dog_id: budgetDogIdByDogId.get(row.dogId) ?? '',
    recipe_id: row.recipeId,
    assigned_days: row.assignedDays
  }));

  const hasInvalidBudgetDogReference = recipeRows.some((row) => !row.budget_dog_id);
  if (hasInvalidBudgetDogReference) {
    await tx.rollback();
    return { ok: false, message: 'No pudimos vincular recetas con perros del presupuesto.' };
  }

  // Insertar budget_dog_recipes
  const { error: recipeRowsError } = await supabase.from('budget_dog_recipes').insert(recipeRows);
  if (recipeRowsError) {
    await tx.rollback();
    return { ok: false, message: 'No pudimos guardar las recetas asignadas del presupuesto.' };
  }

  return { ok: true };
};

/**
 * Construye el payload para crear o actualizar un presupuesto.
 */
export const buildBudgetPayload = (params: {
  tutorId: string;
  referenceMonth: string;
  referenceDays: number;
  notes: string | null;
  expiresAt: string;
  appliedMargin: number;
  ingredientTotal: number;
  operationalTotal: number;
  totalCost: number;
  finalSalePrice: number;
  operationals: BudgetOperationalInputs;
}) => {
  const { tutorId, referenceMonth, referenceDays, notes, expiresAt, appliedMargin, ingredientTotal, operationalTotal, totalCost, finalSalePrice, operationals } = params;

  return {
    tutor_id: tutorId,
    reference_month: referenceMonth,
    reference_days: referenceDays,
    notes,
    expires_at: expiresAt,
    applied_margin: appliedMargin,
    ingredient_total_global: ingredientTotal,
    operational_total_global: operationalTotal,
    total_cost: totalCost,
    final_sale_price: finalSalePrice,
    vacuum_bag_small_qty: operationals.vacuumBagSmallQty,
    vacuum_bag_large_qty: operationals.vacuumBagLargeQty,
    labels_qty: operationals.labelsQty,
    non_woven_bag_qty: operationals.nonWovenBagQty,
    labor_hours_qty: operationals.laborHoursQty,
    cooking_hours_qty: operationals.cookingHoursQty,
    calcium_qty: operationals.calciumQty,
    kefir_qty: operationals.kefirQty
  };
};

/**
 * Crea un snapshot histórico del presupuesto.
 */
export const saveBudgetSnapshot = async (params: {
  budgetId: string;
  supabase: SupabaseClient;
  snapshotData: {
    tutorId: string;
    composition: ReadonlyArray<ParsedCompositionRow>;
    operationals: BudgetOperationalInputs;
    settings: unknown;
    totals: unknown;
  };
}): Promise<OperationResult> => {
  const { budgetId, supabase, snapshotData } = params;

  const { error: snapshotError } = await supabase.from('budget_snapshots').insert({
    budget_id: budgetId,
    snapshot_payload_json: snapshotData
  });

  if (snapshotError) {
    return { ok: false, message: 'No pudimos guardar el registro histórico del presupuesto. El presupuesto se guardó correctamente, solo no quedó registrado en el historial.' };
  }

  return { ok: true };
};

/**
 * Cambia el estado de un presupuesto.
 */
export const updateBudgetStatus = async (params: {
  budgetId: string;
  supabase: SupabaseClient;
  status: BudgetStatus;
  extraFields?: Record<string, unknown>;
}): Promise<OperationResult> => {
  const { budgetId, supabase, status, extraFields } = params;

  const { error } = await supabase
    .from('budgets')
    .update({ status, ...extraFields })
    .eq('id', budgetId);

  if (error) {
    return { ok: false, message: 'No pudimos actualizar el presupuesto.' };
  }

  return { ok: true };
};

/**
 * Elimina un presupuesto (solo si está en draft).
 */
export const deleteBudget = async (params: {
  budgetId: string;
  supabase: SupabaseClient;
}): Promise<OperationResult> => {
  const { budgetId, supabase } = params;

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', budgetId);

  if (error) {
    return { ok: false, message: 'No pudimos eliminar el presupuesto.' };
  }

  return { ok: true };
};

/**
 * Lee un presupuesto por ID.
 */
export const getBudgetById = async (params: {
  budgetId: string;
  supabase: SupabaseClient;
}): Promise<{
  id: string;
  status: BudgetStatus;
  tutor_id: string;
  final_sale_price: number | null;
  expires_at: string | null;
  public_token: string | null;
  reference_month: string | null;
  reference_days: number | null;
} | null> => {
  const { budgetId, supabase } = params;

  const { data, error } = await supabase
    .from('budgets')
    .select('id, status, tutor_id, final_sale_price, expires_at, public_token, reference_month, reference_days')
    .eq('id', budgetId)
    .maybeSingle();

  if (error || !data) return null;
  return { ...data, status: data.status as BudgetStatus };
};

// ─── Importaciones para las funciones de save ─────────────────────────────────

import { parseMonthInput } from './parsers';
import { parseComposition, parseOperationalInputs, getSettingsForBudgetFormula, readRecipeDailyCosts, parseDefaultExpiration, createBudgetPublicToken } from './parsers';
import { calculateBudgetTotals, type BudgetSettingsCosts } from './calculation';
import type { ActionValues } from './types';

/**
 * Resultado de validación de entrada de presupuesto.
 */
export type ValidateBudgetInputResult =
  | {
      valid: true;
      tutorId: string;
      referenceMonth: string;
      referenceDays: number;
      composition: ReadonlyArray<ParsedCompositionRow>;
      operationals: BudgetOperationalInputs;
      settings: BudgetSettingsCosts;
      recipeDailyCosts: ReadonlyArray<{ recipeId: string; dailyCost: number }>;
    }
  | { valid: false; operatorError: string; values: ActionValues };

/**
 * Fase 1: Valida toda la entrada y lee los datos de BD necesarios para guardar.
 * Retorna los datos validados o un objeto de error.
 *
 * Llamado por: +page.server.ts saveBudget orchestrator
 */
export const validateBudgetInput = async (params: {
  values: ActionValues;
  supabase: SupabaseClient;
}): Promise<ValidateBudgetInputResult> => {
  const { values, supabase } = params;

  // Validaciones requeridas
  if (!values.tutorId) {
    return { valid: false, operatorError: 'Seleccioná un tutor para armar el presupuesto.', values };
  }

  const referenceMonth = parseMonthInput(values.budgetMonth);
  if (!referenceMonth) {
    return { valid: false, operatorError: 'Indicá el mes del presupuesto con formato válido (AAAA-MM).', values };
  }

  const composition = parseComposition(values.rows);
  if (!composition) {
    return { valid: false, operatorError: 'Cargá al menos una receta con perro y días asignados (sin duplicar receta por perro).', values };
  }

  // reference_days del presupuesto = máximo de días entre perros (no suma total)
  const requestedDaysByDog = new Map<string, number>();
  for (const row of composition) {
    requestedDaysByDog.set(row.dogId, (requestedDaysByDog.get(row.dogId) ?? 0) + row.assignedDays);
  }

  const referenceDays = Math.max(...Array.from(requestedDaysByDog.values()));

  const operationals = parseOperationalInputs(values);
  if (!operationals) {
    return { valid: false, operatorError: 'Revisá los costos globales: deben ser números mayores o iguales a 0.', values };
  }

  const settings = await getSettingsForBudgetFormula(supabase);
  if (!settings) {
    return { valid: false, operatorError: 'No pudimos leer configuración de costos para calcular el presupuesto.', values };
  }

  if (settings.mealPlanMargin >= 1) {
    return { valid: false, operatorError: 'El margen comercial configurado no puede ser mayor o igual a 100%.', values };
  }

  // Validar perros y recetas existen y pertenecen al tutor
  const dogIds = Array.from(new Set(composition.map((row) => row.dogId)));
  const recipeIds = Array.from(new Set(composition.map((row) => row.recipeId)));

  const [dogsResult, recipesResult] = await Promise.all([
    supabase.from('dogs').select('id, tutor_id').in('id', dogIds),
    supabase.from('recipes').select('id, dog_id').in('id', recipeIds)
  ]);

  if (dogsResult.error || recipesResult.error) {
    return { valid: false, operatorError: 'No pudimos validar perros y recetas. Reintentá en unos segundos.', values };
  }

  const dogs = dogsResult.data ?? [];
  const recipes = recipesResult.data ?? [];
  const dogById = new Map(dogs.map((dog) => [dog.id, dog]));
  const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));

  if (dogById.size !== dogIds.length) {
    return { valid: false, operatorError: 'Hay perros inválidos en la composición del presupuesto.', values };
  }

  if (recipeById.size !== recipeIds.length) {
    return { valid: false, operatorError: 'Hay recetas inválidas en la composición del presupuesto.', values };
  }

  for (const dog of dogs) {
    if (dog.tutor_id !== values.tutorId) {
      return { valid: false, operatorError: 'Todos los perros del presupuesto deben pertenecer al tutor seleccionado.', values };
    }
  }

  for (const row of composition) {
    const recipe = recipeById.get(row.recipeId);
    if (!recipe || recipe.dog_id !== row.dogId) {
      return { valid: false, operatorError: 'Cada receta debe corresponder al perro seleccionado.', values };
    }
  }

  // Leer costos de recetas
  const recipeDailyCostsResult = await readRecipeDailyCosts(supabase, recipeIds);
  if (!recipeDailyCostsResult) {
    return { valid: false, operatorError: 'No pudimos calcular costos de recetas. Reintentá en unos segundos.', values };
  }

  return {
    valid: true,
    tutorId: values.tutorId,
    referenceMonth,
    referenceDays,
    composition,
    operationals,
    settings,
    recipeDailyCosts: recipeDailyCostsResult
  };
};

/**
 * Resultado de calcular fecha de vencimiento.
 */
export type BudgetExpiryResult =
  | { ok: true; expiresAt: string }
  | { ok: false; operatorError: string; values: ActionValues };

/**
 * Fase 2: Calcula la fecha de vencimiento del presupuesto.
 * Para updates, mantiene la fecha de creación original.
 *
 * Llamado por: +page.server.ts saveBudget orchestrator
 */
export const getBudgetExpiry = async (params: {
  action: 'create' | 'update';
  budgetId?: string;
  settingsValidityDays: number;
  values: ActionValues;
  supabase: SupabaseClient;
}): Promise<BudgetExpiryResult> => {
  const { action, budgetId, settingsValidityDays, values, supabase } = params;

  let expiresAt = parseDefaultExpiration(settingsValidityDays);

  // Para updates, mantener fecha de creación original
  if (action === 'update' && budgetId) {
    const { data: currentBudgetDate, error: currentBudgetDateError } = await supabase
      .from('budgets')
      .select('created_at')
      .eq('id', budgetId)
      .maybeSingle();

    if (!currentBudgetDateError && currentBudgetDate?.created_at) {
      const baseCreatedAt = new Date(currentBudgetDate.created_at);
      if (!Number.isNaN(baseCreatedAt.getTime())) {
        baseCreatedAt.setDate(baseCreatedAt.getDate() + settingsValidityDays);
        expiresAt = baseCreatedAt.toISOString();
      }
    }
  }

  return { ok: true, expiresAt };
};

/**
 * Resultado de persistir el presupuesto.
 */
export type PersistBudgetResult =
  | { ok: true; budgetId: string }
  | { ok: false; operatorError: string; values: ActionValues };

/**
 * Fase 3: Persiste el presupuesto en la base de datos.
 * Incluye insert/update, guardar composición y snapshot.
 *
 * Llamado por: +page.server.ts saveBudget orchestrator
 */
export const persistBudget = async (params: {
  action: 'create' | 'update';
  budgetId: string;
  values: ActionValues;
  tutorId: string;
  referenceMonth: string;
  referenceDays: number;
  notes: string | null;
  expiresAt: string;
  calculation: {
    appliedMargin: number;
    ingredientTotal: number;
    operationalTotal: number;
    totalCost: number;
    finalSalePrice: number;
    dogTotals: ReadonlyArray<CalculatedDogTotals>;
  };
  operationals: BudgetOperationalInputs;
  settings: BudgetSettingsCosts;
  composition: ReadonlyArray<ParsedCompositionRow>;
  supabase: SupabaseClient;
}): Promise<PersistBudgetResult> => {
  const { action, budgetId, values, tutorId, referenceMonth, referenceDays, notes, expiresAt, calculation, operationals, settings, composition, supabase } = params;

  // Payload para el presupuesto
  const payload = {
    tutor_id: tutorId,
    reference_month: referenceMonth,
    reference_days: referenceDays,
    notes,
    expires_at: expiresAt,
    applied_margin: calculation.appliedMargin,
    ingredient_total_global: calculation.ingredientTotal,
    operational_total_global: calculation.operationalTotal,
    total_cost: calculation.totalCost,
    final_sale_price: calculation.finalSalePrice,
    vacuum_bag_small_qty: operationals.vacuumBagSmallQty,
    vacuum_bag_large_qty: operationals.vacuumBagLargeQty,
    labels_qty: operationals.labelsQty,
    non_woven_bag_qty: operationals.nonWovenBagQty,
    labor_hours_qty: operationals.laborHoursQty,
    cooking_hours_qty: operationals.cookingHoursQty,
    calcium_qty: operationals.calciumQty,
    kefir_qty: operationals.kefirQty
  };

  let newBudgetId = budgetId;

  if (action === 'create') {
    const { data: createdBudget, error: createError } = await supabase
      .from('budgets')
      .insert({
        status: 'draft',
        public_token: createBudgetPublicToken(),
        ...payload
      })
      .select('id')
      .single();

    if (createError || !createdBudget) {
      return { ok: false, operatorError: 'No pudimos crear el presupuesto borrador. Reintentá en unos segundos.', values };
    }

    newBudgetId = createdBudget.id;
  } else {
    if (!budgetId) {
      return { ok: false, operatorError: 'No encontramos el presupuesto a editar.', values };
    }

    const { data: currentBudget, error: currentBudgetError } = await supabase
      .from('budgets')
      .select('status')
      .eq('id', budgetId)
      .maybeSingle();

    if (currentBudgetError || !currentBudget) {
      return { ok: false, operatorError: 'No encontramos el presupuesto a editar.', values };
    }

    if ((currentBudget.status as BudgetStatus) !== 'draft') {
      return { ok: false, operatorError: 'Solo se pueden editar presupuestos en estado borrador.', values };
    }

    const { error: updateError } = await supabase.from('budgets').update(payload).eq('id', budgetId);
    if (updateError) {
      return { ok: false, operatorError: 'No pudimos guardar el borrador. Reintentá en unos segundos.', values };
    }
  }

  // Guardar snapshot PRIMERO — es histórico, no afecta la operación del presupuesto.
  // Si falla, el presupuesto sigue funcional; solo perdemos el registro histórico.
  const snapshotResult = await saveBudgetSnapshot({
    budgetId: newBudgetId,
    supabase,
    snapshotData: {
      tutorId,
      composition,
      operationals,
      settings,
      totals: calculation
    }
  });

  if (!snapshotResult.ok) {
    // Snapshot es no-crítico: logueamos pero no bloqueamos la operación.
    // El mensaje de error refleja que el presupuesto se guardó OK.
    console.warn('[persistBudget] Snapshot falló (no crítico):', snapshotResult.message);
  }

  // Guardar composición SEGUNDO — es crítica, el presupuesto no funciona sin esto.
  const compositionSaveResult = await saveBudgetComposition({
    budgetId: newBudgetId,
    supabase,
    composition,
    dogTotals: calculation.dogTotals
  });

  if (!compositionSaveResult.ok) {
    return { ok: false, operatorError: compositionSaveResult.message, values };
  }

  return { ok: true, budgetId: newBudgetId };
};
