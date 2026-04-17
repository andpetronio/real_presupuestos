/**
 * Parsers y validators específicos para el dominio de budgets.
 * Los parsers genéricos ya están en $lib/server/forms/parsers.ts
 */

import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  parseFormValue,
  parseNonNegativeNumber,
} from "$lib/server/forms/parsers";
import { parsePositiveInteger } from "$lib/server/forms/parsers";
import type {
  BudgetOperationalInputs,
  BudgetSettingsCosts,
} from "./calculation";
import type {
  ActionValues,
  CompositionRow,
  ParsedCompositionRow,
} from "./types";

/**
 * Parser de mes input (AAAA-MM) a fecha ISO.
 * Valida que el mes sea válido (1-12).
 */
export const parseMonthInput = (value: string): string | null => {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month] = match;
  const monthNumber = Number(month);
  if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12)
    return null;

  return `${year}-${month}-01`;
};

/**
 * Genera un token público para el presupuesto.
 * Versión simple: UUID sin guiones.
 */
export const createBudgetPublicToken = (): string =>
  randomUUID().replaceAll("-", "");

/**
 * Parsea las filas de composición desde el FormData.
 * Extrae valores de rowDogId, recipeId, assignedDays.
 */
export const parseCompositionRows = (formData: FormData): CompositionRow[] => {
  const dogIds = formData
    .getAll("rowDogId")
    .map((value) => parseFormValue(value));
  const recipeIds = formData
    .getAll("recipeId")
    .map((value) => parseFormValue(value));
  const assignedDays = formData
    .getAll("assignedDays")
    .map((value) => parseFormValue(value));

  const totalRows = Math.max(
    dogIds.length,
    recipeIds.length,
    assignedDays.length,
  );
  const rows: CompositionRow[] = [];

  for (let index = 0; index < totalRows; index += 1) {
    const row = {
      dogId: dogIds[index] ?? "",
      recipeId: recipeIds[index] ?? "",
      assignedDays: assignedDays[index] ?? "",
    };

    if (!row.dogId && !row.recipeId && !row.assignedDays) continue;
    rows.push(row);
  }

  return rows;
};

/**
 * Parsea todos los valores del formulario de budget.
 */
export const parseActionValues = (formData: FormData): ActionValues => ({
  budgetId: parseFormValue(formData.get("budgetId")) || undefined,
  tutorId: parseFormValue(formData.get("tutorId")),
  budgetMonth: parseFormValue(formData.get("budgetMonth")),
  budgetDays: parseFormValue(formData.get("budgetDays")),
  notes: parseFormValue(formData.get("notes")),
  vacuumBagSmallQty: parseFormValue(formData.get("vacuumBagSmallQty")),
  vacuumBagLargeQty: parseFormValue(formData.get("vacuumBagLargeQty")),
  labelsQty: parseFormValue(formData.get("labelsQty")),
  nonWovenBagQty: parseFormValue(formData.get("nonWovenBagQty")),
  laborHoursQty: parseFormValue(formData.get("laborHoursQty")),
  cookingHoursQty: parseFormValue(formData.get("cookingHoursQty")),
  calciumQty: parseFormValue(formData.get("calciumQty")),
  kefirQty: parseFormValue(formData.get("kefirQty")),
  rows: parseCompositionRows(formData),
});

/**
 * Parsea los inputs operativos desde los valores del formulario.
 * Retorna null si hay valores inválidos.
 */
export const parseOperationalInputs = (
  values: ActionValues,
): BudgetOperationalInputs | null => {
  const operationals: BudgetOperationalInputs = {
    vacuumBagSmallQty:
      parseNonNegativeNumber(values.vacuumBagSmallQty) ?? Number.NaN,
    vacuumBagLargeQty:
      parseNonNegativeNumber(values.vacuumBagLargeQty) ?? Number.NaN,
    labelsQty: parseNonNegativeNumber(values.labelsQty) ?? Number.NaN,
    nonWovenBagQty: parseNonNegativeNumber(values.nonWovenBagQty) ?? Number.NaN,
    laborHoursQty: parseNonNegativeNumber(values.laborHoursQty) ?? Number.NaN,
    cookingHoursQty:
      parseNonNegativeNumber(values.cookingHoursQty) ?? Number.NaN,
    calciumQty: parseNonNegativeNumber(values.calciumQty) ?? Number.NaN,
    kefirQty: parseNonNegativeNumber(values.kefirQty) ?? Number.NaN,
  };

  const hasInvalid = Object.values(operationals).some((value) =>
    Number.isNaN(value),
  );
  return hasInvalid ? null : operationals;
};

/**
 * Valida y parsea las filas de composición.
 * Requiere al menos una fila, y que no haya duplicados (misma receta por perro).
 */
export const parseComposition = (
  rows: ReadonlyArray<CompositionRow>,
): ParsedCompositionRow[] | null => {
  if (rows.length === 0) return null;

  const parsed: ParsedCompositionRow[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const assignedDays = parsePositiveInteger(row.assignedDays);
    if (!row.dogId || !row.recipeId || assignedDays === null) return null;

    const key = `${row.dogId}::${row.recipeId}`;
    if (seen.has(key)) return null;
    seen.add(key);

    parsed.push({ dogId: row.dogId, recipeId: row.recipeId, assignedDays });
  }

  return parsed;
};

/**
 * Computa la fecha de vencimiento por defecto.
 * @param validityDays Días de validez del presupuesto.
 */
export const parseDefaultExpiration = (validityDays: number): string => {
  const base = new Date();
  base.setDate(base.getDate() + validityDays);
  return base.toISOString();
};

/**
 * Lee los settings de custos para el cálculo del presupuesto.
 */
export const getSettingsForBudgetFormula = async (
  supabase: SupabaseClient,
): Promise<BudgetSettingsCosts | null> => {
  const { data, error } = await supabase
    .from("settings")
    .select(
      "meal_plan_margin, vacuum_bag_small_unit_cost, vacuum_bag_large_unit_cost, label_unit_cost, non_woven_bag_unit_cost, labor_hour_cost, cooking_hour_cost, calcium_unit_cost, kefir_unit_cost, budget_validity_days",
    )
    .eq("id", 1)
    .single();

  if (error || !data) return null;

  return {
    mealPlanMargin: data.meal_plan_margin,
    vacuumBagSmallUnitCost: data.vacuum_bag_small_unit_cost,
    vacuumBagLargeUnitCost: data.vacuum_bag_large_unit_cost,
    labelUnitCost: data.label_unit_cost,
    nonWovenBagUnitCost: data.non_woven_bag_unit_cost,
    laborHourCost: data.labor_hour_cost,
    cookingHourCost: data.cooking_hour_cost,
    calciumUnitCost: data.calcium_unit_cost,
    kefirUnitCost: data.kefir_unit_cost,
    budgetValidityDays: data.budget_validity_days,
  };
};

/**
 * Lee los costos diarios de las recetas.
 */
export const readRecipeDailyCosts = async (
  supabase: SupabaseClient,
  recipeIds: ReadonlyArray<string>,
): Promise<Array<{ recipeId: string; dailyCost: number }> | null> => {
  if (recipeIds.length === 0) return [];

  const { data, error } = await supabase
    .from("recipe_items")
    .select(
      "recipe_id, daily_quantity, raw_material:raw_materials(derived_unit_cost, cost_with_wastage, purchase_quantity)",
    )
    .in("recipe_id", recipeIds);

  if (error) return null;

  const map = new Map<string, number>();

  for (const row of data ?? []) {
    const rawMaterialRelation = row.raw_material as
      | {
          derived_unit_cost: number | null;
          cost_with_wastage: number | null;
          purchase_quantity: number | null;
        }
      | Array<{
          derived_unit_cost: number | null;
          cost_with_wastage: number | null;
          purchase_quantity: number | null;
        }>
      | null;

    const rawMaterial = Array.isArray(rawMaterialRelation)
      ? (rawMaterialRelation[0] ?? null)
      : rawMaterialRelation;

    const typedRawMaterial = rawMaterial as {
      derived_unit_cost: number | null;
      cost_with_wastage: number | null;
      purchase_quantity: number | null;
    } | null;

    if (!typedRawMaterial) continue;

    const rawCost = typedRawMaterial.cost_with_wastage ?? 0;
    const rawQty = typedRawMaterial.purchase_quantity ?? 1;
    const fallbackDerived = rawQty > 0 ? rawCost / rawQty : 0;
    const unitCost = typedRawMaterial.derived_unit_cost ?? fallbackDerived;
    const subtotal = unitCost * Number(row.daily_quantity);

    const existing = map.get(row.recipe_id) ?? 0;
    map.set(row.recipe_id, existing + subtotal);
  }

  return Array.from(map.entries()).map(([recipeId, dailyCost]) => ({
    recipeId,
    dailyCost,
  }));
};
