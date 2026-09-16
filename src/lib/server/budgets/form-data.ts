import type { SupabaseClient } from "@supabase/supabase-js";
import { loadBudgetOptions, type BudgetOptions } from "./queries";
import {
  loadEditingBudget,
  type BudgetEditingBudget,
  type BudgetEditingRow,
} from "./repository";

export type BudgetFormData = BudgetOptions & {
  editingBudget: BudgetEditingBudget | null;
  editingRows: BudgetEditingRow[];
};

export async function loadBudgetFormData(params: {
  supabase: SupabaseClient;
  editingBudgetId: string | null;
  activeOnly?: boolean;
}): Promise<BudgetFormData> {
  const [options, { editingBudget, editingRows }] = await Promise.all([
    params.activeOnly
      ? loadBudgetOptions(params.supabase, { activeOnly: true })
      : loadBudgetOptions(params.supabase),
    loadEditingBudget({
      supabase: params.supabase,
      editingBudgetId: params.editingBudgetId,
    }),
  ]);

  return {
    ...options,
    editingBudget,
    editingRows,
  };
}
