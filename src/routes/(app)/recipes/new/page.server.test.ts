import { describe, expect, it, vi } from "vitest";
import { actions } from "./+page.server";

describe("(app)/recipes/new actions.create", () => {
  it("requiere al menos una materia prima al crear", async () => {
    const formData = new FormData();
    formData.set("dogId", "d-1");
    formData.set("name", "Mix semanal");

    const result = (await actions.create({
      request: { formData: async () => formData },
      locals: { supabase: { from: vi.fn() } },
    } as unknown as Parameters<(typeof actions)["create"]>[0])) as {
      status: number;
      data: { operatorError: string };
    };

    expect(result.status).toBe(400);
    expect(result.data.operatorError).toContain("al menos una materia prima");
  });

  it("crea receta con items y redirige", async () => {
    const recipeInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: "r-1" }, error: null }),
      }),
    });
    const recipeItemsInsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "raw_materials") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [
                { id: "m-1", base_unit: "g" },
                { id: "m-2", base_unit: "g" },
              ],
              error: null,
            }),
          }),
        };
      }

      if (table === "recipes") {
        return {
          insert: recipeInsert,
          delete: vi.fn().mockReturnValue({ eq: vi.fn() }),
        };
      }

      return { insert: recipeItemsInsert };
    });

    const formData = new FormData();
    formData.set("dogId", "d-1");
    formData.set("name", "Mix semanal");
    formData.append("rawMaterialId", "m-1");
    formData.append("dailyQuantity", "100");
    formData.append("rawMaterialId", "m-2");
    formData.append("dailyQuantity", "50");

    await expect(
      actions.create({
        request: { formData: async () => formData },
        locals: { supabase: { from } },
      } as unknown as Parameters<(typeof actions)["create"]>[0]),
    ).rejects.toMatchObject({ status: 303, location: "/recipes" });

    expect(recipeItemsInsert).toHaveBeenCalledWith([
      {
        recipe_id: "r-1",
        raw_material_id: "m-1",
        daily_quantity: 100,
        unit: "g",
      },
      {
        recipe_id: "r-1",
        raw_material_id: "m-2",
        daily_quantity: 50,
        unit: "g",
      },
    ]);
  });
});
