import { describe, expect, it, vi } from "vitest";
import { actions, load } from "./+page.server";

describe("(app)/tutors/[tutor_id]/update load", () => {
  it("retorna tutor cuando existe", async () => {
    const eq = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: {
          id: "t-1",
          full_name: "Ana",
          whatsapp_number: "+54911",
          notes: null,
        },
        error: null,
      }),
    });
    const select = vi.fn().mockReturnValue({ eq });

    const data = (await load({
      params: { tutor_id: "t-1" },
      locals: { supabase: { from: vi.fn().mockReturnValue({ select }) } },
    } as unknown as Parameters<typeof load>[0])) as { tutor: { id: string } };

    expect(data.tutor.id).toBe("t-1");
  });
});

describe("(app)/tutors/[tutor_id]/update actions.update", () => {
  it("actualiza tutor y redirige al listado", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });

    const formData = new FormData();
    formData.set("fullName", "Ana Tutor Actualizada");
    formData.set("whatsappNumber", "+5491112345678");
    formData.set("notes", "Nuevo horario");

    await expect(
      actions.update({
        params: { tutor_id: "t-1" },
        request: { formData: async () => formData },
        locals: { supabase: { from: vi.fn().mockReturnValue({ update }) } },
      } as unknown as Parameters<(typeof actions)["update"]>[0]),
    ).rejects.toMatchObject({ status: 303, location: "/tutors" });

    expect(update).toHaveBeenCalledWith({
      full_name: "Ana Tutor Actualizada",
      whatsapp_number: "+5491112345678",
      notes: "Nuevo horario",
    });
    expect(eq).toHaveBeenCalledWith("id", "t-1");
  });
});
