/**
 * Shared queries for budget-related page loads.
 * Loads all options (tutors, dogs, recipes) and settings — used only
 * by forms that need them (new, update). The main budgets table page
 * does NOT load these to avoid unnecessary DB round-trips.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

type BudgetOptionsSupabase = Pick<SupabaseClient, "from">;

// ─── Types ───────────────────────────────────────────────────────────────────

export type TutorOption = { id: string; fullName: string };
export type DogOption = { id: string; tutorId: string; name: string };
export type RecipeOption = { id: string; dogId: string; name: string };

export type BudgetOperationalSettings = {
  vacuum_bag_small_unit_cost: number;
  vacuum_bag_large_unit_cost: number;
  label_unit_cost: number;
  non_woven_bag_unit_cost: number;
  labor_hour_cost: number;
  cooking_hour_cost: number;
  calcium_unit_cost: number;
  kefir_unit_cost: number;
} | null;

export type BudgetOptions = {
  tutorOptions: ReadonlyArray<TutorOption>;
  dogOptions: ReadonlyArray<DogOption>;
  recipeOptions: ReadonlyArray<RecipeOption>;
  settings: BudgetOperationalSettings;
};

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Load all options needed for the budget new/update forms.
 * Runs 4 queries in parallel for best performance.
 */
export async function loadBudgetOptions(
  supabase: BudgetOptionsSupabase,
): Promise<BudgetOptions> {
  const [tutorsResult, dogsResult, recipesResult, settingsResult] =
    await Promise.all([
      supabase
        .from("tutors")
        .select("id, full_name")
        .order("full_name", { ascending: true }),
      supabase
        .from("dogs")
        .select("id, tutor_id, name")
        .order("name", { ascending: true }),
      supabase
        .from("recipes")
        .select("id, dog_id, name")
        .order("name", { ascending: true }),
      supabase
        .from("settings")
        .select(
          "vacuum_bag_small_unit_cost, vacuum_bag_large_unit_cost, label_unit_cost, non_woven_bag_unit_cost, labor_hour_cost, cooking_hour_cost, calcium_unit_cost, kefir_unit_cost",
        )
        .eq("id", 1)
        .single(),
    ]);

  const tutorOptions: TutorOption[] = (tutorsResult.data ?? []).map((t) => ({
    id: t.id,
    fullName: t.full_name,
  }));

  const dogOptions: DogOption[] = (dogsResult.data ?? []).map((d) => ({
    id: d.id,
    tutorId: d.tutor_id,
    name: d.name,
  }));

  const recipeOptions: RecipeOption[] = (recipesResult.data ?? []).map((r) => ({
    id: r.id,
    dogId: r.dog_id,
    name: r.name,
  }));

  return {
    tutorOptions,
    dogOptions,
    recipeOptions,
    settings: settingsResult.data ?? null,
  };
}
