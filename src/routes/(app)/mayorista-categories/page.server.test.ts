import { describe, expect, it, vi } from "vitest";
import { load } from "./+page.server";
import { asLoadEvent } from "$lib/test-helpers/sveltekit-events";

describe("(app)/mayorista-categories/+page.server load", () => {
  it("ordena categorías alfabéticamente por nombre con desempates", async () => {
    const range = vi.fn().mockResolvedValue({
      data: [
        {
          id: "c-1",
          name: "Carnes",
          is_active: true,
          created_at: "2026-01-01",
        },
      ],
      count: 1,
      error: null,
    });
    const order = vi.fn();
    const eq = vi.fn();
    const ilike = vi.fn();
    const query = { order, eq, ilike, range };
    order.mockReturnValue(query);
    eq.mockReturnValue(query);
    ilike.mockReturnValue(query);

    const data = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        url: new URL("https://test.local/mayorista-categories"),
        locals: {
          supabase: {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue(query),
            }),
          },
        },
      }),
    )) as {
      tableState: string;
      categories: ReadonlyArray<unknown>;
    };

    expect(order).toHaveBeenNthCalledWith(1, "name", { ascending: true });
    expect(order).toHaveBeenNthCalledWith(2, "created_at", {
      ascending: false,
    });
    expect(order).toHaveBeenNthCalledWith(3, "id", { ascending: true });
    expect(eq).toHaveBeenCalledWith("is_active", true);
    expect(data.tableState).toBe("success");
    expect(data.categories).toHaveLength(1);
  });

  it("aplica sorter por created_at cuando viene en query", async () => {
    const range = vi
      .fn()
      .mockResolvedValue({ data: [], count: 0, error: null });
    const order = vi.fn();
    const eq = vi.fn();
    const ilike = vi.fn();
    const query = { order, eq, ilike, range };
    order.mockReturnValue(query);
    eq.mockReturnValue(query);
    ilike.mockReturnValue(query);

    await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        url: new URL(
          "https://test.local/mayorista-categories?sortBy=created_at&sortDir=desc",
        ),
        locals: {
          supabase: {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue(query),
            }),
          },
        },
      }),
    );

    expect(order).toHaveBeenNthCalledWith(1, "created_at", {
      ascending: false,
    });
  });

  it("si sortBy es inválido usa default por name", async () => {
    const range = vi
      .fn()
      .mockResolvedValue({ data: [], count: 0, error: null });
    const order = vi.fn();
    const eq = vi.fn();
    const ilike = vi.fn();
    const query = { order, eq, ilike, range };
    order.mockReturnValue(query);
    eq.mockReturnValue(query);
    ilike.mockReturnValue(query);

    await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        url: new URL("https://test.local/mayorista-categories?sortBy=invalid"),
        locals: {
          supabase: {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue(query),
            }),
          },
        },
      }),
    );

    expect(order).toHaveBeenNthCalledWith(1, "name", { ascending: true });
  });
});
