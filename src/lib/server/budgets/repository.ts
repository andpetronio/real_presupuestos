import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applyBudgetListFilters,
  type BudgetListFilters,
} from "$lib/server/budgets/list";

const budgetListSelect =
  "id, status, tutor_id, reference_month, reference_days, notes, final_sale_price, total_cost, ingredient_total_global, operational_total_global, created_at, expires_at, tutor:tutors(full_name)";

const budgetEditingSelect =
  "id, tutor_id, reference_month, reference_days, notes, vacuum_bag_small_qty, vacuum_bag_large_qty, labels_qty, non_woven_bag_qty, labor_hours_qty, cooking_hours_qty, calcium_qty, kefir_qty";

export type BudgetEditingRow = {
  dogId: string;
  recipeId: string;
  assignedDays: string;
};

export type BudgetEditingBudget = {
  id: string;
  tutor_id: string | null;
  reference_month?: string | null;
  reference_days?: number | null;
  notes: string | null;
  vacuum_bag_small_qty?: number;
  vacuum_bag_large_qty?: number;
  labels_qty?: number;
  non_woven_bag_qty?: number;
  labor_hours_qty?: number;
  cooking_hours_qty?: number;
  calcium_qty?: number;
  kefir_qty?: number;
};

const toNullableString = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const toOptionalNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const toOptionalNullableString = (
  value: unknown,
): string | null | undefined => {
  if (typeof value === "string") return value;
  if (value === null) return null;
  return undefined;
};

const toOptionalNullableNumber = (
  value: unknown,
): number | null | undefined => {
  if (value === null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return undefined;
};

const toBudgetEditingBudget = (value: unknown): BudgetEditingBudget | null => {
  if (!value || typeof value !== "object") return null;

  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string") return null;

  return {
    id: row.id,
    tutor_id: toNullableString(row.tutor_id),
    reference_month: toOptionalNullableString(row.reference_month),
    reference_days: toOptionalNullableNumber(row.reference_days),
    notes: toNullableString(row.notes),
    vacuum_bag_small_qty: toOptionalNumber(row.vacuum_bag_small_qty),
    vacuum_bag_large_qty: toOptionalNumber(row.vacuum_bag_large_qty),
    labels_qty: toOptionalNumber(row.labels_qty),
    non_woven_bag_qty: toOptionalNumber(row.non_woven_bag_qty),
    labor_hours_qty: toOptionalNumber(row.labor_hours_qty),
    cooking_hours_qty: toOptionalNumber(row.cooking_hours_qty),
    calcium_qty: toOptionalNumber(row.calcium_qty),
    kefir_qty: toOptionalNumber(row.kefir_qty),
  };
};

const extractDogIdFromBudgetDogRelation = (value: unknown): string => {
  if (!value) return "";

  if (Array.isArray(value)) {
    const first = value[0] as { dog_id?: unknown } | undefined;
    return typeof first?.dog_id === "string" ? first.dog_id : "";
  }

  const relation = value as { dog_id?: unknown };
  return typeof relation.dog_id === "string" ? relation.dog_id : "";
};

export const autoExpireSentBudgets = async (
  supabase: SupabaseClient,
): Promise<void> => {
  await supabase
    .from("budgets")
    .update({ status: "expired" })
    .eq("status", "sent")
    .lte("expires_at", new Date().toISOString());
};

export const loadBudgetList = async (params: {
  supabase: SupabaseClient;
  filters: BudgetListFilters;
  offset: number;
  pageSize: number;
}) => {
  const { supabase, filters, offset, pageSize } = params;

  let query = supabase
    .from("budgets")
    .select(budgetListSelect, { count: "exact" })
    .order("created_at", { ascending: false });

  query = applyBudgetListFilters(query, filters);

  const { data, count, error } = await query.range(
    offset,
    offset + pageSize - 1,
  );
  if (error) throw error;

  return {
    budgets: data ?? [],
    total: count ?? 0,
  };
};

export const loadEditingBudget = async (params: {
  supabase: SupabaseClient;
  editingBudgetId: string | null;
}): Promise<{
  editingBudget: BudgetEditingBudget | null;
  editingRows: BudgetEditingRow[];
}> => {
  const { supabase, editingBudgetId } = params;

  if (!editingBudgetId) {
    return { editingBudget: null, editingRows: [] };
  }

  const { data: editingBudgetData } = await supabase
    .from("budgets")
    .select(budgetEditingSelect)
    .eq("id", editingBudgetId)
    .single();

  const { data: budgetDogRecipesData, error: budgetDogRecipesError } =
    await supabase
      .from("budget_dog_recipes")
      .select(
        "budget_dog_id, recipe_id, assigned_days, budget_dog:budget_dogs!inner(budget_id, dog_id)",
      )
      .eq("budget_dog.budget_id", editingBudgetId)
      .order("created_at", { ascending: true });

  if (budgetDogRecipesError) throw budgetDogRecipesError;

  const editingRows = (budgetDogRecipesData ?? []).map((row) => ({
    dogId: extractDogIdFromBudgetDogRelation(row.budget_dog),
    recipeId: row.recipe_id,
    assignedDays: String(row.assigned_days),
  }));

  return {
    editingBudget: toBudgetEditingBudget(editingBudgetData),
    editingRows,
  };
};

export const loadTutorFilterOptions = async (
  supabase: SupabaseClient,
): Promise<Array<{ id: string; full_name: string }>> => {
  const { data } = await supabase
    .from("tutors")
    .select("id, full_name")
    .order("full_name", { ascending: true });

  return data ?? [];
};
