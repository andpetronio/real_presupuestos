import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadBudgetOptions } from "./queries";

describe("loadBudgetOptions", () => {
  const mockSupabase = {
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockFrom = () => {
    const mockFrom = vi.fn((table: string) => {
      if (table === "tutors") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                { id: "t-1", full_name: "Ana García" },
                { id: "t-2", full_name: "Juan Pérez" },
              ],
              error: null,
            }),
          }),
        };
      }
      if (table === "dogs") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                { id: "d-1", tutor_id: "t-1", name: "Mora" },
                { id: "d-2", tutor_id: "t-1", name: "Luna" },
              ],
              error: null,
            }),
          }),
        };
      }
      if (table === "recipes") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [{ id: "r-1", dog_id: "d-1", name: "Mix proteico" }],
              error: null,
            }),
          }),
        };
      }
      if (table === "settings") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  vacuum_bag_small_unit_cost: 100,
                  vacuum_bag_large_unit_cost: 120,
                  label_unit_cost: 10,
                  non_woven_bag_unit_cost: 20,
                  labor_hour_cost: 500,
                  cooking_hour_cost: 600,
                  calcium_unit_cost: 10,
                  kefir_unit_cost: 15,
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });
    return mockFrom;
  };

  it("happy path: all 4 queries succeed → returns BudgetOptions with correct data", async () => {
    mockSupabase.from = createMockFrom();

    const result = await loadBudgetOptions(mockSupabase);

    expect(result.tutorOptions).toHaveLength(2);
    expect(result.dogOptions).toHaveLength(2);
    expect(result.recipeOptions).toHaveLength(1);
    expect(result.settings).toBeTruthy();
  });

  it("tutors returns empty array → tutorOptions is empty array (not null)", async () => {
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "tutors") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      if (table === "dogs") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [{ id: "d-1", tutor_id: "t-1", name: "Mora" }],
              error: null,
            }),
          }),
        };
      }
      if (table === "recipes") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        };
      }
      if (table === "settings") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  vacuum_bag_small_unit_cost: 100,
                  vacuum_bag_large_unit_cost: 120,
                  label_unit_cost: 10,
                  non_woven_bag_unit_cost: 20,
                  labor_hour_cost: 500,
                  cooking_hour_cost: 600,
                  calcium_unit_cost: 10,
                  kefir_unit_cost: 15,
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    const result = await loadBudgetOptions(mockSupabase);

    expect(result.tutorOptions).toEqual([]);
    expect(result.tutorOptions).toBeInstanceOf(Array);
  });

  it("settings query returns null data → settings is null (not undefined)", async () => {
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "tutors") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [{ id: "t-1", full_name: "Ana García" }],
              error: null,
            }),
          }),
        };
      }
      if (table === "dogs") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        };
      }
      if (table === "recipes") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        };
      }
      if (table === "settings") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const result = await loadBudgetOptions(mockSupabase);

    expect(result.settings).toBeNull();
  });

  it("snake_case DB fields are converted to camelCase in return", async () => {
    mockSupabase.from = vi.fn((table: string) => {
      if (table === "tutors") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [{ id: "t-1", full_name: "Ana García" }],
              error: null,
            }),
          }),
        };
      }
      if (table === "dogs") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [{ id: "d-1", tutor_id: "t-1", name: "Mora" }],
              error: null,
            }),
          }),
        };
      }
      if (table === "recipes") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [{ id: "r-1", dog_id: "d-1", name: "Mix proteico" }],
              error: null,
            }),
          }),
        };
      }
      if (table === "settings") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  vacuum_bag_small_unit_cost: 100,
                  vacuum_bag_large_unit_cost: 120,
                  label_unit_cost: 10,
                  non_woven_bag_unit_cost: 20,
                  labor_hour_cost: 500,
                  cooking_hour_cost: 600,
                  calcium_unit_cost: 10,
                  kefir_unit_cost: 15,
                },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    const result = await loadBudgetOptions(mockSupabase);

    // Tutor: full_name → fullName
    expect(result.tutorOptions[0].fullName).toBe("Ana García");
    expect(result.tutorOptions[0].id).toBe("t-1");

    // Dog: tutor_id → tutorId
    expect(result.dogOptions[0].tutorId).toBe("t-1");
    expect(result.dogOptions[0].name).toBe("Mora");

    // Recipe: dog_id → dogId
    expect(result.recipeOptions[0].dogId).toBe("d-1");
  });

  it("settings has all 8 cost fields", async () => {
    mockSupabase.from = createMockFrom();

    const result = await loadBudgetOptions(mockSupabase);

    expect(result.settings).toEqual({
      vacuum_bag_small_unit_cost: 100,
      vacuum_bag_large_unit_cost: 120,
      label_unit_cost: 10,
      non_woven_bag_unit_cost: 20,
      labor_hour_cost: 500,
      cooking_hour_cost: 600,
      calcium_unit_cost: 10,
      kefir_unit_cost: 15,
    });
  });
});
