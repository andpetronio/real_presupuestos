import { describe, expect, it, vi, afterEach } from "vitest";
import { load } from "./+page.server";
import { asLoadEvent } from "$lib/test-helpers/sveltekit-events";
import * as tracking from "$lib/server/budgets/tracking";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("(app)/seguimiento/[budget_id] load", () => {
  it("usa join interno + filtro por budget_id y descarta filas ajenas", async () => {
    vi.spyOn(tracking, "getDeliveryAlerts").mockResolvedValue([]);

    const budgetsMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "b-1",
        status: "closed",
        final_sale_price: 120000,
        accepted_at: "2026-04-01T00:00:00.000Z",
        tutor: { full_name: "Ana Tutor" },
      },
      error: null,
    });
    const budgetsEq = vi
      .fn()
      .mockReturnValue({ maybeSingle: budgetsMaybeSingle });

    const recipesOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: "r-1",
          assigned_days: 10,
          recipe: { name: "MUNA_pollo" },
          budget_dog: {
            id: "bd-1",
            budget_id: "b-1",
            dog: { name: "Muna" },
          },
        },
        {
          id: "r-foreign",
          assigned_days: 90,
          recipe: { name: "OTRA" },
          budget_dog: {
            id: "bd-x",
            budget_id: "b-x",
            dog: { name: "Perro Ajeno" },
          },
        },
      ],
      error: null,
    });
    const recipesEq = vi.fn().mockReturnValue({ order: recipesOrder });
    const recipesSelect = vi.fn().mockReturnValue({ eq: recipesEq });

    const preparationsOrder = vi
      .fn()
      .mockResolvedValue({ data: [], error: null });
    const preparationsIn = vi
      .fn()
      .mockReturnValue({ order: preparationsOrder });

    const deliveriesOrder = vi
      .fn()
      .mockResolvedValue({ data: [], error: null });
    const deliveriesIn = vi.fn().mockReturnValue({ order: deliveriesOrder });

    const paymentsOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const paymentsEq = vi.fn().mockReturnValue({ order: paymentsOrder });

    const from = vi.fn((table: string) => {
      if (table === "budgets") {
        return {
          select: vi.fn().mockReturnValue({ eq: budgetsEq }),
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

      if (table === "budget_payments") {
        return {
          select: vi.fn().mockReturnValue({ eq: paymentsEq }),
        };
      }

      return { select: vi.fn() };
    });

    const data = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        params: { budget_id: "b-1" },
        locals: { supabase: { from } },
      }),
    )) as {
      dogs: Array<{ dogName: string }>;
      recipeOptions: Array<{ budgetDogRecipeId: string }>;
    };

    expect(recipesSelect).toHaveBeenCalledWith(
      expect.stringContaining("budget_dog:budget_dogs!inner"),
    );
    expect(recipesEq).toHaveBeenCalledWith("budget_dog.budget_id", "b-1");
    expect(preparationsIn).toHaveBeenCalledWith("budget_dog_recipe_id", [
      "r-1",
    ]);
    expect(deliveriesIn).toHaveBeenCalledWith("budget_dog_recipe_id", ["r-1"]);
    expect(data.dogs).toHaveLength(1);
    expect(data.dogs[0]?.dogName).toBe("Muna");
    expect(data.recipeOptions).toEqual([
      expect.objectContaining({ budgetDogRecipeId: "r-1" }),
    ]);
  });

  it("redirige al listado cuando el presupuesto no está en estado accepted/closed", async () => {
    const from = vi.fn((table: string) => {
      if (table === "budgets") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "b-1",
                  status: "draft",
                },
                error: null,
              }),
            }),
          }),
        };
      }

      return { select: vi.fn() };
    });

    await expect(
      load(
        asLoadEvent<Parameters<typeof load>[0]>({
          params: { budget_id: "b-1" },
          locals: { supabase: { from } },
        }),
      ),
    ).rejects.toMatchObject({ status: 303, location: "/seguimiento" });
  });

  it("redirige al listado cuando el presupuesto no existe", async () => {
    const from = vi.fn((table: string) => {
      if (table === "budgets") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }

      return { select: vi.fn() };
    });

    await expect(
      load(
        asLoadEvent<Parameters<typeof load>[0]>({
          params: { budget_id: "missing" },
          locals: { supabase: { from } },
        }),
      ),
    ).rejects.toMatchObject({ status: 303, location: "/seguimiento" });
  });

  it("redirige al listado cuando falla la query de recetas", async () => {
    const from = vi.fn((table: string) => {
      if (table === "budgets") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "b-1",
                  status: "accepted",
                  final_sale_price: 1,
                  accepted_at: null,
                  tutor: null,
                },
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "budget_dog_recipes") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "boom" },
              }),
            }),
          }),
        };
      }

      return { select: vi.fn() };
    });

    vi.spyOn(tracking, "markBudgetViewed").mockResolvedValue();

    await expect(
      load(
        asLoadEvent<Parameters<typeof load>[0]>({
          params: { budget_id: "b-1" },
          locals: { supabase: { from } },
        }),
      ),
    ).rejects.toMatchObject({ status: 303, location: "/seguimiento" });
  });
});
