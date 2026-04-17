import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applyBudgetListFilters,
  type BudgetListFilters,
} from "$lib/server/budgets/list";

const budgetSelect =
  "id, status, tutor_id, reference_month, reference_days, notes, final_sale_price, total_cost, ingredient_total_global, operational_total_global, created_at, expires_at, tutor:tutors(full_name)";

export type BudgetEditingRow = {
  dogId: string;
  recipeId: string;
  assignedDays: string;
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
    .select(budgetSelect, { count: "exact" })
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
  editingBudget: unknown | null;
  editingRows: BudgetEditingRow[];
}> => {
  const { supabase, editingBudgetId } = params;

  if (!editingBudgetId) {
    return { editingBudget: null, editingRows: [] };
  }

  const { data: editingBudgetData } = await supabase
    .from("budgets")
    .select(budgetSelect)
    .eq("id", editingBudgetId)
    .single();

  const { data: budgetDogRecipesData, error: budgetDogRecipesError } =
    await supabase
      .from("budget_dog_recipes")
      .select(
        "budget_dog_id, recipe_id, assigned_days, budget_dog:budget_dogs(dog_id)",
      )
      .eq("budget_dog.budget_id", editingBudgetId)
      .order("created_at", { ascending: true });

  if (budgetDogRecipesError) throw budgetDogRecipesError;

  const editingRows = (budgetDogRecipesData ?? []).map((row) => ({
    dogId: (row.budget_dog as { dog_id?: string } | null)?.dog_id ?? "",
    recipeId: row.recipe_id,
    assignedDays: String(row.assigned_days),
  }));

  return {
    editingBudget: editingBudgetData ?? null,
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
