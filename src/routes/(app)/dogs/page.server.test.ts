import { describe, expect, it, vi } from "vitest";
import { actions, load } from "./+page.server";
import { asLoadEvent, asActionEvent } from "$lib/test-helpers/sveltekit-events";

describe("(app)/dogs/+page.server load", () => {
  it("retorna listado de perros cuando query pasa", async () => {
    const range = vi.fn().mockResolvedValue({
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
    });
    const statusEq = vi.fn();
    const dogsOrder = vi.fn();
    const dogsQuery = {
      order: dogsOrder,
      eq: statusEq,
      range,
    };
    statusEq.mockReturnValue(dogsQuery);
    dogsOrder.mockReturnValue(dogsQuery);

    const from = vi.fn((table: string) => {
      if (table === "dogs")
        return { select: vi.fn().mockReturnValue({ order: dogsOrder }) };
      return { select: vi.fn() };
    });

    const mockUrl = new URL("http://localhost/dogs");

    const data = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        locals: { supabase: { from } },
        url: mockUrl,
      }),
    )) as {
      tableState: string;
      dogs: ReadonlyArray<unknown>;
    };

    expect(dogsOrder).toHaveBeenNthCalledWith(1, "name", { ascending: true });
    expect(dogsOrder).toHaveBeenNthCalledWith(2, "created_at", {
      ascending: false,
    });
    expect(dogsOrder).toHaveBeenNthCalledWith(3, "id", { ascending: true });
    expect(data.tableState).toBe("success");
    expect(data.dogs).toHaveLength(1);
  });

  it("aplica sorter por meals_per_day cuando viene en query", async () => {
    const range = vi
      .fn()
      .mockResolvedValue({ data: [], count: 0, error: null });
    const statusEq = vi.fn();
    const dogsOrder = vi.fn();
    const dogsQuery = {
      order: dogsOrder,
      eq: statusEq,
      range,
    };
    statusEq.mockReturnValue(dogsQuery);
    dogsOrder.mockReturnValue(dogsQuery);

    const from = vi.fn((table: string) => {
      if (table === "dogs")
        return { select: vi.fn().mockReturnValue({ order: dogsOrder }) };
      return { select: vi.fn() };
    });

    await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        locals: { supabase: { from } },
        url: new URL("http://localhost/dogs?sortBy=meals_per_day&sortDir=desc"),
      }),
    );

    expect(dogsOrder).toHaveBeenNthCalledWith(1, "meals_per_day", {
      ascending: false,
    });
  });

  it("si sortBy es inválido usa name asc como fallback", async () => {
    const range = vi
      .fn()
      .mockResolvedValue({ data: [], count: 0, error: null });
    const statusEq = vi.fn();
    const dogsOrder = vi.fn();
    const dogsQuery = {
      order: dogsOrder,
      eq: statusEq,
      range,
    };
    statusEq.mockReturnValue(dogsQuery);
    dogsOrder.mockReturnValue(dogsQuery);

    const from = vi.fn((table: string) => {
      if (table === "dogs")
        return { select: vi.fn().mockReturnValue({ order: dogsOrder }) };
      return { select: vi.fn() };
    });

    await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        locals: { supabase: { from } },
        url: new URL("http://localhost/dogs?sortBy=invalid"),
      }),
    );

    expect(dogsOrder).toHaveBeenNthCalledWith(1, "name", { ascending: true });
  });
});

describe("(app)/dogs/+page.server actions.delete", () => {
  it("hace soft delete del perro", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });

    const formData = new FormData();
    formData.set("dogId", "d-1");

    const result = (await actions.delete(
      asActionEvent<Parameters<(typeof actions)["delete"]>[0]>({
        request: { formData: async () => formData },
        locals: { supabase: { from: vi.fn().mockReturnValue({ update }) } },
      }),
    )) as {
      operatorSuccess: string;
    };

    expect(update).toHaveBeenCalledWith({ is_active: false });
    expect(eq).toHaveBeenCalledWith("id", "d-1");
    expect(result.operatorSuccess).toBe("Perro desactivado correctamente.");
  });
});
