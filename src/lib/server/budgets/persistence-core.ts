import type { SupabaseClient } from "@supabase/supabase-js";
import type { BudgetStatus } from "$lib/types/budget";
import type {
  BudgetOperationalInputs,
  CalculatedDogTotals,
} from "$lib/server/budgets/calculation";
import type {
  ParsedCompositionRow,
  OperationResult,
} from "$lib/server/budgets/types";
import { createTransaction } from "$lib/server/shared/multi-step-transaction";

export const saveBudgetComposition = async (params: {
  budgetId: string;
  supabase: SupabaseClient;
  composition: ReadonlyArray<ParsedCompositionRow>;
  dogTotals: ReadonlyArray<CalculatedDogTotals>;
}): Promise<OperationResult> => {
  const { budgetId, supabase, composition, dogTotals } = params;

  const tx = createTransaction(supabase);

  const requestedDaysByDog = new Map<string, number>();
  for (const row of composition) {
    requestedDaysByDog.set(
      row.dogId,
      (requestedDaysByDog.get(row.dogId) ?? 0) + row.assignedDays,
    );
  }

  const dogRows = dogTotals.map((dogTotal) => ({
    budget_id: budgetId,
    dog_id: dogTotal.dogId,
    requested_days: requestedDaysByDog.get(dogTotal.dogId) ?? 1,
    ingredient_total: dogTotal.ingredientTotal,
    operational_total: dogTotal.operationalTotal,
    total_cost: dogTotal.totalCost,
    final_sale_price: dogTotal.finalSalePrice,
  }));

  const { data: createdBudgetDogs, error: budgetDogsError } = await supabase
    .from("budget_dogs")
    .insert(dogRows)
    .select("id, dog_id");

  if (budgetDogsError || !createdBudgetDogs) {
    return {
      ok: false,
      message: "No pudimos guardar los perros del presupuesto.",
    };
  }

  const createdBudgetDogIds = createdBudgetDogs.map((b) => b.id);
  tx.registerRollback(async () => {
    await supabase.from("budget_dogs").delete().in("id", createdBudgetDogIds);
  });

  const budgetDogIdByDogId = new Map(
    createdBudgetDogs.map((row) => [row.dog_id, row.id]),
  );

  const recipeRows = composition.map((row) => ({
    budget_dog_id: budgetDogIdByDogId.get(row.dogId) ?? "",
    recipe_id: row.recipeId,
    assigned_days: row.assignedDays,
  }));

  const hasInvalidBudgetDogReference = recipeRows.some(
    (row) => !row.budget_dog_id,
  );
  if (hasInvalidBudgetDogReference) {
    await tx.rollback();
    return {
      ok: false,
      message: "No pudimos vincular recetas con perros del presupuesto.",
    };
  }

  const { error: recipeRowsError } = await supabase
    .from("budget_dog_recipes")
    .insert(recipeRows);
  if (recipeRowsError) {
    await tx.rollback();
    return {
      ok: false,
      message: "No pudimos guardar las recetas asignadas del presupuesto.",
    };
  }

  return { ok: true };
};

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
  const {
    tutorId,
    referenceMonth,
    referenceDays,
    notes,
    expiresAt,
    appliedMargin,
    ingredientTotal,
    operationalTotal,
    totalCost,
    finalSalePrice,
    operationals,
  } = params;

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
    kefir_qty: operationals.kefirQty,
  };
};

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

  const { error: snapshotError } = await supabase
    .from("budget_snapshots")
    .insert({
      budget_id: budgetId,
      snapshot_payload_json: snapshotData,
    });

  if (snapshotError) {
    return {
      ok: false,
      message:
        "No pudimos guardar el registro histórico del presupuesto. El presupuesto se guardó correctamente, solo no quedó registrado en el historial.",
    };
  }

  return { ok: true };
};

export const trackBudgetPersistenceIssue = async (params: {
  budgetId: string;
  supabase: SupabaseClient;
  stage: "snapshot";
  detail: string;
}): Promise<void> => {
  const { budgetId, supabase, stage, detail } = params;

  const { error } = await supabase.from("budget_persistence_events").insert({
    budget_id: budgetId,
    stage,
    detail,
    occurred_at: new Date().toISOString(),
  });

  if (error) {
    console.warn(
      "[persistBudget] No pudimos registrar telemetry de persistencia:",
      error.message,
    );
  }
};

export const updateBudgetStatus = async (params: {
  budgetId: string;
  supabase: SupabaseClient;
  status: BudgetStatus;
  extraFields?: Record<string, unknown>;
}): Promise<OperationResult> => {
  const { budgetId, supabase, status, extraFields } = params;

  const { error } = await supabase
    .from("budgets")
    .update({ status, ...extraFields })
    .eq("id", budgetId);

  if (error) {
    return { ok: false, message: "No pudimos actualizar el presupuesto." };
  }

  return { ok: true };
};

export const deleteBudget = async (params: {
  budgetId: string;
  supabase: SupabaseClient;
}): Promise<OperationResult> => {
  const { budgetId, supabase } = params;

  const { error } = await supabase.from("budgets").delete().eq("id", budgetId);

  if (error) {
    return { ok: false, message: "No pudimos eliminar el presupuesto." };
  }

  return { ok: true };
};

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
    .from("budgets")
    .select(
      "id, status, tutor_id, final_sale_price, expires_at, public_token, reference_month, reference_days",
    )
    .eq("id", budgetId)
    .maybeSingle();

  if (error || !data) return null;
  return { ...data, status: data.status as BudgetStatus };
};
