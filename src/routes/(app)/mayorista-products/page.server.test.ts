import { describe, expect, it, vi } from "vitest";
import { load } from "./+page.server";
import { asLoadEvent } from "$lib/test-helpers/sveltekit-events";

describe("(app)/mayorista-products/+page.server load", () => {
  it("ordena productos alfabéticamente por nombre/presentación con desempates", async () => {
    const productsRange = vi.fn().mockResolvedValue({
      data: [
        {
          id: "p-1",
          name: "Medallón",
          presentation: "500g",
          price_ars: 1000,
          description: null,
          is_active: true,
          created_at: "2026-01-01",
        },
      ],
      count: 1,
      error: null,
    });
    const productsOrder = vi.fn();
    const productsEq = vi.fn();
    const productsOr = vi.fn();
    const productsQuery = {
      order: productsOrder,
      eq: productsEq,
      or: productsOr,
      range: productsRange,
    };
    productsOrder.mockReturnValue(productsQuery);
    productsEq.mockReturnValue(productsQuery);
    productsOr.mockReturnValue(productsQuery);

    const imagesOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const imagesIn = vi.fn().mockReturnValue({ order: imagesOrder });

    const from = vi.fn((table: string) => {
      if (table === "wholesale_products") {
        return {
          select: vi.fn().mockReturnValue(productsQuery),
        };
      }

      if (table === "wholesale_product_images") {
        return {
          select: vi.fn().mockReturnValue({ in: imagesIn }),
        };
      }

      return {};
    });

    const data = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        url: new URL("https://test.local/mayorista-products"),
        locals: { supabase: { from } },
      }),
    )) as {
      tableState: string;
      products: ReadonlyArray<unknown>;
    };

    expect(productsOrder).toHaveBeenNthCalledWith(1, "name", {
      ascending: true,
    });
    expect(productsOrder).toHaveBeenNthCalledWith(2, "presentation", {
      ascending: true,
    });
    expect(productsOrder).toHaveBeenNthCalledWith(3, "created_at", {
      ascending: false,
    });
    expect(productsOrder).toHaveBeenNthCalledWith(4, "id", { ascending: true });
    expect(productsEq).toHaveBeenCalledWith("is_active", true);
    expect(data.tableState).toBe("success");
    expect(data.products).toHaveLength(1);
  });

  it("aplica sorter por price_ars cuando viene en query", async () => {
    const productsRange = vi
      .fn()
      .mockResolvedValue({ data: [], count: 0, error: null });
    const productsOrder = vi.fn();
    const productsEq = vi.fn();
    const productsOr = vi.fn();
    const productsQuery = {
      order: productsOrder,
      eq: productsEq,
      or: productsOr,
      range: productsRange,
    };
    productsOrder.mockReturnValue(productsQuery);
    productsEq.mockReturnValue(productsQuery);
    productsOr.mockReturnValue(productsQuery);

    const imagesOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const imagesIn = vi.fn().mockReturnValue({ order: imagesOrder });

    const from = vi.fn((table: string) => {
      if (table === "wholesale_products") {
        return {
          select: vi.fn().mockReturnValue(productsQuery),
        };
      }

      if (table === "wholesale_product_images") {
        return {
          select: vi.fn().mockReturnValue({ in: imagesIn }),
        };
      }

      return {};
    });

    await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        url: new URL(
          "https://test.local/mayorista-products?sortBy=price_ars&sortDir=desc",
        ),
        locals: { supabase: { from } },
      }),
    );

    expect(productsOrder).toHaveBeenNthCalledWith(1, "price_ars", {
      ascending: false,
    });
  });

  it("si sortBy es inválido cae a name asc", async () => {
    const productsRange = vi
      .fn()
      .mockResolvedValue({ data: [], count: 0, error: null });
    const productsOrder = vi.fn();
    const productsEq = vi.fn();
    const productsOr = vi.fn();
    const productsQuery = {
      order: productsOrder,
      eq: productsEq,
      or: productsOr,
      range: productsRange,
    };
    productsOrder.mockReturnValue(productsQuery);
    productsEq.mockReturnValue(productsQuery);
    productsOr.mockReturnValue(productsQuery);

    const imagesOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const imagesIn = vi.fn().mockReturnValue({ order: imagesOrder });

    const from = vi.fn((table: string) => {
      if (table === "wholesale_products") {
        return {
          select: vi.fn().mockReturnValue(productsQuery),
        };
      }

      if (table === "wholesale_product_images") {
        return {
          select: vi.fn().mockReturnValue({ in: imagesIn }),
        };
      }

      return {};
    });

    await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        url: new URL("https://test.local/mayorista-products?sortBy=invalid"),
        locals: { supabase: { from } },
      }),
    );

    expect(productsOrder).toHaveBeenNthCalledWith(1, "name", {
      ascending: true,
    });
  });
});
