import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadBudgetFormData } from "./form-data";
import { loadBudgetOptions } from "./queries";
import { loadEditingBudget } from "./repository";

vi.mock("./queries", () => ({
  loadBudgetOptions: vi.fn(),
}));

vi.mock("./repository", () => ({
  loadEditingBudget: vi.fn(),
}));

describe("loadBudgetFormData", () => {
  const mockedLoadBudgetOptions = vi.mocked(loadBudgetOptions);
  const mockedLoadEditingBudget = vi.mocked(loadEditingBudget);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("combina options y edición en flujo new", async () => {
    mockedLoadBudgetOptions.mockResolvedValue({
      tutorOptions: [{ id: "t-1", fullName: "Ana" }],
      dogOptions: [{ id: "d-1", tutorId: "t-1", name: "Mora" }],
      recipeOptions: [{ id: "r-1", dogId: "d-1", name: "Mix" }],
      settings: null,
    });
    mockedLoadEditingBudget.mockResolvedValue({
      editingBudget: null,
      editingRows: [],
    });

    const supabase = {} as never;
    const result = await loadBudgetFormData({
      supabase,
      editingBudgetId: null,
    });

    expect(mockedLoadBudgetOptions).toHaveBeenCalledWith(supabase);
    expect(mockedLoadEditingBudget).toHaveBeenCalledWith({
      supabase,
      editingBudgetId: null,
    });
    expect(result).toEqual({
      tutorOptions: [{ id: "t-1", fullName: "Ana" }],
      dogOptions: [{ id: "d-1", tutorId: "t-1", name: "Mora" }],
      recipeOptions: [{ id: "r-1", dogId: "d-1", name: "Mix" }],
      settings: null,
      editingBudget: null,
      editingRows: [],
    });
  });

  it("retorna presupuesto y filas en flujo update", async () => {
    mockedLoadBudgetOptions.mockResolvedValue({
      tutorOptions: [],
      dogOptions: [],
      recipeOptions: [],
      settings: {
        vacuum_bag_small_unit_cost: 1,
        vacuum_bag_large_unit_cost: 2,
        label_unit_cost: 3,
        non_woven_bag_unit_cost: 4,
        labor_hour_cost: 5,
        cooking_hour_cost: 6,
        calcium_unit_cost: 7,
        kefir_unit_cost: 8,
      },
    });
    mockedLoadEditingBudget.mockResolvedValue({
      editingBudget: {
        id: "b-1",
        tutor_id: "t-1",
        notes: "nota",
        reference_month: "2026-04-01",
        reference_days: 30,
        vacuum_bag_small_qty: 1,
        vacuum_bag_large_qty: 2,
        labels_qty: 3,
        non_woven_bag_qty: 4,
        labor_hours_qty: 5,
        cooking_hours_qty: 6,
        calcium_qty: 7,
        kefir_qty: 8,
      },
      editingRows: [{ dogId: "d-1", recipeId: "r-1", assignedDays: "30" }],
    });

    const result = await loadBudgetFormData({
      supabase: {} as never,
      editingBudgetId: "b-1",
    });

    expect(result.editingBudget?.id).toBe("b-1");
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
    expect(result.editingRows).toEqual([
      { dogId: "d-1", recipeId: "r-1", assignedDays: "30" },
    ]);
  });
});
