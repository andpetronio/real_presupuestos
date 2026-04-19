import { describe, expect, it, vi } from "vitest";
import { load, actions } from "./+page.server";
import { asLoadEvent } from "$lib/test-helpers/sveltekit-events";

describe("(app)/tutors/+page.server load", () => {
  it("retorna success cuando Supabase devuelve tutores e incluye is_active", async () => {
    const range = vi.fn().mockResolvedValue({
      data: [
        {
          id: "t-1",
          full_name: "Ana Tutor",
          whatsapp_number: "+54911",
          notes: null,
          is_active: true,
          created_at: "2026-01-01",
        },
      ],
      count: 1,
      error: null,
    });
    const statusEq = vi.fn().mockReturnValue({ range });
    const order = vi.fn().mockReturnValue({ range, eq: statusEq });
    const select = vi.fn().mockReturnValue({ order });

    const data = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        url: new URL("https://test.local/tutors"),
        locals: {
          supabase: {
            from: vi.fn().mockReturnValue({
              select,
            }),
          },
        },
      }),
    )) as {
      tableState: string;
      tutors: ReadonlyArray<unknown>;
    };

    expect(select).toHaveBeenCalledWith(
      "id, full_name, whatsapp_number, notes, is_active, created_at",
      { count: "exact" },
    );
    expect(data.tableState).toBe("success");
    expect(data.tutors).toHaveLength(1);
  });

  it("aplica filtro status=active usando is_active=true", async () => {
    const range = vi.fn().mockResolvedValue({ data: [], count: 0, error: null });
    const statusEq = vi.fn().mockReturnValue({ range });
    const order = vi.fn().mockReturnValue({ range, eq: statusEq });

    await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        url: new URL("https://test.local/tutors?status=active"),
        locals: {
          supabase: {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({ order }),
            }),
          },
        },
      }),
    );

    expect(statusEq).toHaveBeenCalledWith("is_active", true);
  });

  it("aplica filtro status=inactive usando is_active=false", async () => {
    const range = vi.fn().mockResolvedValue({ data: [], count: 0, error: null });
    const statusEq = vi.fn().mockReturnValue({ range });
    const order = vi.fn().mockReturnValue({ range, eq: statusEq });

    await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        url: new URL("https://test.local/tutors?status=inactive"),
        locals: {
          supabase: {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({ order }),
            }),
          },
        },
      }),
    );

    expect(statusEq).toHaveBeenCalledWith("is_active", false);
  });

  it("no aplica filtro de estado cuando status=all", async () => {
    const range = vi.fn().mockResolvedValue({ data: [], count: 0, error: null });
    const statusEq = vi.fn().mockReturnValue({ range });
    const order = vi.fn().mockReturnValue({ range, eq: statusEq });

    await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        url: new URL("https://test.local/tutors?status=all"),
        locals: {
          supabase: {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({ order }),
            }),
          },
        },
      }),
    );

    expect(statusEq).not.toHaveBeenCalled();
  });
});

describe("(app)/tutors/+page.server actions", () => {
  it("delete desactiva tutor y cascada perros/recetas", async () => {
    const tutorEq = vi.fn().mockResolvedValue({ error: null });
    const dogsSelectEq = vi
      .fn()
      .mockResolvedValue({ data: [{ id: "d-1" }, { id: "d-2" }], error: null });
    const dogsUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const recipesIn = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "tutors") {
        return { update: vi.fn().mockReturnValue({ eq: tutorEq }) };
      }

      if (table === "dogs") {
        return {
          select: vi.fn().mockReturnValue({ eq: dogsSelectEq }),
          update: vi.fn().mockReturnValue({ eq: dogsUpdateEq }),
        };
      }

      if (table === "recipes") {
        return { update: vi.fn().mockReturnValue({ in: recipesIn }) };
      }

      return {};
    });

    const formData = new FormData();
    formData.set("tutorId", "t-1");

    const result = (await actions.delete({
      request: { formData: async () => formData },
      locals: { supabase: { from } },
    } as unknown as Parameters<(typeof actions)["delete"]>[0])) as {
      operatorSuccess: string;
    };

    expect(tutorEq).toHaveBeenCalledWith("id", "t-1");
    expect(dogsSelectEq).toHaveBeenCalledWith("tutor_id", "t-1");
    expect(dogsUpdateEq).toHaveBeenCalledWith("tutor_id", "t-1");
    expect(recipesIn).toHaveBeenCalledWith("dog_id", ["d-1", "d-2"]);
    expect(result.operatorSuccess).toContain("Tutor desactivado correctamente");
  });

  it("restore reactiva tutor y cascada perros/recetas", async () => {
    const tutorEq = vi.fn().mockResolvedValue({ error: null });
    const dogsSelectEq = vi
      .fn()
      .mockResolvedValue({ data: [{ id: "d-1" }], error: null });
    const dogsUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const recipesIn = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === "tutors") {
        return { update: vi.fn().mockReturnValue({ eq: tutorEq }) };
      }

      if (table === "dogs") {
        return {
          select: vi.fn().mockReturnValue({ eq: dogsSelectEq }),
          update: vi.fn().mockReturnValue({ eq: dogsUpdateEq }),
        };
      }

      if (table === "recipes") {
        return { update: vi.fn().mockReturnValue({ in: recipesIn }) };
      }

      return {};
    });

    const formData = new FormData();
    formData.set("tutorId", "t-1");

    const result = (await actions.restore({
      request: { formData: async () => formData },
      locals: { supabase: { from } },
    } as unknown as Parameters<(typeof actions)["restore"]>[0])) as {
      operatorSuccess: string;
    };

    expect(tutorEq).toHaveBeenCalledWith("id", "t-1");
    expect(dogsSelectEq).toHaveBeenCalledWith("tutor_id", "t-1");
    expect(dogsUpdateEq).toHaveBeenCalledWith("tutor_id", "t-1");
    expect(recipesIn).toHaveBeenCalledWith("dog_id", ["d-1"]);
    expect(result.operatorSuccess).toContain("Tutor restaurado correctamente");
  });
});
