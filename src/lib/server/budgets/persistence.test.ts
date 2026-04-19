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

  it("happy path — deletes, inserts budget_dogs, inserts budget_dog_recipes → ok", async () => {
    const insertBudgetDogRecipes = vi.fn().mockReturnValue({ error: null });
    const mockSupabase = makeMockSupabase();
    (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === "budget_dogs") {
          return {
            delete: vi.fn().mockReturnValue({
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
          return { insert: insertBudgetDogRecipes };
        }
        return {};
      },
    );

    const result = await saveBudgetComposition({
      budgetId: "b-1",
      supabase: mockSupabase,
      composition,
      dogTotals,
    });

    expect(result.ok).toBe(true);
    expect(insertBudgetDogRecipes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          budget_dog_id: "bd-1",
          recipe_id: "r-1",
          assigned_days: 10,
        }),
      ]),
    );
  });

  it("error path — insert budget_dogs fails → returns error", async () => {
    const mockSupabase = makeMockSupabase();
    (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === "budget_dogs") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                data: null,
                error: { message: "insert failed" },
              }),
            }),
          };
        }
        return {};
      },
    );

    const result = await saveBudgetComposition({
      budgetId: "b-1",
      supabase: mockSupabase,
      composition,
      dogTotals,
    });

    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.message).toContain("No pudimos guardar los perros");
  });

  it("error path — insert budget_dog_recipes fails → returns error", async () => {
    const mockSupabase = makeMockSupabase();
    (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === "budget_dogs") {
          return {
            delete: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({ error: null }),
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
            insert: vi
              .fn()
              .mockReturnValue({ error: { message: "recipe insert failed" } }),
          };
        }
        return {};
      },
    );

    const result = await saveBudgetComposition({
      budgetId: "b-1",
      supabase: mockSupabase,
      composition,
      dogTotals,
    });

    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.message).toContain("No pudimos guardar las recetas");
  });

  it("validation path — dogTotals includes dog not in composition mapping → returns error", async () => {
    // dogTotals references d-orphan; composition references d-1.
    // The insert returns only d-orphan → budgetDogIdByDogId maps only d-orphan.
    // When composition row d-1 is looked up, budgetDogIdByDogId.get('d-1') is undefined → '' → triggers validation.
    const mockSupabase = makeMockSupabase();
    (mockSupabase.from as ReturnType<typeof vi.fn>).mockImplementation(
      (table: string) => {
        if (table === "budget_dogs") {
          return {
            delete: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({ error: null }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                // Only d-orphan is returned — d-1 from composition is NOT in the result
                data: [{ id: "bd-orphan", dog_id: "d-orphan" }],
                error: null,
              }),
            }),
          };
        }
        if (table === "budget_dog_recipes") {
          return { insert: vi.fn().mockReturnValue({ error: null }) };
        }
        return {};
      },
    );

    const orphanDogTotals = [
      {
        dogId: "d-orphan",
        ingredientTotal: 100,
        operationalTotal: 0,
        totalCost: 100,
        finalSalePrice: 125,
      },
    ];

    const result = await saveBudgetComposition({
      budgetId: "b-1",
      supabase: mockSupabase,
      composition,
      dogTotals: orphanDogTotals,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("No pudimos vincular");
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

describe('getBudgetExpiry', () => {
  it('create usa settingsValidityDays para calcular expiracion', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-01T10:00:00.000Z'));

    const result = await getBudgetExpiry({
      action: 'create',
      settingsValidityDays: 7,
      values: {} as any,
      supabase: makeMockSupabase()
    });

    vi.useRealTimers();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.expiresAt).toBe('2026-04-08T10:00:00.000Z');
    }
  });

  it('update renueva expiracion fija a 10 dias desde la edicion', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-01T10:00:00.000Z'));

    const fromSpy = vi.fn();
    const result = await getBudgetExpiry({
      action: 'update',
      budgetId: 'b-1',
      settingsValidityDays: 45,
      values: {} as any,
      supabase: { from: fromSpy } as unknown as SupabaseClient
    });

    vi.useRealTimers();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.expiresAt).toBe('2026-04-11T10:00:00.000Z');
    }
    expect(fromSpy).not.toHaveBeenCalled();
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
