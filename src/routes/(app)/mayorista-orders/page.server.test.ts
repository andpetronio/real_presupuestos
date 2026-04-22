import { describe, expect, it, vi } from "vitest";
import { load } from "./+page.server";
import { asLoadEvent } from "$lib/test-helpers/sveltekit-events";

describe("(app)/mayorista-orders/+page.server load", () => {
  it("ordena pedidos por mayorista (A→Z) con desempates por fecha/id", async () => {
    const range = vi.fn().mockResolvedValue({
      data: [
        {
          id: "o-1",
          wholesaler_id: "w-1",
          status: "placed",
          total_units: 12,
          total_ars: 42000,
          notes: null,
          placed_at: "2026-01-01",
          delivered_at: null,
          paid_at: null,
          wholesaler: { name: "Alpha" },
        },
      ],
      count: 1,
      error: null,
    });
    const order = vi.fn();
    const eq = vi.fn();
    const ilike = vi.fn();
    const or = vi.fn();
    const query = { order, eq, ilike, or, range };
    order.mockReturnValue(query);
    eq.mockReturnValue(query);
    ilike.mockReturnValue(query);
    or.mockReturnValue(query);

    const data = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        url: new URL("https://test.local/mayorista-orders"),
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
      orders: ReadonlyArray<unknown>;
    };

    expect(order).toHaveBeenNthCalledWith(1, "wholesaler(name)", {
      ascending: true,
    });
    expect(order).toHaveBeenNthCalledWith(2, "placed_at", { ascending: false });
    expect(order).toHaveBeenNthCalledWith(3, "id", { ascending: true });
    expect(data.tableState).toBe("success");
    expect(data.orders).toHaveLength(1);
  });

  it("aplica sorter por total_ars cuando viene en query", async () => {
    const range = vi
      .fn()
      .mockResolvedValue({ data: [], count: 0, error: null });
    const order = vi.fn();
    const eq = vi.fn();
    const ilike = vi.fn();
    const or = vi.fn();
    const query = { order, eq, ilike, or, range };
    order.mockReturnValue(query);
    eq.mockReturnValue(query);
    ilike.mockReturnValue(query);
    or.mockReturnValue(query);

    await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        url: new URL(
          "https://test.local/mayorista-orders?sortBy=total_ars&sortDir=desc",
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

    expect(order).toHaveBeenNthCalledWith(1, "total_ars", { ascending: false });
  });

  it("si sortBy es inválido usa default por mayorista", async () => {
    const range = vi
      .fn()
      .mockResolvedValue({ data: [], count: 0, error: null });
    const order = vi.fn();
    const eq = vi.fn();
    const ilike = vi.fn();
    const or = vi.fn();
    const query = { order, eq, ilike, or, range };
    order.mockReturnValue(query);
    eq.mockReturnValue(query);
    ilike.mockReturnValue(query);
    or.mockReturnValue(query);

    await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        url: new URL("https://test.local/mayorista-orders?sortBy=invalid"),
        locals: {
          supabase: {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue(query),
            }),
          },
        },
      }),
    );

    expect(order).toHaveBeenNthCalledWith(1, "wholesaler(name)", {
      ascending: true,
    });
  });
});
