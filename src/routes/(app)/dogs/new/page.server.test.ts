import { describe, expect, it, vi } from "vitest";
import { actions } from "./+page.server";
import { asActionEvent } from "$lib/test-helpers/sveltekit-events";

describe("(app)/dogs/new actions.create", () => {
  it("requiere tutor, nombre, tipo de dieta y comidas diarias válidas", async () => {
    const formData = new FormData();
    formData.set("name", "Firulais");

    const result = (await actions.create(
      asActionEvent<Parameters<(typeof actions)["create"]>[0]>({
        request: { formData: async () => formData },
        locals: { supabase: { from: vi.fn() } },
      }),
    )) as {
      status: number;
      data: { operatorError: string };
    };

    expect(result.status).toBe(400);
    expect(result.data.operatorError).toContain("Completá tutor");
  });

  it("rollback si falla el schedule insert después de crear perro", async () => {
    const from = vi.fn((table: string) => {
      if (table === "dogs") {
        return {
          insert: () => ({
            select: () => ({
              single: () =>
                Promise.resolve({ data: { id: "d-1" }, error: null }),
            }),
          }),
          delete: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      if (table === "dog_delivery_schedules") {
        return {
          insert: () =>
            Promise.resolve({ error: { message: "schedule insert failed" } }),
        };
      }
      return {};
    });

    const formData = new FormData();
    formData.set("tutorId", "t-1");
    formData.set("name", "Firulais");
    formData.set("dietType", "mixta");
    formData.set("mealsPerDay", "2");
    formData.set("deliverySchedule", '[{"day_of_month":1,"pct":100}]');

    const result = (await actions.create(
      asActionEvent<Parameters<(typeof actions)["create"]>[0]>({
        request: { formData: async () => formData },
        locals: { supabase: { from } },
      }),
    )) as {
      status: number;
      data: { operatorError: string };
    };

    expect(result.status).toBe(400);
    expect(result.data.operatorError).toContain("calendario de entregas");
  });
});
