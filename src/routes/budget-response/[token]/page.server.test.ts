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

const createRpcSupabase = (params: {
  budgetRow?: RpcBudgetRow | null;
  acceptRow?: RpcMutationRow;
  rejectRow?: RpcMutationRow;
  getError?: { message: string } | null;
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
  it("retorna error cuando el presupuesto no existe", async () => {
    const supabase = createRpcSupabase({ budgetRow: null });

    const result = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        params: { token: "nonexistent-token" },
        locals: { supabase: { rpc: supabase.rpc } },
      }),
    )) as { pageState: string; budget: null; pageMessage: { title: string } };

    expect(result.pageState).toBe("error");
    expect(result.budget).toBeNull();
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
    };

    expect(result.pageState).toBe("success");
    expect(result.budget.status).toBe("expired");
    expect(result.budget.canRespond).toBe(false);
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
