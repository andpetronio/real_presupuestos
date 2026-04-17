import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { parseFormValue } from "$lib/server/forms/parsers";
import type { OperatorMessage } from "$lib/server/shared/ui-state";
import {
  buildFallbackError,
  getPagination,
} from "$lib/server/shared/list-helpers";
import {
  hasBudgetFilters,
  parseBudgetFilters,
  resolveBudgetTableMessage,
} from "$lib/server/budgets/list";
import {
  autoExpireSentBudgets,
  loadBudgetList,
  loadEditingBudget,
  loadTutorFilterOptions,
} from "$lib/server/budgets/repository";

import type { ActionValues } from "$lib/server/budgets/types";
import { parseActionValues } from "$lib/server/budgets/parsers";
import { calculateBudgetTotals } from "$lib/server/budgets/calculation";
import {
  updateBudgetStatus,
  deleteBudget,
  getBudgetById,
  validateBudgetInput,
  getBudgetExpiry,
  persistBudget,
} from "$lib/server/budgets/persistence";
import { sendBudgetWhatsapp } from "$lib/server/budgets/whatsapp";

const toOperatorError = (
  action: "create" | "update",
  values: ActionValues,
  message: string,
  status = 400,
) =>
  fail(status, {
    actionType: action,
    operatorError: message,
    values,
  });

type BudgetLifecycleAction = "undoSent" | "delete" | "accept" | "reject";

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
  locals: { supabase: import("@supabase/supabase-js").SupabaseClient };
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

const getBlankValues = (): ActionValues => ({
  budgetId: "",
  tutorId: "",
  budgetMonth: "",
  budgetDays: "",
  notes: "",
  vacuumBagSmallQty: "",
  vacuumBagLargeQty: "",
  labelsQty: "",
  nonWovenBagQty: "",
  laborHoursQty: "",
  cookingHoursQty: "",
  calciumQty: "",
  kefirQty: "",
  rows: [{ dogId: "", recipeId: "", assignedDays: "" }],
});

const saveBudget = async (params: {
  action: "create" | "update";
  values: ActionValues;
  locals: { supabase: import("@supabase/supabase-js").SupabaseClient };
}) => {
  const { action, values, locals } = params;

  const validation = await validateBudgetInput({
    values,
    supabase: locals.supabase,
  });
  if (!validation.valid) {
    return toOperatorError(action, values, validation.operatorError);
  }

  const calculation = calculateBudgetTotals({
    settings: validation.settings,
    operationals: validation.operationals,
    assignments: validation.composition,
    recipeDailyCosts: validation.recipeDailyCosts,
  });

  const expiry = await getBudgetExpiry({
    action,
    budgetId: values.budgetId,
    settingsValidityDays: validation.settings.budgetValidityDays ?? 7,
    values,
    supabase: locals.supabase,
  });
  if (!expiry.ok) {
    return toOperatorError(action, values, expiry.operatorError);
  }

  const persistence = await persistBudget({
    action,
    budgetId: values.budgetId ?? "",
    values,
    tutorId: validation.tutorId,
    referenceMonth: validation.referenceMonth,
    referenceDays: validation.referenceDays,
    notes: values.notes || null,
    expiresAt: expiry.expiresAt,
    calculation,
    operationals: validation.operationals,
    settings: validation.settings,
    composition: validation.composition,
    supabase: locals.supabase,
  });

  if (!persistence.ok) {
    return toOperatorError(action, values, persistence.operatorError);
  }

  return {
    actionType: action,
    operatorSuccess:
      action === "create"
        ? "Presupuesto borrador creado correctamente."
        : "Borrador actualizado correctamente.",
    values: getBlankValues(),
  };
};

const EMPTY_LABELS = {
  title: "Todavía no hay presupuestos",
  detail:
    "Creá el primero con tutor, perros, recetas y costos operativos globales.",
};

export const load: PageServerLoad = async ({ locals, url }) => {
  try {
    // Auto-expirar presupuestos vencidos (si falla, continuamos)
    try {
      await autoExpireSentBudgets(locals.supabase);
    } catch {
      // Si falla la expiración automática no frenamos la carga del dashboard.
    }

    const editingBudgetId = url.searchParams.get("edit");

    const { page, pageSize, offset } = getPagination(
      url.searchParams.get("page"),
    );

    const filters = parseBudgetFilters(url);

    const [{ budgets, total }, { editingBudget, editingRows }, tutors] =
      await Promise.all([
        loadBudgetList({
          supabase: locals.supabase,
          filters,
          offset,
          pageSize,
        }),
        loadEditingBudget({
          supabase: locals.supabase,
          editingBudgetId,
        }),
        loadTutorFilterOptions(locals.supabase),
      ]);

    const totalPages = Math.ceil(total / pageSize);

    const hasFilters = hasBudgetFilters(filters);
    const { tableState, tableMessage } = resolveBudgetTableMessage({
      total,
      hasFilters,
      emptyLabels: EMPTY_LABELS,
    });

    return {
      budgets,
      editingBudget,
      editingRows,
      tableState,
      tableMessage,
      pagination: { page, totalPages, total },
      filters,
      tutors,
    };
  } catch {
    return {
      budgets: [],
      editingBudget: null,
      editingRows: [],
      tableState: "error",
      tableMessage: buildFallbackError("presupuestos"),
      pagination: { page: 1, totalPages: 1, total: 0 },
      filters: { status: "all" as const, search: "", tutorId: null },
      tutors: [],
    };
  }
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    return saveBudget({
      action: "create",
      values: parseActionValues(formData),
      locals,
    });
  },

  update: async ({ request, locals }) => {
    const formData = await request.formData();
    return saveBudget({
      action: "update",
      values: parseActionValues(formData),
      locals,
    });
  },

  sendWhatsapp: async ({ request, locals, url }) => {
    const formData = await request.formData();
    const budgetId = parseFormValue(formData.get("budgetId"));

    if (!budgetId) {
      return fail(400, {
        actionType: "sendWhatsapp",
        operatorError: "No encontramos qué presupuesto enviar por WhatsApp.",
      });
    }

    const result = await sendBudgetWhatsapp({
      budgetId,
      supabase: locals.supabase,
      origin: url.origin,
      userAgent: request.headers?.get?.("user-agent") ?? null,
    });

    if (!result.ok) {
      return fail(400, {
        actionType: "sendWhatsapp",
        operatorError: result.message,
      });
    }

    throw redirect(303, result.waMeUrl);
  },

  undoSent: async ({ request, locals }) => {
    const formData = await request.formData();
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
      actionType: "undoSent",
      operatorSuccess: "Presupuesto reabierto en borrador.",
    };
  },

  delete: async ({ request, locals }) => {
    const formData = await request.formData();
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
      actionType: "delete",
      operatorSuccess: "Presupuesto eliminado correctamente.",
    };
  },

  accept: async ({ request, locals }) => {
    const formData = await request.formData();
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
      actionType: "accept",
      operatorSuccess: "Presupuesto aceptado correctamente.",
    };
  },

  reject: async ({ request, locals }) => {
    const formData = await request.formData();
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
      actionType: "reject",
      operatorSuccess: "Presupuesto rechazado correctamente.",
    };
  },
};
