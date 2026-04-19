import { describe, expect, it, vi } from "vitest";
import { actions } from "./+page.server";
import * as budgetsPage from "../../+page.server";

describe("(app)/budgets/[budget_id]/update/+page.server actions.update", () => {
  it("redirige al preview del presupuesto actualizado", async () => {
    vi.spyOn(budgetsPage.actions, "update").mockResolvedValueOnce({
      actionType: "update",
      budgetId: "b-200",
      operatorSuccess: "ok",
      values: {
        budgetId: "b-200",
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
    } as any);

    await expect(
      actions.update({} as Parameters<(typeof actions)["update"]>[0]),
    ).rejects.toMatchObject({
      status: 303,
      location: "/budgets/b-200/preview",
    });
  });

  it("devuelve failure cuando la accion interna falla validacion", async () => {
    const failure = { status: 400, data: { operatorError: "error" } };
    vi.spyOn(budgetsPage.actions, "update").mockResolvedValueOnce(
      failure as any,
    );

    const result = await actions.update(
      {} as Parameters<(typeof actions)["update"]>[0],
    );
    expect(result).toBe(failure);
  });
});
