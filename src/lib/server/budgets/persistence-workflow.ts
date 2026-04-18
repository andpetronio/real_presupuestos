import type { SupabaseClient } from "@supabase/supabase-js";
import type { BudgetStatus } from "$lib/types/budget";
import type {
  BudgetOperationalInputs,
  CalculatedDogTotals,
  BudgetSettingsCosts,
} from "$lib/server/budgets/calculation";
import type {
  ActionValues,
  ParsedCompositionRow,
} from "$lib/server/budgets/types";
import {
  parseMonthInput,
  parseComposition,
  parseOperationalInputs,
  getSettingsForBudgetFormula,
  readRecipeDailyCosts,
  parseDefaultExpiration,
  createBudgetPublicToken,
} from "$lib/server/budgets/parsers";
import {
  saveBudgetComposition,
  saveBudgetSnapshot,
  trackBudgetPersistenceIssue,
  buildBudgetPayload,
} from "$lib/server/budgets/persistence-core";

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

export const validateBudgetInput = async (params: {
  values: ActionValues;
  supabase: SupabaseClient;
}): Promise<ValidateBudgetInputResult> => {
  const { values, supabase } = params;

  if (!values.tutorId) {
    return {
      valid: false,
      operatorError: "Seleccioná un tutor para armar el presupuesto.",
      values,
    };
  }

  const referenceMonth = parseMonthInput(values.budgetMonth);
  if (!referenceMonth) {
    return {
      valid: false,
      operatorError:
        "Indicá el mes del presupuesto con formato válido (AAAA-MM).",
      values,
    };
  }

  const composition = parseComposition(values.rows);
  if (!composition) {
    return {
      valid: false,
      operatorError:
        "Cargá al menos una receta con perro y días asignados (sin duplicar receta por perro).",
      values,
    };
  }

  const requestedDaysByDog = new Map<string, number>();
  for (const row of composition) {
    requestedDaysByDog.set(
      row.dogId,
      (requestedDaysByDog.get(row.dogId) ?? 0) + row.assignedDays,
    );
  }

  const referenceDays = Math.max(...Array.from(requestedDaysByDog.values()));

  const operationals = parseOperationalInputs(values);
  if (!operationals) {
    return {
      valid: false,
      operatorError:
        "Revisá los costos globales: deben ser números mayores o iguales a 0.",
      values,
    };
  }

  const settings = await getSettingsForBudgetFormula(supabase);
  if (!settings) {
    return {
      valid: false,
      operatorError:
        "No pudimos leer configuración de costos para calcular el presupuesto.",
      values,
    };
  }

  if (settings.mealPlanMargin >= 1) {
    return {
      valid: false,
      operatorError:
        "El margen comercial configurado no puede ser mayor o igual a 100%.",
      values,
    };
  }

  const dogIds = Array.from(new Set(composition.map((row) => row.dogId)));
  const recipeIds = Array.from(new Set(composition.map((row) => row.recipeId)));

  const [dogsResult, recipesResult] = await Promise.all([
    supabase.from("dogs").select("id, tutor_id").in("id", dogIds),
    supabase.from("recipes").select("id, dog_id").in("id", recipeIds),
  ]);

  if (dogsResult.error || recipesResult.error) {
    return {
      valid: false,
      operatorError:
        "No pudimos validar perros y recetas. Reintentá en unos segundos.",
      values,
    };
  }

  const dogs = dogsResult.data ?? [];
  const recipes = recipesResult.data ?? [];
  const dogById = new Map(dogs.map((dog) => [dog.id, dog]));
  const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));

  if (dogById.size !== dogIds.length) {
    return {
      valid: false,
      operatorError: "Hay perros inválidos en la composición del presupuesto.",
      values,
    };
  }

  if (recipeById.size !== recipeIds.length) {
    return {
      valid: false,
      operatorError: "Hay recetas inválidas en la composición del presupuesto.",
      values,
    };
  }

  for (const dog of dogs) {
    if (dog.tutor_id !== values.tutorId) {
      return {
        valid: false,
        operatorError:
          "Todos los perros del presupuesto deben pertenecer al tutor seleccionado.",
        values,
      };
    }
  }

  for (const row of composition) {
    const recipe = recipeById.get(row.recipeId);
    if (!recipe || recipe.dog_id !== row.dogId) {
      return {
        valid: false,
        operatorError: "Cada receta debe corresponder al perro seleccionado.",
        values,
      };
    }
  }

  const recipeDailyCostsResult = await readRecipeDailyCosts(
    supabase,
    recipeIds,
  );
  if (!recipeDailyCostsResult) {
    return {
      valid: false,
      operatorError:
        "No pudimos calcular costos de recetas. Reintentá en unos segundos.",
      values,
    };
  }

  return {
    valid: true,
    tutorId: values.tutorId,
    referenceMonth,
    referenceDays,
    composition,
    operationals,
    settings,
    recipeDailyCosts: recipeDailyCostsResult,
  };
};

export type BudgetExpiryResult =
  | { ok: true; expiresAt: string }
  | { ok: false; operatorError: string; values: ActionValues };

export const getBudgetExpiry = async (params: {
  action: "create" | "update";
  budgetId?: string;
  settingsValidityDays: number;
  values: ActionValues;
  supabase: SupabaseClient;
}): Promise<BudgetExpiryResult> => {
  const { action, budgetId, settingsValidityDays, supabase } = params;

  let expiresAt = parseDefaultExpiration(settingsValidityDays);

  if (action === "update" && budgetId) {
    const { data: currentBudgetDate, error: currentBudgetDateError } =
      await supabase
        .from("budgets")
        .select("created_at")
        .eq("id", budgetId)
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

export type PersistBudgetResult =
  | { ok: true; budgetId: string }
  | { ok: false; operatorError: string; values: ActionValues };

export const persistBudget = async (params: {
  action: "create" | "update";
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
  const {
    action,
    budgetId,
    values,
    tutorId,
    referenceMonth,
    referenceDays,
    notes,
    expiresAt,
    calculation,
    operationals,
    settings,
    composition,
    supabase,
  } = params;

  const payload = buildBudgetPayload({
    tutorId,
    referenceMonth,
    referenceDays,
    notes,
    expiresAt,
    appliedMargin: calculation.appliedMargin,
    ingredientTotal: calculation.ingredientTotal,
    operationalTotal: calculation.operationalTotal,
    totalCost: calculation.totalCost,
    finalSalePrice: calculation.finalSalePrice,
    operationals,
  });

  let newBudgetId = budgetId;

  if (action === "create") {
    const { data: createdBudget, error: createError } = await supabase
      .from("budgets")
      .insert({
        status: "draft",
        public_token: createBudgetPublicToken(),
        ...payload,
      })
      .select("id")
      .single();

    if (createError || !createdBudget) {
      return {
        ok: false,
        operatorError:
          "No pudimos crear el presupuesto borrador. Reintentá en unos segundos.",
        values,
      };
    }

    newBudgetId = createdBudget.id;
  } else {
    if (!budgetId) {
      return {
        ok: false,
        operatorError: "No encontramos el presupuesto a editar.",
        values,
      };
    }

    const { data: currentBudget, error: currentBudgetError } = await supabase
      .from("budgets")
      .select("status")
      .eq("id", budgetId)
      .maybeSingle();

    if (currentBudgetError || !currentBudget) {
      return {
        ok: false,
        operatorError: "No encontramos el presupuesto a editar.",
        values,
      };
    }

    if ((currentBudget.status as BudgetStatus) !== "draft") {
      return {
        ok: false,
        operatorError: "Solo se pueden editar presupuestos en estado borrador.",
        values,
      };
    }

    const { error: updateError } = await supabase
      .from("budgets")
      .update(payload)
      .eq("id", budgetId);
    if (updateError) {
      return {
        ok: false,
        operatorError:
          "No pudimos guardar el borrador. Reintentá en unos segundos.",
        values,
      };
    }
  }

  const snapshotResult = await saveBudgetSnapshot({
    budgetId: newBudgetId,
    supabase,
    snapshotData: {
      tutorId,
      composition,
      operationals,
      settings,
      totals: calculation,
    },
  });

  if (!snapshotResult.ok) {
    console.warn(
      "[persistBudget] Snapshot falló (no crítico, operación OK):",
      snapshotResult.message,
    );

    await trackBudgetPersistenceIssue({
      budgetId: newBudgetId,
      supabase,
      stage: "snapshot",
      detail: snapshotResult.message,
    });
  }

  const compositionSaveResult = await saveBudgetComposition({
    budgetId: newBudgetId,
    supabase,
    composition,
    dogTotals: calculation.dogTotals,
  });

  if (!compositionSaveResult.ok) {
    return { ok: false, operatorError: compositionSaveResult.message, values };
  }

  return { ok: true, budgetId: newBudgetId };
};
