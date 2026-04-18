import { describe, expect, it, vi } from "vitest";
import { load } from "./+page.server";
import { asLoadEvent } from "$lib/test-helpers/sveltekit-events";

describe("(app)/tutors/+page.server load", () => {
  it("retorna success cuando Supabase devuelve tutores", async () => {
    const order = vi.fn().mockReturnValue({
      range: vi.fn().mockResolvedValue({
        data: [
          {
            id: "t-1",
            full_name: "Ana Tutor",
            whatsapp_number: "+54911",
            notes: null,
            created_at: "2026-01-01",
          },
        ],
        count: 1,
        error: null,
      }),
    });

    const data = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        url: new URL("https://test.local/tutors"),
        locals: {
          supabase: {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({ order }),
            }),
          },
        },
      }),
    )) as {
      tableState: string;
      tutors: ReadonlyArray<unknown>;
    };

    expect(data.tableState).toBe("success");
    expect(data.tutors).toHaveLength(1);
  });
});
