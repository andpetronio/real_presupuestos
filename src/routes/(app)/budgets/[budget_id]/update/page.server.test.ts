import { fail } from "@sveltejs/kit";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { asActionEvent } from "$lib/test-helpers/sveltekit-events";

describe("(app)/budgets/[budget_id]/update/+page.server actions.update", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  const buildFormData = () => {
    const formData = new FormData();
    formData.set("budgetId", "b-1");
    formData.set("tutorId", "t-1");
    formData.set("budgetMonth", "2026-04");
    formData.set("notes", "nota test");
    formData.set("vacuumBagSmallQty", "1");
    formData.set("vacuumBagLargeQty", "0");
    formData.set("labelsQty", "2");
    formData.set("nonWovenBagQty", "0");
    formData.set("laborHoursQty", "1");
    formData.set("cookingHoursQty", "0");
    formData.set("calciumQty", "0");
    formData.set("kefirQty", "0");

    formData.append("rowDogId", "d-1");
    formData.append("recipeId", "r-1");
    formData.append("assignedDays", "15");

    return formData;
  };

  it("update exitoso: delega en saveBudget y redirige a preview", async () => {
    const saveBudgetMock = vi.fn().mockResolvedValue({
      actionType: "update",
      operatorSuccess: "Borrador actualizado correctamente.",
      values: {
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
      },
    });

    vi.doMock("$lib/server/budgets/save", () => ({
      saveBudget: saveBudgetMock,
    }));

    const { actions } = await import("./+page.server");
    const formData = buildFormData();

    await expect(
      actions.update(
        asActionEvent<Parameters<(typeof actions)["update"]>[0]>({
          params: { budget_id: "b-1" },
          request: { formData: async () => formData },
          locals: { supabase: { from: vi.fn() } },
        }),
      ),
    ).rejects.toMatchObject({
      status: 303,
      location: "/budgets/b-1/preview",
    });

    expect(saveBudgetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update",
        values: expect.objectContaining({
          budgetId: "b-1",
          tutorId: "t-1",
          budgetMonth: "2026-04",
          rows: [{ dogId: "d-1", recipeId: "r-1", assignedDays: "15" }],
        }),
      }),
    );
  });

  it("update con error de persistencia preserva values.rows en el failure", async () => {
    const saveBudgetMock = vi.fn().mockResolvedValue(
      fail(400, {
        actionType: "update",
        operatorError:
          "No pudimos guardar las recetas asignadas del presupuesto.",
        values: {
          budgetId: "b-1",
          tutorId: "t-1",
          budgetMonth: "2026-04",
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
          rows: [{ dogId: "", recipeId: "", assignedDays: "15" }],
        },
      }),
    );

    vi.doMock("$lib/server/budgets/save", () => ({
      saveBudget: saveBudgetMock,
    }));

    const { actions } = await import("./+page.server");
    const formData = buildFormData();

    const result = await actions.update(
      asActionEvent<Parameters<(typeof actions)["update"]>[0]>({
        params: { budget_id: "b-1" },
        request: { formData: async () => formData },
        locals: { supabase: { from: vi.fn() } },
      }),
    );

    expect(result).toMatchObject({
      status: 400,
      data: {
        actionType: "update",
        operatorError:
          "No pudimos guardar las recetas asignadas del presupuesto.",
        values: {
          rows: [{ dogId: "", recipeId: "", assignedDays: "15" }],
        },
      },
    });
  });

  it("propaga el caso específico de budget_dogs conflict", async () => {
    const saveBudgetMock = vi.fn().mockResolvedValue(
      fail(400, {
        actionType: "update",
        operatorError: "No pudimos guardar los perros del presupuesto.",
        values: {
          budgetId: "b-1",
          tutorId: "t-1",
          budgetMonth: "2026-04",
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
          rows: [{ dogId: "d-1", recipeId: "r-1", assignedDays: "15" }],
        },
      }),
    );

    vi.doMock("$lib/server/budgets/save", () => ({
      saveBudget: saveBudgetMock,
    }));

    const { actions } = await import("./+page.server");
    const formData = buildFormData();

    const result = await actions.update(
      asActionEvent<Parameters<(typeof actions)["update"]>[0]>({
        params: { budget_id: "b-1" },
        request: { formData: async () => formData },
        locals: { supabase: { from: vi.fn() } },
      }),
    );

    expect(result).toMatchObject({
      status: 400,
      data: {
        operatorError: "No pudimos guardar los perros del presupuesto.",
      },
    });
  });
});
