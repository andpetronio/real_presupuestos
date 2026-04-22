import { describe, expect, it, vi } from "vitest";
import { load } from "./+page.server";
import { asLoadEvent } from "$lib/test-helpers/sveltekit-events";

describe("(app)/admin-mayoristas/+page.server load", () => {
  it("ordena mayoristas alfabéticamente por nombre con desempates estables", async () => {
    const range = vi.fn().mockResolvedValue({
      data: [
        {
          id: "w-1",
          name: "Alpha",
          unique_random_code: "ALPHA1",
          min_total_units: 10,
          is_active: true,
          notes: null,
          created_at: "2026-01-01T00:00:00.000Z",
          category_id: null,
          tax_id: null,
          contact_full_name: null,
          contact_whatsapp: null,
          contact_email: null,
          address: null,
          delivery_preference: null,
          payment_preference: null,
          category: null,
        },
      ],
      count: 1,
      error: null,
    });
    const order = vi.fn();
    const eq = vi.fn();
    const or = vi.fn();
    const query = { order, eq, or, range };
    order.mockReturnValue(query);
    eq.mockReturnValue(query);
    or.mockReturnValue(query);

    const data = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        url: new URL("https://test.local/admin-mayoristas"),
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
      wholesalers: ReadonlyArray<unknown>;
    };

    expect(order).toHaveBeenNthCalledWith(1, "name", { ascending: true });
    expect(order).toHaveBeenNthCalledWith(2, "created_at", {
      ascending: false,
    });
    expect(order).toHaveBeenNthCalledWith(3, "id", { ascending: true });
    expect(eq).toHaveBeenCalledWith("is_active", true);
    expect(data.tableState).toBe("success");
    expect(data.wholesalers).toHaveLength(1);
  });

  it("aplica sorter por estado cuando sortBy es válido", async () => {
    const range = vi
      .fn()
      .mockResolvedValue({ data: [], count: 0, error: null });
    const order = vi.fn();
    const eq = vi.fn();
    const or = vi.fn();
    const query = { order, eq, or, range };
    order.mockReturnValue(query);
    eq.mockReturnValue(query);
    or.mockReturnValue(query);

    await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        url: new URL(
          "https://test.local/admin-mayoristas?sortBy=is_active&sortDir=desc",
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

    expect(order).toHaveBeenNthCalledWith(1, "is_active", {
      ascending: false,
    });
  });

  it("si sortBy es inválido cae a name asc", async () => {
    const range = vi
      .fn()
      .mockResolvedValue({ data: [], count: 0, error: null });
    const order = vi.fn();
    const eq = vi.fn();
    const or = vi.fn();
    const query = { order, eq, or, range };
    order.mockReturnValue(query);
    eq.mockReturnValue(query);
    or.mockReturnValue(query);

    await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        url: new URL("https://test.local/admin-mayoristas?sortBy=invalid"),
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
