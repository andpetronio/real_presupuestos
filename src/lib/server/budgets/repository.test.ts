import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadBudgetList, loadEditingBudget } from "./repository";
import type { BudgetListFilters } from "./list";

describe("loadBudgetList", () => {
  it("ordena por tutor alfabético y mantiene desempates estables", async () => {
    const range = vi.fn().mockResolvedValue({
      data: [
        {
          id: "b-1",
          tutor: { full_name: "Ana" },
          created_at: "2026-04-01T00:00:00.000Z",
        },
      ],
      count: 1,
      error: null,
    });
    const ilike = vi.fn();
    const eq = vi.fn();
    const inFilter = vi.fn();
    const order = vi.fn();
    const query = {
      order,
      ilike,
      eq,
      in: inFilter,
      range,
    };
    order.mockReturnValue(query);
    ilike.mockReturnValue(query);
    eq.mockReturnValue(query);
    inFilter.mockReturnValue(query);

    const from = vi.fn(() => ({
      select: vi.fn().mockReturnValue(query),
    }));

    const result = await loadBudgetList({
      supabase: { from } as unknown as SupabaseClient,
      filters: {
        status: "all",
        search: "",
        tutorId: null,
      } as BudgetListFilters,
      sort: { sortBy: "tutor", sortDir: "asc" },
      offset: 0,
      pageSize: 10,
    });

    expect(order).toHaveBeenNthCalledWith(1, "tutor(full_name)", {
      ascending: true,
    });
    expect(order).toHaveBeenNthCalledWith(2, "created_at", {
      ascending: false,
    });
    expect(order).toHaveBeenNthCalledWith(3, "id", { ascending: true });
    expect(result.total).toBe(1);
    expect(result.budgets).toHaveLength(1);
  });

  it("permite ordenar por costo total cuando sort lo indica", async () => {
    const range = vi
      .fn()
      .mockResolvedValue({ data: [], count: 0, error: null });
    const ilike = vi.fn();
    const eq = vi.fn();
    const inFilter = vi.fn();
    const order = vi.fn();
    const query = {
      order,
      ilike,
      eq,
      in: inFilter,
      range,
    };
    order.mockReturnValue(query);
    ilike.mockReturnValue(query);
    eq.mockReturnValue(query);
    inFilter.mockReturnValue(query);

    const from = vi.fn(() => ({
      select: vi.fn().mockReturnValue(query),
    }));

    await loadBudgetList({
      supabase: { from } as unknown as SupabaseClient,
      filters: {
        status: "all",
        search: "",
        tutorId: null,
      } as BudgetListFilters,
      sort: { sortBy: "total_cost", sortDir: "desc" },
      offset: 0,
      pageSize: 10,
    });

    expect(order).toHaveBeenNthCalledWith(1, "total_cost", {
      ascending: false,
    });
  });
});

describe("loadEditingBudget", () => {
  it("usa inner join + filtro por budget_id y no genera renglones vacíos por relación suelta", async () => {
    const budgetsSingle = vi.fn().mockResolvedValue({
      data: {
        id: "b-1",
        tutor_id: "t-1",
        reference_month: "2026-04-01",
        reference_days: 30,
        notes: "nota",
        vacuum_bag_small_qty: 1,
        vacuum_bag_large_qty: 2,
        labels_qty: 3,
        non_woven_bag_qty: 4,
        labor_hours_qty: 5,
        cooking_hours_qty: 6,
        calcium_qty: 7,
        kefir_qty: 8,
      },
    });
    const budgetsEq = vi.fn().mockReturnValue({ single: budgetsSingle });
    const budgetsSelect = vi.fn().mockReturnValue({ eq: budgetsEq });

    const recipesOrder = vi.fn().mockResolvedValue({
      data: [
        {
          budget_dog_id: "bd-1",
          recipe_id: "r-1",
          assigned_days: 15,
          budget_dog: { budget_id: "b-1", dog_id: "d-1" },
        },
      ],
      error: null,
    });
    const recipesEq = vi.fn().mockReturnValue({ order: recipesOrder });
    const recipesSelect = vi.fn().mockReturnValue({ eq: recipesEq });

    const from = vi.fn((table: string) => {
      if (table === "budgets") return { select: budgetsSelect };
      if (table === "budget_dog_recipes") return { select: recipesSelect };
      return {};
    });

    const result = await loadEditingBudget({
      supabase: { from } as unknown as SupabaseClient,
      editingBudgetId: "b-1",
    });

    expect(budgetsSelect).toHaveBeenCalledWith(
      expect.stringContaining("vacuum_bag_small_qty"),
    );
    expect(recipesSelect).toHaveBeenCalledWith(
      expect.stringContaining("budget_dog:budget_dogs!inner"),
    );
    expect(recipesEq).toHaveBeenCalledWith("budget_dog.budget_id", "b-1");
    expect(result.editingRows).toEqual([
      { dogId: "d-1", recipeId: "r-1", assignedDays: "15" },
    ]);
  });

  it("mapea dogId desde relación en array (fallback defensivo)", async () => {
    const from = vi.fn((table: string) => {
      if (table === "budgets") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "b-1", tutor_id: "t-1", notes: null },
              }),
            }),
          }),
        };
      }

      if (table === "budget_dog_recipes") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    budget_dog_id: "bd-1",
                    recipe_id: "r-1",
                    assigned_days: 16,
                    budget_dog: [{ budget_id: "b-1", dog_id: "d-1" }],
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }

      return {};
    });

    const result = await loadEditingBudget({
      supabase: { from } as unknown as SupabaseClient,
      editingBudgetId: "b-1",
    });

    expect(result.editingRows).toEqual([
      { dogId: "d-1", recipeId: "r-1", assignedDays: "16" },
    ]);
  });

  it("carga campos operativos del budget para la vista de edición", async () => {
    const from = vi.fn((table: string) => {
      if (table === "budgets") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "b-1",
                  tutor_id: "t-1",
                  notes: "nota",
                  vacuum_bag_small_qty: 1,
                  vacuum_bag_large_qty: 2,
                  labels_qty: 3,
                  non_woven_bag_qty: 4,
                  labor_hours_qty: 5,
                  cooking_hours_qty: 6,
                  calcium_qty: 7,
                  kefir_qty: 8,
                },
              }),
            }),
          }),
        };
      }

      if (table === "budget_dog_recipes") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }

      return {};
    });

    const result = await loadEditingBudget({
      supabase: { from } as unknown as SupabaseClient,
      editingBudgetId: "b-1",
    });

    expect(result.editingBudget).toMatchObject({
      vacuum_bag_small_qty: 1,
      vacuum_bag_large_qty: 2,
      labels_qty: 3,
      non_woven_bag_qty: 4,
      labor_hours_qty: 5,
      cooking_hours_qty: 6,
      calcium_qty: 7,
      kefir_qty: 8,
    });
  });

  it("si falla budget_dog_recipes propaga error", async () => {
    const from = vi.fn((table: string) => {
      if (table === "budgets") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "b-1", tutor_id: "t-1", notes: null },
              }),
            }),
          }),
        };
      }

      if (table === "budget_dog_recipes") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "boom" },
              }),
            }),
          }),
        };
      }

      return {};
    });

    await expect(
      loadEditingBudget({
        supabase: { from } as unknown as SupabaseClient,
        editingBudgetId: "b-1",
      }),
    ).rejects.toMatchObject({ message: "boom" });
  });
});
