import { describe, expect, it, vi } from "vitest";
import { actions } from "./+page.server";

describe("(app)/veterinaries/new actions.create", () => {
  it("crea veterinaria y redirige al listado", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const formData = new FormData();
    formData.set("name", "Vet Norte");

    await expect(
      actions.create({
        request: { formData: async () => formData },
        locals: { supabase: { from: vi.fn().mockReturnValue({ insert }) } },
      } as unknown as Parameters<(typeof actions)["create"]>[0]),
    ).rejects.toMatchObject({ status: 303, location: "/veterinaries" });

    expect(insert).toHaveBeenCalledWith({ name: "Vet Norte" });
  });
});
