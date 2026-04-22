import { describe, expect, it, vi } from "vitest";
import { load, actions } from "./+page.server";
import { asLoadEvent } from "$lib/test-helpers/sveltekit-events";

describe("(app)/recipes/+page.server load", () => {
  it("retorna error state cuando falla la carga", async () => {
    const recipesRange = vi.fn().mockResolvedValue({
      data: null,
      count: 0,
      error: { message: "db down" },
    });
    const recipesOrder = vi.fn();
    const recipesQuery = {
      order: recipesOrder,
      range: recipesRange,
    };
    recipesOrder.mockReturnValue(recipesQuery);

    const from = vi.fn((table: string) => {
      if (table === "recipes") {
        return {
          select: vi.fn().mockReturnValue({
            order: recipesOrder,
          }),
        };
      }

      if (table === "dogs") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      };
    });

    const data = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        url: new URL("https://test.local/recipes"),
        locals: { supabase: { from } },
      }),
    )) as {
      tableState: string;
      recipes: ReadonlyArray<unknown>;
    };

    expect(recipesOrder).toHaveBeenNthCalledWith(1, "name", {
      ascending: true,
    });
    expect(recipesOrder).toHaveBeenNthCalledWith(2, "created_at", {
      ascending: false,
    });
    expect(recipesOrder).toHaveBeenNthCalledWith(3, "id", { ascending: true });
    expect(data.tableState).toBe("error");
    expect(data.recipes).toEqual([]);
  });

  it("aplica sorter por is_active cuando viene en query", async () => {
    const range = vi
      .fn()
      .mockResolvedValue({ data: [], count: 0, error: null });
    const eq = vi.fn();
    const order = vi.fn();
    const query = {
      order,
      eq,
      range,
    };
    eq.mockReturnValue(query);
    order.mockReturnValue(query);

    await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        url: new URL(
          "https://test.local/recipes?sortBy=is_active&sortDir=desc",
        ),
        locals: {
          supabase: {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({ order }),
            }),
          },
        },
      }),
    );

    expect(order).toHaveBeenNthCalledWith(1, "is_active", {
      ascending: false,
    });
  });

  it("si sortBy es inválido usa sorter default name", async () => {
    const range = vi
      .fn()
      .mockResolvedValue({ data: [], count: 0, error: null });
    const eq = vi.fn();
    const order = vi.fn();
    const query = {
      order,
      eq,
      range,
    };
    eq.mockReturnValue(query);
    order.mockReturnValue(query);

    await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        url: new URL("https://test.local/recipes?sortBy=invalid"),
        locals: {
          supabase: {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({ order }),
            }),
          },
        },
      }),
    );

    expect(order).toHaveBeenNthCalledWith(1, "name", { ascending: true });
  });
});

describe("(app)/recipes/+page.server actions.delete", () => {
  it("hace soft delete de receta", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });

    const formData = new FormData();
    formData.set("recipeId", "r-1");

    const result = (await actions.delete({
      request: { formData: async () => formData },
      locals: { supabase: { from: vi.fn().mockReturnValue({ update }) } },
    } as unknown as Parameters<(typeof actions)["delete"]>[0])) as {
      operatorSuccess: string;
    };

    expect(update).toHaveBeenCalledWith({ is_active: false });
    expect(eq).toHaveBeenCalledWith("id", "r-1");
    expect(result.operatorSuccess).toBe("Receta desactivada correctamente.");
  });
});
