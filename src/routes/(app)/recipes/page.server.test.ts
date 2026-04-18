import { describe, expect, it, vi } from "vitest";
import { load } from "./+page.server";
import { asLoadEvent } from "$lib/test-helpers/sveltekit-events";

describe("(app)/recipes/+page.server load", () => {
  it("retorna error state cuando falla la carga", async () => {
    const from = vi.fn((table: string) => {
      if (table === "recipes") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: null,
                count: 0,
                error: { message: "db down" },
              }),
            }),
          }),
        };
      }

      if (table === "dogs") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      };
    });

    const data = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        url: new URL("https://test.local/recipes"),
        locals: { supabase: { from } },
      }),
    )) as {
      tableState: string;
      recipes: ReadonlyArray<unknown>;
    };

    expect(data.tableState).toBe("error");
    expect(data.recipes).toEqual([]);
  });
});
