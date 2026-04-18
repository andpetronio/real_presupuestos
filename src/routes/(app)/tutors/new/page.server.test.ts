import { describe, expect, it, vi } from "vitest";
import { actions } from "./+page.server";
import { asActionEvent } from "$lib/test-helpers/sveltekit-events";

describe("(app)/tutors/new actions.create", () => {
  it("crea tutor y redirige al listado", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const formData = new FormData();
    formData.set("fullName", "Ana Tutor");
    formData.set("whatsappNumber", "+5491112345678");
    formData.set("notes", "Prefiere contacto por la tarde");

    await expect(
      actions.create(
        asActionEvent<Parameters<(typeof actions)["create"]>[0]>({
          request: { formData: async () => formData },
          locals: { supabase: { from: vi.fn().mockReturnValue({ insert }) } },
        }),
      ),
    ).rejects.toMatchObject({ status: 303, location: "/tutors" });

    expect(insert).toHaveBeenCalledWith({
      full_name: "Ana Tutor",
      whatsapp_number: "+5491112345678",
      notes: "Prefiere contacto por la tarde",
    });
  });
});
