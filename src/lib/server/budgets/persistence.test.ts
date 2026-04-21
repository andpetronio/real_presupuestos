import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  saveBudgetComposition,
  buildBudgetPayload,
  saveBudgetSnapshot,
  trackBudgetPersistenceIssue,
  updateBudgetStatus,
  deleteBudget,
  getBudgetById,
  getBudgetExpiry,
} from "./persistence";
import type { ParsedCompositionRow } from "./types";

const makeMockSupabase = (overrides: Record<string, unknown> = {}) => {
  const from = vi.fn((table: string) => {
    if (table === "budget_dogs") {
      return {
        delete: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({ error: null }),
          eq: vi.fn().mockReturnValue({ error: null }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            data: [{ id: "bd-1", dog_id: "d-1" }],
            error: null,
          }),
        }),
      };
    }
    if (table === "budget_dog_recipes") {
      return {
        insert: vi.fn().mockReturnValue({ error: null }),
      };
    }
    if (table === "budget_snapshots") {
      return {
        insert: vi.fn().mockReturnValue({ error: null }),
      };
    }
    if (table === "budget_persistence_events") {
      return {
        insert: vi.fn().mockReturnValue({ error: null }),
      };
    }
    if (table === "budgets") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: "b-1",
                status: "draft",
                tutor_id: "t-1",
                final_sale_price: 1000,
                expires_at: null,
                public_token: "tok-1",
                reference_month: "2026-01",
                reference_days: 20,
              },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ error: null }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ error: null }),
        }),
      };
    }
    return {};
  });
  return { from, ...overrides } as unknown as SupabaseClient;
};

// ─── saveBudgetComposition ───────────────────────────────────────────────────

describe("saveBudgetComposition", () => {
  const composition: ReadonlyArray<ParsedCompositionRow> = [
    { dogId: "d-1", recipeId: "r-1", assignedDays: 10 },
  ];
  const dogTotals = [
    {
      dogId: "d-1",
      ingredientTotal: 500,
      operationalTotal: 100,
      totalCost: 600,
      finalSalePrice: 750,
    },
  ];

  type InMemoryDb = {
    budget_dogs: Array<{
      id: string;
      budget_id: string;
      dog_id: string;
      requested_days: number;
      ingredient_total: number;
      operational_total: number;
      total_cost: number;
      final_sale_price: number;
    }>;
    budget_dog_recipes: Array<{
      budget_dog_id: string;
      recipe_id: string;
      assigned_days: number;
    }>;
  };

  const makeInMemorySupabase = (params?: {
    seed?: Partial<InMemoryDb>;
    failInsertBudgetDogs?: boolean;
    failInsertBudgetDogRecipes?: boolean;
  }) => {
    const seed = params?.seed ?? {};
    const db: InMemoryDb = {
      budget_dogs: [...(seed.budget_dogs ?? [])],
      budget_dog_recipes: [...(seed.budget_dog_recipes ?? [])],
    };
    let newDogCounter = 1;
    let failBudgetDogsInsert = params?.failInsertBudgetDogs ?? false;
    let failBudgetDogRecipesInsert =
      params?.failInsertBudgetDogRecipes ?? false;

    const supabase = {
      from: (table: string) => {
        if (table === "budget_dogs") {
          return {
            select: () => ({
              eq: (field: string, value: string) => {
                if (field !== "budget_id") return { data: null, error: null };
                return {
                  data: db.budget_dogs
                    .filter((row) => row.budget_id === value)
                    .map((row) => ({ ...row })),
                  error: null,
                };
              },
            }),
            delete: () => ({
              eq: (field: string, value: string) => {
                if (field === "budget_id") {
                  const removedIds = db.budget_dogs
                    .filter((row) => row.budget_id === value)
                    .map((row) => row.id);
                  db.budget_dogs = db.budget_dogs.filter(
                    (row) => row.budget_id !== value,
                  );
                  db.budget_dog_recipes = db.budget_dog_recipes.filter(
                    (row) => !removedIds.includes(row.budget_dog_id),
                  );
                  return { error: null };
                }
                if (field === "id") {
                  db.budget_dogs = db.budget_dogs.filter(
                    (row) => row.id !== value,
                  );
                  db.budget_dog_recipes = db.budget_dog_recipes.filter(
                    (row) => row.budget_dog_id !== value,
                  );
                }
                return { error: null };
              },
              in: (field: string, values: string[]) => {
                if (field !== "id") return { error: null };
                db.budget_dogs = db.budget_dogs.filter(
                  (row) => !values.includes(row.id),
                );
                db.budget_dog_recipes = db.budget_dog_recipes.filter(
                  (row) => !values.includes(row.budget_dog_id),
                );
                return { error: null };
              },
            }),
            insert: (rows: Array<Record<string, unknown>>) => {
              if (failBudgetDogsInsert) {
                failBudgetDogsInsert = false;
                return {
                  error: { message: "insert failed" },
                  select: () => ({
                    data: null,
                    error: { message: "insert failed" },
                  }),
                };
              }

              const inserted = rows.map((row) => {
                const id =
                  (row.id as string | undefined) ?? `bd-new-${newDogCounter++}`;
                const parsed = {
                  id,
                  budget_id: row.budget_id as string,
                  dog_id: row.dog_id as string,
                  requested_days: Number(row.requested_days),
                  ingredient_total: Number(row.ingredient_total),
                  operational_total: Number(row.operational_total),
                  total_cost: Number(row.total_cost),
                  final_sale_price: Number(row.final_sale_price),
                };
                db.budget_dogs.push(parsed);
                return parsed;
              });

              return {
                error: null,
                select: () => ({
                  data: inserted.map(({ id, dog_id }) => ({ id, dog_id })),
                  error: null,
                }),
              };
            },
          };
        }

        if (table === "budget_dog_recipes") {
          return {
            select: () => ({
              in: (field: string, values: string[]) => {
                if (field !== "budget_dog_id") return { data: [], error: null };
                return {
                  data: db.budget_dog_recipes
                    .filter((row) => values.includes(row.budget_dog_id))
                    .map((row) => ({ ...row })),
                  error: null,
                };
              },
            }),
            insert: (rows: Array<Record<string, unknown>>) => {
              if (failBudgetDogRecipesInsert) {
                failBudgetDogRecipesInsert = false;
                return { error: { message: "recipe insert failed" } };
              }
              db.budget_dog_recipes.push(
                ...rows.map((row) => ({
                  budget_dog_id: row.budget_dog_id as string,
                  recipe_id: row.recipe_id as string,
                  assigned_days: Number(row.assigned_days),
                })),
              );
              return { error: null };
            },
          };
        }

        return {};
      },
    } as unknown as SupabaseClient;

    return { supabase, db };
  };

  it("sin composición previa (create-like): inserta budget_dogs y budget_dog_recipes", async () => {
    const { supabase, db } = makeInMemorySupabase();

    const result = await saveBudgetComposition({
      budgetId: "b-1",
      supabase,
      composition,
      dogTotals,
    });

    expect(result.ok).toBe(true);
    expect(db.budget_dogs).toHaveLength(1);
    expect(db.budget_dogs[0]).toMatchObject({
      budget_id: "b-1",
      dog_id: "d-1",
      requested_days: 10,
    });
    expect(db.budget_dog_recipes).toHaveLength(1);
    expect(db.budget_dog_recipes[0]).toMatchObject({
      recipe_id: "r-1",
      assigned_days: 10,
    });
  });

  it("update con composición previa: reemplaza composición anterior por la nueva", async () => {
    const { supabase, db } = makeInMemorySupabase({
      seed: {
        budget_dogs: [
          {
            id: "bd-old-1",
            budget_id: "b-1",
            dog_id: "d-old",
            requested_days: 20,
            ingredient_total: 100,
            operational_total: 20,
            total_cost: 120,
            final_sale_price: 150,
          },
        ],
        budget_dog_recipes: [
          {
            budget_dog_id: "bd-old-1",
            recipe_id: "r-old",
            assigned_days: 20,
          },
        ],
      },
    });

    const result = await saveBudgetComposition({
      budgetId: "b-1",
      supabase,
      composition,
      dogTotals,
    });

    expect(result.ok).toBe(true);
    expect(db.budget_dogs).toHaveLength(1);
    expect(db.budget_dogs[0]).toMatchObject({
      budget_id: "b-1",
      dog_id: "d-1",
      requested_days: 10,
    });
    expect(db.budget_dog_recipes).toHaveLength(1);
    expect(db.budget_dog_recipes[0]).toMatchObject({
      recipe_id: "r-1",
      assigned_days: 10,
    });
  });

  it("falla insert de budget_dogs después de delete: rollback restaura composición previa", async () => {
    const { supabase, db } = makeInMemorySupabase({
      seed: {
        budget_dogs: [
          {
            id: "bd-old-1",
            budget_id: "b-1",
            dog_id: "d-old",
            requested_days: 20,
            ingredient_total: 100,
            operational_total: 20,
            total_cost: 120,
            final_sale_price: 150,
          },
        ],
        budget_dog_recipes: [
          {
            budget_dog_id: "bd-old-1",
            recipe_id: "r-old",
            assigned_days: 20,
          },
        ],
      },
      failInsertBudgetDogs: true,
    });

    const result = await saveBudgetComposition({
      budgetId: "b-1",
      supabase,
      composition,
      dogTotals,
    });

    expect(result.ok).toBe(false);
    expect(db.budget_dogs).toEqual([
      {
        id: "bd-old-1",
        budget_id: "b-1",
        dog_id: "d-old",
        requested_days: 20,
        ingredient_total: 100,
        operational_total: 20,
        total_cost: 120,
        final_sale_price: 150,
      },
    ]);
    expect(db.budget_dog_recipes).toEqual([
      {
        budget_dog_id: "bd-old-1",
        recipe_id: "r-old",
        assigned_days: 20,
      },
    ]);
  });

  it("falla insert de budget_dog_recipes: rollback completo sin pérdida", async () => {
    const { supabase, db } = makeInMemorySupabase({
      seed: {
        budget_dogs: [
          {
            id: "bd-old-1",
            budget_id: "b-1",
            dog_id: "d-old",
            requested_days: 20,
            ingredient_total: 100,
            operational_total: 20,
            total_cost: 120,
            final_sale_price: 150,
          },
        ],
        budget_dog_recipes: [
          {
            budget_dog_id: "bd-old-1",
            recipe_id: "r-old",
            assigned_days: 20,
          },
        ],
      },
      failInsertBudgetDogRecipes: true,
    });

    const result = await saveBudgetComposition({
      budgetId: "b-1",
      supabase,
      composition,
      dogTotals,
    });

    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.message).toContain("No pudimos guardar las recetas");
    expect(db.budget_dogs).toEqual([
      {
        id: "bd-old-1",
        budget_id: "b-1",
        dog_id: "d-old",
        requested_days: 20,
        ingredient_total: 100,
        operational_total: 20,
        total_cost: 120,
        final_sale_price: 150,
      },
    ]);
    expect(db.budget_dog_recipes).toEqual([
      {
        budget_dog_id: "bd-old-1",
        recipe_id: "r-old",
        assigned_days: 20,
      },
    ]);
  });

  it("error path — insert budget_dogs fails → returns error", async () => {
    const { supabase } = makeInMemorySupabase({
      failInsertBudgetDogs: true,
    });

    const result = await saveBudgetComposition({
      budgetId: "b-1",
      supabase,
      composition,
      dogTotals,
    });

    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.message).toContain("No pudimos guardar los perros");
  });
});

// ─── buildBudgetPayload ──────────────────────────────────────────────────────

describe("buildBudgetPayload", () => {
  it("returns correct snake_case payload from camelCase inputs", () => {
    const result = buildBudgetPayload({
      tutorId: "t-1",
      referenceMonth: "2026-01",
      referenceDays: 20,
      notes: "Test note",
      expiresAt: "2026-02-01",
      appliedMargin: 0.2,
      ingredientTotal: 500,
      operationalTotal: 100,
      totalCost: 600,
      finalSalePrice: 750,
      operationals: {
        vacuumBagSmallQty: 2,
        vacuumBagLargeQty: 1,
        labelsQty: 5,
        nonWovenBagQty: 0,
        laborHoursQty: 0,
        cookingHoursQty: 0,
        calciumQty: 0,
        kefirQty: 0,
      },
    });

    expect(result.tutor_id).toBe("t-1");
    expect(result.reference_month).toBe("2026-01");
    expect(result.reference_days).toBe(20);
    expect(result.notes).toBe("Test note");
    expect(result.expires_at).toBe("2026-02-01");
    expect(result.applied_margin).toBe(0.2);
    expect(result.ingredient_total_global).toBe(500);
    expect(result.operational_total_global).toBe(100);
    expect(result.total_cost).toBe(600);
    expect(result.final_sale_price).toBe(750);
  });

  it("all 10 operational fields are mapped correctly", () => {
    const result = buildBudgetPayload({
      tutorId: "t-1",
      referenceMonth: "2026-01",
      referenceDays: 20,
      notes: null,
      expiresAt: "2026-02-01",
      appliedMargin: 0,
      ingredientTotal: 0,
      operationalTotal: 0,
      totalCost: 0,
      finalSalePrice: 0,
      operationals: {
        vacuumBagSmallQty: 1,
        vacuumBagLargeQty: 2,
        labelsQty: 3,
        nonWovenBagQty: 4,
        laborHoursQty: 5,
        cookingHoursQty: 6,
        calciumQty: 7,
        kefirQty: 8,
      },
    });

    expect(result.vacuum_bag_small_qty).toBe(1);
    expect(result.vacuum_bag_large_qty).toBe(2);
    expect(result.labels_qty).toBe(3);
    expect(result.non_woven_bag_qty).toBe(4);
    expect(result.labor_hours_qty).toBe(5);
    expect(result.cooking_hours_qty).toBe(6);
    expect(result.calcium_qty).toBe(7);
    expect(result.kefir_qty).toBe(8);
  });
});

// ─── getBudgetExpiry ────────────────────────────────────────────────────────

describe("getBudgetExpiry", () => {
  it("create usa settingsValidityDays para calcular expiracion", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T10:00:00.000Z"));

    const result = await getBudgetExpiry({
      action: "create",
      settingsValidityDays: 7,
      values: {} as any,
      supabase: makeMockSupabase(),
    });

    vi.useRealTimers();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.expiresAt).toBe("2026-04-08T10:00:00.000Z");
    }
  });

  it("update renueva expiracion fixa a settingsValidityDays desde la creacion", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T10:00:00.000Z"));

    const maybeSingle = vi.fn().mockResolvedValue({
      data: { created_at: "2026-04-01T10:00:00.000Z" },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const fromSpy = vi.fn().mockReturnValue({ select });

    const result = await getBudgetExpiry({
      action: "update",
      budgetId: "b-1",
      settingsValidityDays: 45,
      values: {} as any,
      supabase: { from: fromSpy } as unknown as SupabaseClient,
    });

    vi.useRealTimers();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.expiresAt).toBe("2026-05-16T10:00:00.000Z");
    }
    expect(fromSpy).toHaveBeenCalledWith("budgets");
  });
});

// ─── saveBudgetSnapshot ─────────────────────────────────────────────────────

describe("saveBudgetSnapshot", () => {
  it("happy path — insert succeeds → ok", async () => {
    const insert = vi.fn().mockReturnValue({ error: null });
    const mockSupabase = makeMockSupabase();
    (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === "budget_snapshots") return { insert };
        return {};
      },
    );

    const result = await saveBudgetSnapshot({
      budgetId: "b-1",
      supabase: mockSupabase,
      snapshotData: {
        tutorId: "t-1",
        composition: [],
        operationals: {
          vacuumBagSmallQty: 0,
          vacuumBagLargeQty: 0,
          labelsQty: 0,
          nonWovenBagQty: 0,
          laborHoursQty: 0,
          cookingHoursQty: 0,
          calciumQty: 0,
          kefirQty: 0,
        },
        settings: {},
        totals: {},
      },
    });

    expect(result.ok).toBe(true);
    expect(insert).toHaveBeenCalledWith({
      budget_id: "b-1",
      snapshot_payload_json: expect.any(Object),
    });
  });

  it("error path — insert fails → returns error with specific message", async () => {
    const insert = vi
      .fn()
      .mockReturnValue({ error: { message: "snapshot failed" } });
    const mockSupabase = makeMockSupabase();
    (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === "budget_snapshots") return { insert };
        return {};
      },
    );

    const result = await saveBudgetSnapshot({
      budgetId: "b-1",
      supabase: mockSupabase,
      snapshotData: {
        tutorId: "t-1",
        composition: [],
        operationals: {
          vacuumBagSmallQty: 0,
          vacuumBagLargeQty: 0,
          labelsQty: 0,
          nonWovenBagQty: 0,
          laborHoursQty: 0,
          cookingHoursQty: 0,
          calciumQty: 0,
          kefirQty: 0,
        },
        settings: {},
        totals: {},
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("registro histórico");
  });
});

describe("trackBudgetPersistenceIssue", () => {
  it("persists issue record without throwing when insert succeeds", async () => {
    const insert = vi.fn().mockReturnValue({ error: null });
    const mockSupabase = makeMockSupabase();
    (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === "budget_persistence_events") return { insert };
        return {};
      },
    );

    await expect(
      trackBudgetPersistenceIssue({
        budgetId: "b-1",
        supabase: mockSupabase,
        stage: "snapshot",
        detail: "snapshot insert failed",
      }),
    ).resolves.toBeUndefined();

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        budget_id: "b-1",
        stage: "snapshot",
        detail: "snapshot insert failed",
      }),
    );
  });

  it("logs warning and does not throw when telemetry insert fails", async () => {
    const insert = vi.fn().mockReturnValue({
      error: { message: "telemetry unavailable" },
    });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const mockSupabase = makeMockSupabase();
    (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === "budget_persistence_events") return { insert };
        return {};
      },
    );

    await expect(
      trackBudgetPersistenceIssue({
        budgetId: "b-1",
        supabase: mockSupabase,
        stage: "snapshot",
        detail: "snapshot insert failed",
      }),
    ).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalledWith(
      "[persistBudget] No pudimos registrar telemetry de persistencia:",
      "telemetry unavailable",
    );

    warnSpy.mockRestore();
  });
});

// ─── updateBudgetStatus ───────────────────────────────────────────────────────

describe("updateBudgetStatus", () => {
  it("happy path — update succeeds → ok", async () => {
    const eq = vi.fn().mockReturnValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    const mockSupabase = makeMockSupabase();
    (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === "budgets") return { update, eq: vi.fn() };
        return {};
      },
    );

    const result = await updateBudgetStatus({
      budgetId: "b-1",
      supabase: mockSupabase,
      status: "sent",
    });

    expect(result.ok).toBe(true);
    expect(update).toHaveBeenCalledWith({ status: "sent" });
  });

  it("error path — update fails → returns error with specific message", async () => {
    const eq = vi.fn().mockReturnValue({ error: { message: "update failed" } });
    const update = vi.fn().mockReturnValue({ eq });
    const mockSupabase = makeMockSupabase();
    (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === "budgets") return { update, eq: vi.fn() };
        return {};
      },
    );

    const result = await updateBudgetStatus({
      budgetId: "b-1",
      supabase: mockSupabase,
      status: "sent",
    });

    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.message).toBe("No pudimos actualizar el presupuesto.");
  });

  it("with extraFields — verifies they are merged into the update payload", async () => {
    const eq = vi.fn().mockReturnValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    const mockSupabase = makeMockSupabase();
    (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === "budgets") return { update, eq: vi.fn() };
        return {};
      },
    );

    await updateBudgetStatus({
      budgetId: "b-1",
      supabase: mockSupabase,
      status: "sent",
      extraFields: { sent_at: null, notes: "Updated" },
    });

    expect(update).toHaveBeenCalledWith({
      status: "sent",
      sent_at: null,
      notes: "Updated",
    });
  });
});

// ─── deleteBudget ─────────────────────────────────────────────────────────────

describe("deleteBudget", () => {
  it("happy path — delete succeeds → ok", async () => {
    const eq = vi.fn().mockReturnValue({ error: null });
    const deleteFn = vi.fn().mockReturnValue({ eq });
    const mockSupabase = makeMockSupabase();
    (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === "budgets") return { delete: deleteFn };
        return {};
      },
    );

    const result = await deleteBudget({
      budgetId: "b-1",
      supabase: mockSupabase,
    });

    expect(result.ok).toBe(true);
    expect(deleteFn).toHaveBeenCalledWith();
    expect(eq).toHaveBeenCalledWith("id", "b-1");
  });

  it("error path — delete fails → returns error", async () => {
    const eq = vi.fn().mockReturnValue({ error: { message: "delete failed" } });
    const deleteFn = vi.fn().mockReturnValue({ eq });
    const mockSupabase = makeMockSupabase();
    (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === "budgets") return { delete: deleteFn };
        return {};
      },
    );

    const result = await deleteBudget({
      budgetId: "b-1",
      supabase: mockSupabase,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("No pudimos eliminar");
  });
});

// ─── getBudgetById ───────────────────────────────────────────────────────────

describe("getBudgetById", () => {
  it("found — returns budget data", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "b-1",
        status: "draft",
        tutor_id: "t-1",
        final_sale_price: 1000,
        expires_at: null,
        public_token: "tok-1",
        reference_month: "2026-01",
        reference_days: 20,
      },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const mockSupabase = makeMockSupabase();
    (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === "budgets") return { select };
        return {};
      },
    );

    const result = await getBudgetById({
      budgetId: "b-1",
      supabase: mockSupabase,
    });

    expect(result).not.toBeNull();
    if (result) {
      expect(result.id).toBe("b-1");
      expect(result.status).toBe("draft");
      expect(result.tutor_id).toBe("t-1");
      expect(result.final_sale_price).toBe(1000);
    }
    expect(select).toHaveBeenCalledWith(
      "id, status, tutor_id, final_sale_price, expires_at, public_token, reference_month, reference_days",
    );
    expect(eq).toHaveBeenCalledWith("id", "b-1");
  });

  it("not found / error — returns null", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const mockSupabase = makeMockSupabase();
    (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === "budgets") return { select };
        return {};
      },
    );

    const result = await getBudgetById({
      budgetId: "b-nonexistent",
      supabase: mockSupabase,
    });

    expect(result).toBeNull();
  });

  it("error from supabase — returns null", async () => {
    const maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "server error" } });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const mockSupabase = makeMockSupabase();
    (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === "budgets") return { select };
        return {};
      },
    );

    const result = await getBudgetById({
      budgetId: "b-1",
      supabase: mockSupabase,
    });

    expect(result).toBeNull();
  });
});
