import { describe, expect, it, vi } from "vitest";
import { actions, load } from "./+page.server";
import { asActionEvent, asLoadEvent } from "$lib/test-helpers/sveltekit-events";

type RpcBudgetRow = {
  id: string;
  status: string;
  final_sale_price: number;
  expires_at: string | null;
  notes: string | null;
  rejection_reason: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  sent_at: string | null;
  tutor_name: string;
  can_respond: boolean;
};

type RpcMutationRow = {
  ok: boolean;
  code: string;
  rejection_reason?: string;
};

type RpcDetailRow = {
  dog_id: string | null;
  dog_name: string | null;
  recipe_id: string | null;
  recipe_name: string | null;
  raw_material_name: string | null;
};

const createRpcSupabase = (params: {
  budgetRow?: RpcBudgetRow | null;
  detailRows?: RpcDetailRow[];
  acceptRow?: RpcMutationRow;
  rejectRow?: RpcMutationRow;
  getError?: { message: string } | null;
  detailsError?: { message: string } | null;
  acceptError?: { message: string } | null;
  rejectError?: { message: string } | null;
}) => {
  const rpc = vi.fn(
    async (
      fn: string,
    ): Promise<{ data: unknown[]; error: { message: string } | null }> => {
      if (fn === "public_get_budget_response") {
        return {
          data: params.budgetRow ? [params.budgetRow] : [],
          error: params.getError ?? null,
        };
      }

      if (fn === "public_get_budget_response_details") {
        return {
          data: params.detailRows ?? [],
          error: params.detailsError ?? null,
        };
      }

      if (fn === "public_accept_budget") {
        return {
          data: params.acceptRow
            ? [params.acceptRow]
            : [{ ok: true, code: "updated" }],
          error: params.acceptError ?? null,
        };
      }

      if (fn === "public_reject_budget") {
        return {
          data: params.rejectRow
            ? [params.rejectRow]
            : [{ ok: true, code: "updated" }],
          error: params.rejectError ?? null,
        };
      }

      return { data: [], error: null };
    },
  );

  return { rpc };
};

const baseBudget: RpcBudgetRow = {
  id: "b-1",
  status: "sent",
  final_sale_price: 25000,
  expires_at: "2099-01-01T00:00:00.000Z",
  notes: null,
  rejection_reason: null,
  accepted_at: null,
  rejected_at: null,
  sent_at: "2026-01-01T00:00:00.000Z",
  tutor_name: "Ana Tutor",
  can_respond: true,
};

describe("budget-response/[token] load", () => {
  it("retorna error con token inválido y shape estable", async () => {
    const supabase = createRpcSupabase({ budgetRow: null });

    const result = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        params: { token: "   " },
        locals: { supabase: { rpc: supabase.rpc } },
      }),
    )) as {
      pageState: string;
      budget: null;
      recipeDetailsByDog: unknown[];
      pageMessage: { title: string };
    };

    expect(result.pageState).toBe("error");
    expect(result.budget).toBeNull();
    expect(result.recipeDetailsByDog).toEqual([]);
    expect(result.pageMessage.title).toContain("Enlace inválido");
  });

  it("retorna error cuando el presupuesto no existe", async () => {
    const supabase = createRpcSupabase({ budgetRow: null });

    const result = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        params: { token: "nonexistent-token" },
        locals: { supabase: { rpc: supabase.rpc } },
      }),
    )) as {
      pageState: string;
      budget: null;
      recipeDetailsByDog: unknown[];
      pageMessage: { title: string };
    };

    expect(result.pageState).toBe("error");
    expect(result.budget).toBeNull();
    expect(result.recipeDetailsByDog).toEqual([]);
    expect(result.pageMessage.title).toContain("no encontrado");
  });

  it("retorna presupuesto resolviendo estado expirado desde RPC", async () => {
    const supabase = createRpcSupabase({
      budgetRow: { ...baseBudget, status: "expired", can_respond: false },
    });

    const result = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        params: { token: "token-123" },
        locals: { supabase: { rpc: supabase.rpc } },
      }),
    )) as {
      pageState: string;
      budget: { status: string; canRespond: boolean };
      recipeDetailsByDog: unknown[];
    };

    expect(result.pageState).toBe("success");
    expect(result.budget.status).toBe("expired");
    expect(result.budget.canRespond).toBe(false);
    expect(result.recipeDetailsByDog).toEqual([]);
  });

  it("retorna detalle agrupado por perro y receta en success", async () => {
    const supabase = createRpcSupabase({
      budgetRow: baseBudget,
      detailRows: [
        {
          dog_id: "dog-b",
          dog_name: "Muna",
          recipe_id: "recipe-vaca",
          recipe_name: "Vaca",
          raw_material_name: "Calabaza",
        },
        {
          dog_id: "dog-a",
          dog_name: "Anita",
          recipe_id: "recipe-pollo",
          recipe_name: "Pollo",
          raw_material_name: "Pollo",
        },
        {
          dog_id: "dog-a",
          dog_name: "Anita",
          recipe_id: "recipe-pollo",
          recipe_name: "Pollo",
          raw_material_name: "Zanahoria",
        },
        {
          dog_id: "dog-a",
          dog_name: "Anita",
          recipe_id: "recipe-pollo",
          recipe_name: "Pollo",
          raw_material_name: "Pollo",
        },
        {
          dog_id: "dog-b",
          dog_name: "Muna",
          recipe_id: "recipe-pavo",
          recipe_name: "Pavo",
          raw_material_name: null,
        },
      ],
    });

    const result = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        params: { token: "token-123" },
        locals: { supabase: { rpc: supabase.rpc } },
      }),
    )) as {
      pageState: string;
      recipeDetailsByDog: Array<{
        dogId: string;
        dogName: string;
        recipes: Array<{
          recipeId: string;
          recipeName: string;
          rawMaterials: string[];
        }>;
      }>;
    };

    expect(result.pageState).toBe("success");
    expect(result.recipeDetailsByDog).toEqual([
      {
        dogId: "dog-a",
        dogName: "Anita",
        recipes: [
          {
            recipeId: "recipe-pollo",
            recipeName: "Pollo",
            rawMaterials: ["Pollo", "Zanahoria"],
          },
        ],
      },
      {
        dogId: "dog-b",
        dogName: "Muna",
        recipes: [
          {
            recipeId: "recipe-pavo",
            recipeName: "Pavo",
            rawMaterials: [],
          },
          {
            recipeId: "recipe-vaca",
            recipeName: "Vaca",
            rawMaterials: ["Calabaza"],
          },
        ],
      },
    ]);
  });

  it("si falla RPC de detalle, no rompe load y devuelve []", async () => {
    const supabase = createRpcSupabase({
      budgetRow: baseBudget,
      detailsError: { message: "detalle down" },
    });
    const warnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    const result = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        params: { token: "token-123" },
        locals: { supabase: { rpc: supabase.rpc } },
      }),
    )) as {
      pageState: string;
      budget: { id: string };
      recipeDetailsByDog: unknown[];
    };

    expect(result.pageState).toBe("success");
    expect(result.budget.id).toBe("b-1");
    expect(result.recipeDetailsByDog).toEqual([]);
    expect(warnSpy).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
  });

  it("load siempre retorna recipeDetailsByDog", async () => {
    const missingResult = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        params: { token: "missing-token" },
        locals: {
          supabase: { rpc: createRpcSupabase({ budgetRow: null }).rpc },
        },
      }),
    )) as { recipeDetailsByDog: unknown[] };

    const successResult = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        params: { token: "ok-token" },
        locals: {
          supabase: { rpc: createRpcSupabase({ budgetRow: baseBudget }).rpc },
        },
      }),
    )) as { recipeDetailsByDog: unknown[] };

    expect(Array.isArray(missingResult.recipeDetailsByDog)).toBe(true);
    expect(Array.isArray(successResult.recipeDetailsByDog)).toBe(true);
  });
});

describe("budget-response/[token] actions", () => {
  it("acepta el presupuesto cuando RPC responde updated", async () => {
    const supabase = createRpcSupabase({
      budgetRow: baseBudget,
      acceptRow: { ok: true, code: "updated" },
    });

    const result = (await actions.accept(
      asActionEvent<Parameters<(typeof actions)["accept"]>[0]>({
        params: { token: "token-123" },
        locals: { supabase: { rpc: supabase.rpc } },
      }),
    )) as { actionType: string; operatorSuccess: string };

    expect(result.actionType).toBe("accept");
    expect(result.operatorSuccess).toContain("aceptación");
  });

  it("accept devuelve 404 cuando no existe presupuesto", async () => {
    const supabase = createRpcSupabase({ budgetRow: null });

    const result = (await actions.accept(
      asActionEvent<Parameters<(typeof actions)["accept"]>[0]>({
        params: { token: "token-123" },
        locals: { supabase: { rpc: supabase.rpc } },
      }),
    )) as { status: number; data: { operatorError: string } };

    expect(result.status).toBe(404);
    expect(result.data.operatorError).toContain("No encontramos");
  });

  it("accept devuelve error claro si RPC bloquea por expirado", async () => {
    const supabase = createRpcSupabase({
      budgetRow: baseBudget,
      acceptRow: { ok: false, code: "blocked_expired" },
    });

    const result = (await actions.accept(
      asActionEvent<Parameters<(typeof actions)["accept"]>[0]>({
        params: { token: "token-123" },
        locals: { supabase: { rpc: supabase.rpc } },
      }),
    )) as { status: number; data: { operatorError: string } };

    expect(result.status).toBe(400);
    expect(result.data.operatorError).toContain("venció");
  });

  it("rechaza el presupuesto y devuelve éxito", async () => {
    const supabase = createRpcSupabase({
      budgetRow: baseBudget,
      rejectRow: {
        ok: true,
        code: "updated",
        rejection_reason: "Prefiero revisar la propuesta más adelante.",
      },
    });

    const formData = new FormData();
    formData.set(
      "rejectionReason",
      "Prefiero revisar la propuesta más adelante.",
    );

    const result = (await actions.reject(
      asActionEvent<Parameters<(typeof actions)["reject"]>[0]>({
        params: { token: "token-123" },
        locals: { supabase: { rpc: supabase.rpc } },
        request: { formData: async () => formData },
      }),
    )) as { actionType: string; operatorSuccess: string };

    expect(result.actionType).toBe("reject");
    expect(result.operatorSuccess).toContain("rechazo");
  });

  it("reject falla si el motivo supera 500 caracteres", async () => {
    const supabase = createRpcSupabase({ budgetRow: baseBudget });
    const formData = new FormData();
    formData.set("rejectionReason", "a".repeat(501));

    const result = (await actions.reject(
      asActionEvent<Parameters<(typeof actions)["reject"]>[0]>({
        params: { token: "token-123" },
        locals: { supabase: { rpc: supabase.rpc } },
        request: { formData: async () => formData },
      }),
    )) as { status: number; data: { operatorError: string } };

    expect(result.status).toBe(400);
    expect(result.data.operatorError).toContain("hasta 500");
  });

  it("reject devuelve error claro si RPC bloquea por aceptado", async () => {
    const supabase = createRpcSupabase({
      budgetRow: baseBudget,
      rejectRow: { ok: false, code: "blocked_accepted", rejection_reason: "" },
    });

    const formData = new FormData();
    formData.set("rejectionReason", "No me cierra");

    const result = (await actions.reject(
      asActionEvent<Parameters<(typeof actions)["reject"]>[0]>({
        params: { token: "token-123" },
        locals: { supabase: { rpc: supabase.rpc } },
        request: { formData: async () => formData },
      }),
    )) as { status: number; data: { operatorError: string } };

    expect(result.status).toBe(400);
    expect(result.data.operatorError).toContain("ya fue aceptado");
  });

  it("reject devuelve 404 cuando no existe presupuesto", async () => {
    const supabase = createRpcSupabase({ budgetRow: null });
    const formData = new FormData();

    const result = (await actions.reject(
      asActionEvent<Parameters<(typeof actions)["reject"]>[0]>({
        params: { token: "token-123" },
        locals: { supabase: { rpc: supabase.rpc } },
        request: { formData: async () => formData },
      }),
    )) as { status: number; data: { operatorError: string } };

    expect(result.status).toBe(404);
    expect(result.data.operatorError).toContain("No encontramos");
  });
});
