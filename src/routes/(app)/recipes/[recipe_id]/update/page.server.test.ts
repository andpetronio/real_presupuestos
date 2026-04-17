import { describe, expect, it, vi } from "vitest";
import { actions } from "./+page.server";

describe("(app)/recipes/[recipe_id]/update actions.update", () => {
  it("actualiza receta y reemplaza items", async () => {
    const recipesEq = vi.fn().mockResolvedValue({ error: null });
    const recipesUpdate = vi.fn().mockReturnValue({ eq: recipesEq });
    const itemsEq = vi.fn().mockResolvedValue({ error: null });
    const itemsDelete = vi.fn().mockReturnValue({ eq: itemsEq });
    const itemsInsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "raw_materials") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [{ id: "m-1", base_unit: "g" }],
              error: null,
            }),
          }),
        };
      }

      if (table === "recipes") {
        return { update: recipesUpdate };
      }

      return {
        delete: itemsDelete,
        insert: itemsInsert,
      };
    });

    const formData = new FormData();
    formData.set("dogId", "d-1");
    formData.set("name", "Mix semanal");
    formData.set("notes", "Ajustada");
    formData.append("rawMaterialId", "m-1");
    formData.append("dailyQuantity", "120");

    await expect(
      actions.update({
        params: { recipe_id: "r-1" },
        request: { formData: async () => formData },
        locals: { supabase: { from } },
      } as unknown as Parameters<(typeof actions)["update"]>[0]),
    ).rejects.toMatchObject({ status: 303, location: "/recipes" });

    expect(recipesUpdate).toHaveBeenCalledWith({
      dog_id: "d-1",
      name: "Mix semanal",
      notes: "Ajustada",
    });
    expect(recipesEq).toHaveBeenCalledWith("id", "r-1");
    expect(itemsDelete).toHaveBeenCalled();
    expect(itemsEq).toHaveBeenCalledWith("recipe_id", "r-1");
    expect(itemsInsert).toHaveBeenCalledWith([
      {
        recipe_id: "r-1",
        raw_material_id: "m-1",
        daily_quantity: 120,
        unit: "g",
      },
    ]);
  });
});
