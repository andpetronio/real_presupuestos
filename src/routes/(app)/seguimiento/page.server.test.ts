import { describe, expect, it, vi } from "vitest";
import { load } from "./+page.server";
import { asLoadEvent } from "$lib/test-helpers/sveltekit-events";

describe("(app)/seguimiento load", () => {
  it("usa join interno en recetas y aplica filtro por budget_ids", async () => {
    const tutorsOrder = vi.fn().mockResolvedValue({
      data: [{ id: "t-1", full_name: "Ana Tutor" }],
      error: null,
    });

    const budgetsOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: "b-1",
          status: "accepted",
          tutor_id: "t-1",
          final_sale_price: 100,
          accepted_at: "2026-04-01T00:00:00.000Z",
          viewed_at: null,
          tutor: { full_name: "Ana Tutor" },
        },
      ],
      error: null,
    });
    const budgetsEq = vi.fn().mockReturnValue({ order: budgetsOrder });

    const activeCountEq = vi.fn().mockResolvedValue({ count: 1, error: null });
    const closedCountEq = vi.fn().mockResolvedValue({ count: 0, error: null });

    const budgetsSelect = vi
      .fn()
      .mockReturnValueOnce({ eq: budgetsEq })
      .mockReturnValueOnce({ eq: activeCountEq })
      .mockReturnValueOnce({ eq: closedCountEq });

    const paymentsIn = vi.fn().mockResolvedValue({
      data: [{ budget_id: "b-1", amount: 30 }],
      error: null,
    });

    const recipesIn = vi.fn().mockResolvedValue({
      data: [
        {
          id: "r-valid",
          assigned_days: 10,
          budget_dog: { budget_id: "b-1" },
        },
        {
          id: "r-foreign",
          assigned_days: 90,
          budget_dog: { budget_id: "b-other" },
        },
      ],
      error: null,
    });
    const recipesSelect = vi.fn().mockReturnValue({ in: recipesIn });

    const preparationsIn = vi.fn().mockResolvedValue({
      data: [{ budget_dog_recipe_id: "r-valid", recipe_days: 5 }],
      error: null,
    });

    const deliveriesIn = vi.fn().mockResolvedValue({
      data: [{ budget_dog_recipe_id: "r-valid", recipe_days: 2 }],
      error: null,
    });

    const from = vi.fn((table: string) => {
      if (table === "tutors") {
        return {
          select: vi.fn().mockReturnValue({ order: tutorsOrder }),
        };
      }

      if (table === "budgets") {
        return {
          select: budgetsSelect,
        };
      }

      if (table === "budget_payments") {
        return {
          select: vi.fn().mockReturnValue({ in: paymentsIn }),
        };
      }

      if (table === "budget_dog_recipes") {
        return {
          select: recipesSelect,
        };
      }

      if (table === "budget_recipe_preparations") {
        return {
          select: vi.fn().mockReturnValue({ in: preparationsIn }),
        };
      }

      if (table === "budget_recipe_deliveries") {
        return {
          select: vi.fn().mockReturnValue({ in: deliveriesIn }),
        };
      }

      return { select: vi.fn() };
    });

    const data = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        locals: { supabase: { from } },
        url: new URL("https://test.local/seguimiento"),
      }),
    )) as {
      state: string;
      trackingRows: Array<{
        id: string;
        preparedPct: number;
        deliveredPct: number;
      }>;
    };

    expect(recipesSelect).toHaveBeenCalledWith(
      "id, assigned_days, budget_dog:budget_dogs!inner(budget_id)",
    );
    expect(recipesIn).toHaveBeenCalledWith("budget_dog.budget_id", ["b-1"]);
    expect(preparationsIn).toHaveBeenCalledWith("budget_dog_recipe_id", [
      "r-valid",
    ]);
    expect(deliveriesIn).toHaveBeenCalledWith("budget_dog_recipe_id", [
      "r-valid",
    ]);

    expect(data.state).toBe("success");
    expect(data.trackingRows).toHaveLength(1);
    expect(data.trackingRows[0]).toMatchObject({
      id: "b-1",
      preparedPct: 50,
      deliveredPct: 20,
    });
  });

  it("ignora rows de recetas con budget_id ausente o fuera de allowlist", async () => {
    const budgetsOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: "b-1",
          status: "accepted",
          tutor_id: "t-1",
          final_sale_price: 100,
          accepted_at: "2026-04-01T00:00:00.000Z",
          viewed_at: null,
          tutor: { full_name: "Ana" },
        },
      ],
      error: null,
    });
    const budgetsEq = vi.fn().mockReturnValue({ order: budgetsOrder });

    const budgetsSelect = vi
      .fn()
      .mockReturnValueOnce({ eq: budgetsEq })
      .mockReturnValueOnce({
        eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
      })
      .mockReturnValueOnce({
        eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
      });

    const recipesIn = vi.fn().mockResolvedValue({
      data: [
        { id: "r-1", assigned_days: 10, budget_dog: { budget_id: "b-1" } },
        { id: "r-2", assigned_days: 5, budget_dog: null },
        { id: "r-3", assigned_days: 5, budget_dog: { budget_id: "b-x" } },
      ],
      error: null,
    });

    const from = vi.fn((table: string) => {
      if (table === "tutors") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }

      if (table === "budgets") {
        return {
          select: budgetsSelect,
        };
      }

      if (table === "budget_payments") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }

      if (table === "budget_dog_recipes") {
        return {
          select: vi.fn().mockReturnValue({ in: recipesIn }),
        };
      }

      if (table === "budget_recipe_preparations") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [{ budget_dog_recipe_id: "r-1", recipe_days: 10 }],
              error: null,
            }),
          }),
        };
      }

      if (table === "budget_recipe_deliveries") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [{ budget_dog_recipe_id: "r-1", recipe_days: 10 }],
              error: null,
            }),
          }),
        };
      }

      return { select: vi.fn() };
    });

    const data = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        locals: { supabase: { from } },
        url: new URL("https://test.local/seguimiento"),
      }),
    )) as {
      trackingRows: Array<{ preparedPct: number; deliveredPct: number }>;
    };

    expect(data.trackingRows[0]).toMatchObject({
      preparedPct: 100,
      deliveredPct: 100,
    });
  });

  it("si falla query de recetas, devuelve estado error sin romper", async () => {
    const budgetsOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: "b-1",
          status: "accepted",
          tutor_id: "t-1",
          final_sale_price: 100,
          accepted_at: "2026-04-01T00:00:00.000Z",
          viewed_at: null,
          tutor: { full_name: "Ana" },
        },
      ],
      error: null,
    });

    const budgetsSelect = vi
      .fn()
      .mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({ order: budgetsOrder }),
      })
      .mockReturnValueOnce({
        eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
      })
      .mockReturnValueOnce({
        eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
      });

    const from = vi.fn((table: string) => {
      if (table === "tutors") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }

      if (table === "budgets") {
        return {
          select: budgetsSelect,
        };
      }

      if (table === "budget_payments") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }

      if (table === "budget_dog_recipes") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi
              .fn()
              .mockResolvedValue({ data: null, error: { message: "boom" } }),
          }),
        };
      }

      return { select: vi.fn() };
    });

    const data = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        locals: { supabase: { from } },
        url: new URL("https://test.local/seguimiento"),
      }),
    )) as {
      state: string;
      trackingRows: unknown[];
    };

    expect(data.state).toBe("error");
    expect(data.trackingRows).toEqual([]);
  });
});
