import { describe, expect, it, vi } from "vitest";
import { load } from "./+page.server";
import { asLoadEvent } from "$lib/test-helpers/sveltekit-events";

describe("(app)/raw-materials/+page.server load", () => {
  it("retorna empty cuando no hay materias primas", async () => {
    const order = vi.fn().mockReturnValue({
      range: vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
    });

    const data = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        locals: {
          supabase: {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({ order }),
            }),
          },
        },
        url: new URL("https://example.test/raw-materials"),
      }),
    )) as { tableState: string };

    expect(data.tableState).toBe("empty");
  });
});
