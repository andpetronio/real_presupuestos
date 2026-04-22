import { describe, expect, it, vi } from "vitest";
import { load } from "./+page.server";
import { asLoadEvent } from "$lib/test-helpers/sveltekit-events";

describe("(app)/raw-materials/+page.server load", () => {
  it("retorna empty cuando no hay materias primas", async () => {
    const range = vi
      .fn()
      .mockResolvedValue({ data: [], count: 0, error: null });
    const order = vi.fn();
    const query = { order, range };
    order.mockReturnValue(query);

    const data = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        locals: {
          supabase: {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({ order }),
            }),
          },
        },
        url: new URL("https://example.test/raw-materials"),
      }),
    )) as { tableState: string };

    expect(order).toHaveBeenNthCalledWith(1, "name", { ascending: true });
    expect(order).toHaveBeenNthCalledWith(2, "created_at", {
      ascending: false,
    });
    expect(order).toHaveBeenNthCalledWith(3, "id", { ascending: true });
    expect(data.tableState).toBe("empty");
  });

  it("aplica sorter por cost_with_wastage", async () => {
    const range = vi
      .fn()
      .mockResolvedValue({ data: [], count: 0, error: null });
    const eq = vi.fn();
    const order = vi.fn();
    const query = { order, eq, range };
    eq.mockReturnValue(query);
    order.mockReturnValue(query);

    await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        locals: {
          supabase: {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({ order }),
            }),
          },
        },
        url: new URL(
          "https://example.test/raw-materials?sortBy=cost_with_wastage&sortDir=desc",
        ),
      }),
    );

    expect(order).toHaveBeenNthCalledWith(1, "cost_with_wastage", {
      ascending: false,
    });
  });

  it("si sortBy es inválido cae a name asc", async () => {
    const range = vi
      .fn()
      .mockResolvedValue({ data: [], count: 0, error: null });
    const eq = vi.fn();
    const order = vi.fn();
    const query = { order, eq, range };
    eq.mockReturnValue(query);
    order.mockReturnValue(query);

    await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        locals: {
          supabase: {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({ order }),
            }),
          },
        },
        url: new URL("https://example.test/raw-materials?sortBy=invalid"),
      }),
    );

    expect(order).toHaveBeenNthCalledWith(1, "name", { ascending: true });
  });
});
