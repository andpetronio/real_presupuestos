import { describe, expect, it, vi } from "vitest";
import { actions, load } from "./+page.server";

describe("(app)/dogs/+page.server load", () => {
  it("retorna listado de perros cuando query pasa", async () => {
    const dogsOrder = vi.fn().mockReturnValue({
      range: vi.fn().mockResolvedValue({
        data: [
          {
            id: "d-1",
            name: "Mora",
            diet_type: "mixta",
            meals_per_day: 2,
            is_active: true,
            tutor: null,
            veterinary: null,
          },
        ],
        count: 1,
        error: null,
      }),
    });

    const from = vi.fn((table: string) => {
      if (table === "dogs")
        return { select: vi.fn().mockReturnValue({ order: dogsOrder }) };
      return { select: vi.fn() };
    });

    const mockUrl = new URL("http://localhost/dogs");

    const data = (await load({
      locals: { supabase: { from } },
      url: mockUrl,
    } as unknown as Parameters<typeof load>[0])) as {
      tableState: string;
      dogs: ReadonlyArray<unknown>;
    };

    expect(data.tableState).toBe("success");
    expect(data.dogs).toHaveLength(1);
  });
});

describe("(app)/dogs/+page.server actions.delete", () => {
  it("hace soft delete del perro", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });

    const formData = new FormData();
    formData.set("dogId", "d-1");

    const result = (await actions.delete({
      request: { formData: async () => formData },
      locals: { supabase: { from: vi.fn().mockReturnValue({ update }) } },
    } as unknown as Parameters<(typeof actions)["delete"]>[0])) as {
      operatorSuccess: string;
    };

    expect(update).toHaveBeenCalledWith({ is_active: false });
    expect(eq).toHaveBeenCalledWith("id", "d-1");
    expect(result.operatorSuccess).toBe("Perro desactivado correctamente.");
  });
});
