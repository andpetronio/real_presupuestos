import { fail } from "@sveltejs/kit";
import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateBudgetTotals } from "$lib/server/budgets/calculation";
import {
  getBudgetExpiry,
  persistBudget,
  validateBudgetInput,
} from "$lib/server/budgets/persistence";
import type { ActionValues } from "$lib/server/budgets/types";

const toOperatorError = (
  action: "create" | "update",
  values: ActionValues,
  message: string,
  status = 400,
) =>
  fail(status, {
    actionType: action,
    operatorError: message,
    values,
  });

const getBlankValues = (): ActionValues => ({
  budgetId: "",
  tutorId: "",
  budgetMonth: "",
  budgetDays: "",
  notes: "",
  vacuumBagSmallQty: "",
  vacuumBagLargeQty: "",
  labelsQty: "",
  nonWovenBagQty: "",
  laborHoursQty: "",
  cookingHoursQty: "",
  calciumQty: "",
  kefirQty: "",
  rows: [{ dogId: "", recipeId: "", assignedDays: "" }],
});

export const saveBudget = async (params: {
  action: "create" | "update";
  values: ActionValues;
  locals: { supabase: SupabaseClient };
}) => {
  const { action, values, locals } = params;

  const validation = await validateBudgetInput({
    values,
    supabase: locals.supabase,
  });
  if (!validation.valid) {
    return toOperatorError(action, values, validation.operatorError);
  }

  const calculation = calculateBudgetTotals({
    settings: validation.settings,
    operationals: validation.operationals,
    assignments: validation.composition,
    recipeDailyCosts: validation.recipeDailyCosts,
  });

  const expiry = await getBudgetExpiry({
    action,
    budgetId: values.budgetId,
    settingsValidityDays: validation.settings.budgetValidityDays ?? 7,
    values,
    supabase: locals.supabase,
  });
  if (!expiry.ok) {
    return toOperatorError(action, values, expiry.operatorError);
  }

  const persistence = await persistBudget({
    action,
    budgetId: values.budgetId ?? "",
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
    supabase: locals.supabase,
  });

  if (!persistence.ok) {
    return toOperatorError(action, values, persistence.operatorError);
  }

  return {
    actionType: action,
    operatorSuccess:
      action === "create"
        ? "Presupuesto borrador creado correctamente."
        : "Borrador actualizado correctamente.",
    values: getBlankValues(),
  };
};
