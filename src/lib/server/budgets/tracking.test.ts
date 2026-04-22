import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getDeliveryAlerts } from "./tracking";

type BudgetRow = {
  id: string;
  reference_month: string | null;
  budget_dogs: Array<{
    id: string;
    dog_id: string;
    dogs: {
      name: string | null;
      tutors: Array<{ full_name: string | null }>;
    } | null;
    budget_dog_recipes: Array<{
      id: string;
      recipe_id: string;
      assigned_days: number;
      recipes: { name: string | null } | null;
      budget_recipe_deliveries: Array<{
        recipe_days: number;
        delivered_at: string | null;
      }>;
    }>;
  }>;
};

type ScheduleRow = {
  dog_id: string;
  day_of_month: number;
  pct: number;
};

const createSupabaseMock = (params: {
  budgets: BudgetRow[];
  schedules: ScheduleRow[];
}): Pick<SupabaseClient, "from"> => {
  const from = vi.fn((table: string) => {
    if (table === "budgets") {
      const query = {
        in: vi.fn(() => query),
        eq: vi.fn(() => query),
        returns: vi.fn(async () => ({ data: params.budgets, error: null })),
      };
      return {
        select: vi.fn(() => query),
      };
    }

    if (table === "dog_delivery_schedules") {
      return {
        select: vi.fn(() => ({
          in: vi.fn(async () => ({ data: params.schedules, error: null })),
        })),
      };
    }

    return {
      select: vi.fn(() => ({
        in: vi.fn(async () => ({ data: [], error: null })),
      })),
    };
  });

  return { from } as unknown as Pick<SupabaseClient, "from">;
};

const baseBudget: BudgetRow = {
  id: "b-1",
  reference_month: "2026-04-01",
  budget_dogs: [
    {
      id: "bd-1",
      dog_id: "dog-1",
      dogs: {
        name: "Nanuk",
        tutors: [{ full_name: "Ana Tutor" }],
      },
      budget_dog_recipes: [
        {
          id: "bdr-1",
          recipe_id: "recipe-1",
          assigned_days: 10,
          recipes: { name: "Mix semanal" },
          budget_recipe_deliveries: [],
        },
      ],
    },
  ],
};

describe("getDeliveryAlerts", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("clasifica alertas vencidas y proximas sin wrap mensual", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-20T12:00:00.000Z"));

    const supabase = createSupabaseMock({
      budgets: [baseBudget],
      schedules: [
        { dog_id: "dog-1", day_of_month: 15, pct: 50 },
        { dog_id: "dog-1", day_of_month: 23, pct: 50 },
      ],
    });

    const alerts = await getDeliveryAlerts(supabase, 5);

    expect(alerts).toHaveLength(2);
    expect(alerts[0]).toMatchObject({
      kind: "overdue",
      daysOffset: 5,
      dayOfMonth: 15,
      missingMeals: 5,
    });
    expect(alerts[1]).toMatchObject({
      kind: "due_soon",
      daysOffset: 3,
      dayOfMonth: 23,
      missingMeals: 5,
    });
  });

  it("omite alertas cuando el presupuesto no es del mes en curso", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-20T12:00:00.000Z"));

    const nextMonthBudget: BudgetRow = {
      ...baseBudget,
      reference_month: "2026-05-01",
    };

    const supabase = createSupabaseMock({
      budgets: [nextMonthBudget],
      schedules: [{ dog_id: "dog-1", day_of_month: 14, pct: 50 }],
    });

    const alerts = await getDeliveryAlerts(supabase, 5);

    expect(alerts).toEqual([]);
  });

  it("omite alertas cuando la porcion ya fue entregada", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-20T12:00:00.000Z"));

    const budgetWithDeliveries: BudgetRow = {
      ...baseBudget,
      budget_dogs: [
        {
          ...baseBudget.budget_dogs[0],
          budget_dog_recipes: [
            {
              ...baseBudget.budget_dogs[0].budget_dog_recipes[0],
              budget_recipe_deliveries: [
                {
                  recipe_days: 5,
                  delivered_at: "2026-04-10T12:00:00.000Z",
                },
              ],
            },
          ],
        },
      ],
    };

    const supabase = createSupabaseMock({
      budgets: [budgetWithDeliveries],
      schedules: [{ dog_id: "dog-1", day_of_month: 15, pct: 50 }],
    });

    const alerts = await getDeliveryAlerts(supabase, 5);

    expect(alerts).toEqual([]);
  });

  it("aplica threshold solo a proximas y mantiene vencidas", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-20T12:00:00.000Z"));

    const supabase = createSupabaseMock({
      budgets: [baseBudget],
      schedules: [
        { dog_id: "dog-1", day_of_month: 29, pct: 50 },
        { dog_id: "dog-1", day_of_month: 10, pct: 50 },
      ],
    });

    const alerts = await getDeliveryAlerts(supabase, 5);

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      kind: "overdue",
      dayOfMonth: 10,
      daysOffset: 10,
    });
  });
});
