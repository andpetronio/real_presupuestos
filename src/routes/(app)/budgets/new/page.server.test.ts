import { describe, expect, it, vi } from "vitest";
import { actions } from "./+page.server";
import * as budgetsPage from "../+page.server";

describe("(app)/budgets/new/+page.server actions.create", () => {
  it("redirige al preview del presupuesto creado", async () => {
    vi.spyOn(budgetsPage.actions, "create").mockResolvedValueOnce({
      actionType: "create",
      budgetId: "b-100",
      operatorSuccess: "ok",
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
    } as any);

    await expect(
      actions.create({} as Parameters<(typeof actions)["create"]>[0]),
    ).rejects.toMatchObject({
      status: 303,
      location: "/budgets/b-100/preview",
    });
  });

  it("devuelve failure cuando la accion interna falla validacion", async () => {
    const failure = { status: 400, data: { operatorError: "error" } };
    vi.spyOn(budgetsPage.actions, "create").mockResolvedValueOnce(
      failure as any,
    );

    const result = await actions.create(
      {} as Parameters<(typeof actions)["create"]>[0],
    );
    expect(result).toBe(failure);
  });
});
