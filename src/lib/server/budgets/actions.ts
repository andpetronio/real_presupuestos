import { fail } from "@sveltejs/kit";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseFormValue } from "$lib/server/forms/parsers";
import {
  deleteBudget,
  getBudgetById,
  updateBudgetStatus,
} from "$lib/server/budgets/persistence";

type BudgetLifecycleAction = "undoSent" | "delete" | "accept" | "reject";

type LocalsLike = { supabase: SupabaseClient };

const toLifecycleError = (
  actionType: BudgetLifecycleAction,
  operatorError: string,
) =>
  fail(400, {
    actionType,
    operatorError,
  });

const getBudgetIdFromForm = (params: {
  formData: FormData;
  actionType: BudgetLifecycleAction;
  missingMessage: string;
}):
  | { ok: true; budgetId: string }
  | { ok: false; response: ReturnType<typeof fail> } => {
  const { formData, actionType, missingMessage } = params;
  const budgetId = parseFormValue(formData.get("budgetId"));

  if (!budgetId) {
    return {
      ok: false,
      response: toLifecycleError(actionType, missingMessage),
    };
  }

  return { ok: true, budgetId };
};

const getBudgetForLifecycleAction = async (params: {
  budgetId: string;
  actionType: BudgetLifecycleAction;
  notFoundMessage: string;
  locals: LocalsLike;
}) => {
  const { budgetId, actionType, notFoundMessage, locals } = params;
  const budget = await getBudgetById({ budgetId, supabase: locals.supabase });

  if (!budget) {
    return {
      ok: false as const,
      response: toLifecycleError(actionType, notFoundMessage),
    };
  }

  return {
    ok: true as const,
    budget,
  };
};

export const undoSentBudget = async (params: {
  formData: FormData;
  locals: LocalsLike;
}) => {
  const { formData, locals } = params;
  const budgetIdResult = getBudgetIdFromForm({
    formData,
    actionType: "undoSent",
    missingMessage: "No encontramos el presupuesto a reabrir.",
  });
  if (!budgetIdResult.ok) return budgetIdResult.response;

  const budgetResult = await getBudgetForLifecycleAction({
    budgetId: budgetIdResult.budgetId,
    actionType: "undoSent",
    notFoundMessage: "No encontramos el presupuesto a reabrir.",
    locals,
  });
  if (!budgetResult.ok) return budgetResult.response;

  if (budgetResult.budget.status !== "sent") {
    return toLifecycleError(
      "undoSent",
      "Solo podés reabrir presupuestos en estado enviado.",
    );
  }

  const result = await updateBudgetStatus({
    budgetId: budgetIdResult.budgetId,
    supabase: locals.supabase,
    status: "draft",
    extraFields: { sent_at: null },
  });

  if (!result.ok) {
    return toLifecycleError("undoSent", result.message);
  }

  return {
    actionType: "undoSent" as const,
    operatorSuccess: "Presupuesto reabierto en borrador.",
  };
};

export const deleteBudgetDraft = async (params: {
  formData: FormData;
  locals: LocalsLike;
}) => {
  const { formData, locals } = params;
  const budgetIdResult = getBudgetIdFromForm({
    formData,
    actionType: "delete",
    missingMessage: "No encontramos el presupuesto a eliminar.",
  });
  if (!budgetIdResult.ok) return budgetIdResult.response;

  const budgetResult = await getBudgetForLifecycleAction({
    budgetId: budgetIdResult.budgetId,
    actionType: "delete",
    notFoundMessage: "No encontramos el presupuesto a eliminar.",
    locals,
  });
  if (!budgetResult.ok) return budgetResult.response;

  if (budgetResult.budget.status !== "draft") {
    return toLifecycleError(
      "delete",
      "Solo se pueden eliminar presupuestos en estado borrador.",
    );
  }

  const result = await deleteBudget({
    budgetId: budgetIdResult.budgetId,
    supabase: locals.supabase,
  });
  if (!result.ok) {
    return toLifecycleError("delete", result.message);
  }

  return {
    actionType: "delete" as const,
    operatorSuccess: "Presupuesto eliminado correctamente.",
  };
};

export const acceptBudget = async (params: {
  formData: FormData;
  locals: LocalsLike;
}) => {
  const { formData, locals } = params;
  const budgetIdResult = getBudgetIdFromForm({
    formData,
    actionType: "accept",
    missingMessage: "No encontramos el presupuesto a aceptar.",
  });
  if (!budgetIdResult.ok) return budgetIdResult.response;

  const budgetResult = await getBudgetForLifecycleAction({
    budgetId: budgetIdResult.budgetId,
    actionType: "accept",
    notFoundMessage: "No encontramos el presupuesto a aceptar.",
    locals,
  });
  if (!budgetResult.ok) return budgetResult.response;

  if (budgetResult.budget.status !== "sent") {
    return toLifecycleError(
      "accept",
      "Solo se pueden aceptar presupuestos en estado enviado.",
    );
  }

  const now = new Date().toISOString();
  const result = await updateBudgetStatus({
    budgetId: budgetIdResult.budgetId,
    supabase: locals.supabase,
    status: "accepted",
    extraFields: { accepted_at: now, viewed_at: now },
  });

  if (!result.ok) {
    return toLifecycleError("accept", result.message);
  }

  return {
    actionType: "accept" as const,
    operatorSuccess: "Presupuesto aceptado correctamente.",
  };
};

export const rejectBudget = async (params: {
  formData: FormData;
  locals: LocalsLike;
}) => {
  const { formData, locals } = params;
  const budgetIdResult = getBudgetIdFromForm({
    formData,
    actionType: "reject",
    missingMessage: "No encontramos el presupuesto a rechazar.",
  });
  if (!budgetIdResult.ok) return budgetIdResult.response;

  const budgetResult = await getBudgetForLifecycleAction({
    budgetId: budgetIdResult.budgetId,
    actionType: "reject",
    notFoundMessage: "No encontramos el presupuesto a rechazar.",
    locals,
  });
  if (!budgetResult.ok) return budgetResult.response;

  if (budgetResult.budget.status !== "sent") {
    return toLifecycleError(
      "reject",
      "Solo se pueden rechazar presupuestos en estado enviado.",
    );
  }

  const result = await updateBudgetStatus({
    budgetId: budgetIdResult.budgetId,
    supabase: locals.supabase,
    status: "rejected",
    extraFields: { rejected_at: new Date().toISOString() },
  });

  if (!result.ok) {
    return toLifecycleError("reject", result.message);
  }

  return {
    actionType: "reject" as const,
    operatorSuccess: "Presupuesto rechazado correctamente.",
  };
};
