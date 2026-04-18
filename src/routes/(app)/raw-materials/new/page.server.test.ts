import { describe, expect, it, vi } from "vitest";
import { actions } from "./+page.server";
import { asActionEvent } from "$lib/test-helpers/sveltekit-events";

describe("(app)/raw-materials/new actions.create", () => {
  it("calcula costo_con_merma e inserta materia prima", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const formData = new FormData();
    formData.set("name", "Carne vacuna");
    formData.set("baseUnit", "g");
    formData.set("purchaseQuantity", "1000");
    formData.set("baseCost", "1000");
    formData.set("wastagePercentage", "30");

    await expect(
      actions.create(
        asActionEvent<Parameters<(typeof actions)["create"]>[0]>({
          request: { formData: async () => formData },
          locals: { supabase: { from: vi.fn().mockReturnValue({ insert }) } },
        }),
      ),
    ).rejects.toMatchObject({ status: 303, location: "/raw-materials" });

    expect(insert).toHaveBeenCalledWith({
      name: "Carne vacuna",
      base_unit: "g",
      purchase_quantity: 1000,
      base_cost: 1000,
      wastage_percentage: 30,
      cost_with_wastage: 1300,
      purchase_unit: "g",
      purchase_cost: 1000,
      derived_unit_cost: 1.3,
      is_active: true,
    });
  });

  it("falla si la merma está fuera de 0 a 100", async () => {
    const insert = vi.fn();
    const formData = new FormData();
    formData.set("name", "Pollo");
    formData.set("baseUnit", "g");
    formData.set("purchaseQuantity", "1000");
    formData.set("baseCost", "1000");
    formData.set("wastagePercentage", "101");

    const result = (await actions.create(
      asActionEvent<Parameters<(typeof actions)["create"]>[0]>({
        request: { formData: async () => formData },
        locals: { supabase: { from: vi.fn().mockReturnValue({ insert }) } },
      }),
    )) as {
      status: number;
      data: { operatorError: string };
    };

    expect(result.status).toBe(400);
    expect(result.data.operatorError).toContain("merma");
    expect(insert).not.toHaveBeenCalled();
  });
});
