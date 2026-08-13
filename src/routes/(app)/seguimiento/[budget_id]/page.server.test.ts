import { describe, expect, it, vi, afterEach } from "vitest";
import { actions, load } from "./+page.server";
import { asActionEvent, asLoadEvent } from "$lib/test-helpers/sveltekit-events";
import * as tracking from "$lib/server/budgets/tracking";

afterEach(() => {
  vi.restoreAllMocks();
});

const createActionRequest = (formData: FormData) =>
  ({
    formData: vi.fn().mockResolvedValue(formData),
    headers: new Headers({ "user-agent": "Mozilla/5.0 (Macintosh)" }),
  }) as unknown as Request;

describe("(app)/seguimiento/[budget_id] load", () => {
  it("usa join interno + filtro por budget_id y descarta filas ajenas", async () => {
    vi.spyOn(tracking, "getDeliveryAlerts").mockResolvedValue([]);

    const budgetsMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "b-1",
        status: "closed",
        final_sale_price: 120000,
        accepted_at: "2026-04-01T00:00:00.000Z",
        tutor: { full_name: "Ana Tutor" },
      },
      error: null,
    });
    const budgetsEq = vi
      .fn()
      .mockReturnValue({ maybeSingle: budgetsMaybeSingle });

    const recipesOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: "r-1",
          assigned_days: 10,
          recipe: { name: "MUNA_pollo" },
          budget_dog: {
            id: "bd-1",
            budget_id: "b-1",
            dog: { name: "Muna" },
          },
        },
        {
          id: "r-foreign",
          assigned_days: 90,
          recipe: { name: "OTRA" },
          budget_dog: {
            id: "bd-x",
            budget_id: "b-x",
            dog: { name: "Perro Ajeno" },
          },
        },
      ],
      error: null,
    });
    const recipesEq = vi.fn().mockReturnValue({ order: recipesOrder });
    const recipesSelect = vi.fn().mockReturnValue({ eq: recipesEq });

    const preparationsOrder = vi
      .fn()
      .mockResolvedValue({ data: [], error: null });
    const preparationsIn = vi
      .fn()
      .mockReturnValue({ order: preparationsOrder });

    const deliveriesOrder = vi
      .fn()
      .mockResolvedValue({ data: [], error: null });
    const deliveriesIn = vi.fn().mockReturnValue({ order: deliveriesOrder });

    const paymentsOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const paymentsEq = vi.fn().mockReturnValue({ order: paymentsOrder });

    const from = vi.fn((table: string) => {
      if (table === "budgets") {
        return {
          select: vi.fn().mockReturnValue({ eq: budgetsEq }),
        };
      }

      if (table === "budget_dog_recipes") {
        return {
          select: recipesSelect,
        };
      }

      if (table === "budget_recipe_preparations") {
        return {
          select: vi.fn().mockReturnValue({ in: preparationsIn }),
        };
      }

      if (table === "budget_recipe_deliveries") {
        return {
          select: vi.fn().mockReturnValue({ in: deliveriesIn }),
        };
      }

      if (table === "budget_payments") {
        return {
          select: vi.fn().mockReturnValue({ eq: paymentsEq }),
        };
      }

      return { select: vi.fn() };
    });

    const data = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        params: { budget_id: "b-1" },
        locals: { supabase: { from } },
      }),
    )) as {
      dogs: Array<{ dogName: string }>;
      recipeOptions: Array<{ budgetDogRecipeId: string }>;
    };

    expect(recipesSelect).toHaveBeenCalledWith(
      expect.stringContaining("budget_dog:budget_dogs!inner"),
    );
    expect(recipesEq).toHaveBeenCalledWith("budget_dog.budget_id", "b-1");
    expect(preparationsIn).toHaveBeenCalledWith("budget_dog_recipe_id", [
      "r-1",
    ]);
    expect(deliveriesIn).toHaveBeenCalledWith("budget_dog_recipe_id", ["r-1"]);
    expect(data.dogs).toHaveLength(1);
    expect(data.dogs[0]?.dogName).toBe("Muna");
    expect(data.recipeOptions).toEqual([
      expect.objectContaining({ budgetDogRecipeId: "r-1" }),
    ]);
  });

  it("redirige al listado cuando el presupuesto no está en estado accepted/closed", async () => {
    const from = vi.fn((table: string) => {
      if (table === "budgets") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "b-1",
                  status: "draft",
                },
                error: null,
              }),
            }),
          }),
        };
      }

      return { select: vi.fn() };
    });

    await expect(
      load(
        asLoadEvent<Parameters<typeof load>[0]>({
          params: { budget_id: "b-1" },
          locals: { supabase: { from } },
        }),
      ),
    ).rejects.toMatchObject({ status: 303, location: "/seguimiento" });
  });

  it("redirige al listado cuando el presupuesto no existe", async () => {
    const from = vi.fn((table: string) => {
      if (table === "budgets") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }

      return { select: vi.fn() };
    });

    await expect(
      load(
        asLoadEvent<Parameters<typeof load>[0]>({
          params: { budget_id: "missing" },
          locals: { supabase: { from } },
        }),
      ),
    ).rejects.toMatchObject({ status: 303, location: "/seguimiento" });
  });

  it("redirige al listado cuando falla la query de recetas", async () => {
    const from = vi.fn((table: string) => {
      if (table === "budgets") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "b-1",
                  status: "accepted",
                  final_sale_price: 1,
                  accepted_at: null,
                  tutor: null,
                },
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "budget_dog_recipes") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "boom" },
              }),
            }),
          }),
        };
      }

      return { select: vi.fn() };
    });

    vi.spyOn(tracking, "markBudgetViewed").mockResolvedValue();

    await expect(
      load(
        asLoadEvent<Parameters<typeof load>[0]>({
          params: { budget_id: "b-1" },
          locals: { supabase: { from } },
        }),
      ),
    ).rejects.toMatchObject({ status: 303, location: "/seguimiento" });
  });
});

describe("(app)/seguimiento/[budget_id] actions", () => {
  it("registers payment first and returns WhatsApp URL with recalculated balance when requested", async () => {
    const insertPayment = vi.fn().mockResolvedValue({ error: null });
    const paymentsEq = vi.fn().mockResolvedValue({
      data: [
        {
          id: "p-old",
          budget_id: "b-1",
          amount: 20000,
          payment_method: "cash",
          paid_at: "2026-04-01T00:00:00.000Z",
          notes: null,
        },
        {
          id: "p-new",
          budget_id: "b-1",
          amount: 15000,
          payment_method: "transfer",
          paid_at: "2026-04-10T00:00:00.000Z",
          notes: null,
        },
      ],
      error: null,
    });
    const budgetMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        final_sale_price: 60000,
        tutor: {
          full_name: "Ana Tutor",
          whatsapp_number: "+54 9 11 1234-5678",
        },
      },
      error: null,
    });
    const from = vi.fn((table: string) => {
      if (table === "budget_payments") {
        return {
          insert: insertPayment,
          select: vi.fn().mockReturnValue({ eq: paymentsEq }),
        };
      }

      if (table === "budgets") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ maybeSingle: budgetMaybeSingle }),
          }),
        };
      }

      return {};
    });
    const formData = new FormData();
    formData.set("amount", "15000");
    formData.set("paymentMethod", "transfer");
    formData.set("paidAt", "2026-04-10");
    formData.set("sendWhatsapp", "1");

    const result = await actions.addPayment?.(
      asActionEvent<Parameters<NonNullable<typeof actions.addPayment>>[0]>({
        request: createActionRequest(formData),
        locals: { supabase: { from } },
        params: { budget_id: "b-1" },
      }),
    );

    expect(insertPayment.mock.invocationCallOrder[0]).toBeLessThan(
      paymentsEq.mock.invocationCallOrder[0],
    );
    expect(result).toMatchObject({ operatorSuccess: expect.any(String) });
    expect((result as { whatsappUrl?: string }).whatsappUrl).toContain(
      "web.whatsapp.com/send?phone=5491112345678",
    );
    expect(
      decodeURIComponent((result as { whatsappUrl: string }).whatsappUrl),
    ).toContain("15.000");
    expect(
      decodeURIComponent((result as { whatsappUrl: string }).whatsappUrl),
    ).toContain("25.000");
  });

  it("registers delivery first and returns WhatsApp URL with submitted meals and persisted remaining balance", async () => {
    const insertDelivery = vi.fn().mockResolvedValue({ error: null });
    const deliveriesIn = vi.fn().mockResolvedValue({
      data: [
        { budget_dog_recipe_id: "r-1", recipe_days: 4 },
        { budget_dog_recipe_id: "r-1", recipe_days: 3 },
        { budget_dog_recipe_id: "r-2", recipe_days: 2 },
      ],
      error: null,
    });
    const budgetMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        final_sale_price: 50000,
        tutor: {
          full_name: "Ana Tutor",
          whatsapp_number: "+54 9 11 1234-5678",
        },
      },
      error: null,
    });
    const recipesEq = vi.fn().mockResolvedValue({
      data: [
        {
          id: "r-1",
          assigned_days: 10,
          recipe: { name: "Pollo" },
          budget_dog: { budget_id: "b-1", dog: { name: "Muna" } },
        },
        {
          id: "r-2",
          assigned_days: 8,
          recipe: { name: "Carne" },
          budget_dog: { budget_id: "b-1", dog: { name: "Luna" } },
        },
      ],
      error: null,
    });
    const from = vi.fn((table: string) => {
      if (table === "budget_recipe_deliveries") {
        return {
          insert: insertDelivery,
          select: vi.fn().mockReturnValue({ in: deliveriesIn }),
        };
      }

      if (table === "budgets") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ maybeSingle: budgetMaybeSingle }),
          }),
        };
      }

      if (table === "budget_dog_recipes") {
        return { select: vi.fn().mockReturnValue({ eq: recipesEq }) };
      }

      return {};
    });
    const formData = new FormData();
    formData.append("budgetDogRecipeId", "r-1");
    formData.append("recipeDays", "3");
    formData.append("budgetDogRecipeId", "r-2");
    formData.append("recipeDays", "2");
    formData.set("entryDate", "2026-04-10");
    formData.set("sendWhatsapp", "1");

    const result = await actions.addDelivery?.(
      asActionEvent<Parameters<NonNullable<typeof actions.addDelivery>>[0]>({
        request: createActionRequest(formData),
        locals: { supabase: { from } },
        params: { budget_id: "b-1" },
      }),
    );

    expect(insertDelivery.mock.invocationCallOrder[0]).toBeLessThan(
      deliveriesIn.mock.invocationCallOrder[0],
    );
    expect((result as { whatsappUrl?: string }).whatsappUrl).toContain(
      "web.whatsapp.com/send?phone=5491112345678",
    );
    const decodedUrl = decodeURIComponent(
      (result as { whatsappUrl: string }).whatsappUrl,
    );
    expect(decodedUrl).toContain("5 comidas");
    expect(decodedUrl).toContain("9 comidas");
  });

  it("keeps payment registration working when WhatsApp is not requested", async () => {
    const insertPayment = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) => {
      if (table === "budget_payments") return { insert: insertPayment };
      return {};
    });
    const formData = new FormData();
    formData.set("amount", "15000");
    formData.set("paymentMethod", "cash");
    formData.set("paidAt", "2026-04-10");

    const result = await actions.addPayment?.(
      asActionEvent<Parameters<NonNullable<typeof actions.addPayment>>[0]>({
        request: createActionRequest(formData),
        locals: { supabase: { from } },
        params: { budget_id: "b-1" },
      }),
    );

    expect(insertPayment).toHaveBeenCalled();
    expect(from).not.toHaveBeenCalledWith("budgets");
    expect(result).not.toHaveProperty("whatsappUrl");
  });

  it("keeps delivery registration working when WhatsApp is requested but the tutor has no phone", async () => {
    const insertDelivery = vi.fn().mockResolvedValue({ error: null });
    const budgetMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        final_sale_price: 50000,
        tutor: { full_name: "Ana Tutor", whatsapp_number: null },
      },
      error: null,
    });
    const recipesEq = vi.fn().mockResolvedValue({
      data: [
        {
          id: "r-1",
          assigned_days: 10,
          recipe: { name: "Pollo" },
          budget_dog: { budget_id: "b-1", dog: { name: "Muna" } },
        },
      ],
      error: null,
    });
    const deliveriesIn = vi.fn().mockResolvedValue({
      data: [{ budget_dog_recipe_id: "r-1", recipe_days: 3 }],
      error: null,
    });
    const from = vi.fn((table: string) => {
      if (table === "budget_recipe_deliveries") {
        return {
          insert: insertDelivery,
          select: vi.fn().mockReturnValue({ in: deliveriesIn }),
        };
      }

      if (table === "budgets") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ maybeSingle: budgetMaybeSingle }),
          }),
        };
      }

      if (table === "budget_dog_recipes") {
        return { select: vi.fn().mockReturnValue({ eq: recipesEq }) };
      }

      return {};
    });
    const formData = new FormData();
    formData.append("budgetDogRecipeId", "r-1");
    formData.append("recipeDays", "3");
    formData.set("entryDate", "2026-04-10");
    formData.set("sendWhatsapp", "1");

    const result = await actions.addDelivery?.(
      asActionEvent<Parameters<NonNullable<typeof actions.addDelivery>>[0]>({
        request: createActionRequest(formData),
        locals: { supabase: { from } },
        params: { budget_id: "b-1" },
      }),
    );

    expect(insertDelivery).toHaveBeenCalled();
    expect(result).not.toHaveProperty("whatsappUrl");
    expect(result).toMatchObject({
      operatorSuccess: expect.stringContaining("Entrega registrada"),
    });
  });
});
