import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { parseFormValue } from "$lib/server/forms/parsers";
import type { OperatorMessage } from "$lib/server/shared/ui-state";
import type { BudgetStatus } from "$lib/types/budget";
import {
  buildFallbackError,
  getPagination,
} from "$lib/server/shared/list-helpers";

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
      await locals.supabase
        .from("budgets")
        .update({ status: "expired" })
        .eq("status", "sent")
        .lte("expires_at", new Date().toISOString());
    } catch {
      // Si falla la expiración automática no frenamos la carga del dashboard.
    }

    const editingBudgetId = url.searchParams.get("edit");

    const { page, pageSize, offset } = getPagination(
      url.searchParams.get("page"),
    );

    const statusParam = url.searchParams.get("status") as
      | BudgetStatus
      | "pending"
      | "all"
      | null;
    const searchQuery = url.searchParams.get("q")?.trim() ?? "";
    const tutorIdParam = url.searchParams.get("tutor");

    const filters = {
      status: statusParam ?? "all",
      search: searchQuery,
      tutorId: tutorIdParam ?? null,
    };

    let query = locals.supabase
      .from("budgets")
      .select(
        "id, status, tutor_id, reference_month, reference_days, notes, final_sale_price, total_cost, ingredient_total_global, operational_total_global, created_at, expires_at, tutor:tutors(full_name)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    // Status filter — "pending" maps to draft + ready_to_send
    if (statusParam && statusParam !== "all") {
      if (statusParam === "pending") {
        query = query.in("status", ["draft", "ready_to_send"]);
      } else {
        query = query.eq("status", statusParam);
      }
    }

    // Tutor filter
    if (tutorIdParam) {
      query = query.eq("tutor_id", tutorIdParam);
    }

    // Search by tutor name
    if (searchQuery) {
      query = query.ilike("tutor:full_name", `%${searchQuery}%`);
    }

    const {
      data: budgetsResult,
      count,
      error: budgetsError,
    } = await query.range(offset, offset + pageSize - 1);

    if (budgetsError) throw budgetsError;

    const budgets = budgetsResult ?? [];
    const total = count ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    // Editing budget (fetched separately so it always loads regardless of filters)
    let editingBudget = null;
    let editingRows: Array<{
      dogId: string;
      recipeId: string;
      assignedDays: string;
    }> = [];
    if (editingBudgetId) {
      const { data: editingBudgetData } = await locals.supabase
        .from("budgets")
        .select(
          "id, status, tutor_id, reference_month, reference_days, notes, final_sale_price, total_cost, ingredient_total_global, operational_total_global, created_at, expires_at, tutor:tutors(full_name)",
        )
        .eq("id", editingBudgetId)
        .single();
      editingBudget = editingBudgetData ?? null;

      if (editingBudgetId) {
        const { data: budgetDogRecipesData, error: budgetDogRecipesError } =
          await locals.supabase
            .from("budget_dog_recipes")
            .select(
              "budget_dog_id, recipe_id, assigned_days, budget_dog:budget_dogs(dog_id)",
            )
            .eq("budget_dog.budget_id", editingBudgetId)
            .order("created_at", { ascending: true });

        if (budgetDogRecipesError) throw budgetDogRecipesError;

        editingRows = (budgetDogRecipesData ?? []).map((row) => ({
          dogId: (row.budget_dog as { dog_id?: string } | null)?.dog_id ?? "",
          recipeId: row.recipe_id,
          assignedDays: String(row.assigned_days),
        }));
      }
    }

    // Load tutors for filter dropdown
    const { data: tutorsResult } = await locals.supabase
      .from("tutors")
      .select("id, full_name")
      .order("full_name", { ascending: true });

    const hasFilters =
      statusParam !== null || searchQuery !== "" || tutorIdParam !== null;
    const tableState = total > 0 ? "success" : "empty";
    const tableMessage =
      total > 0
        ? null
        : {
            kind: "empty" as const,
            title: hasFilters ? "Sin resultados" : EMPTY_LABELS.title,
            detail: hasFilters
              ? "No se encontraron presupuestos para los filtros aplicados. Probá modificar o limpiar los filtros."
              : EMPTY_LABELS.detail,
          };

    return {
      budgets,
      editingBudget,
      editingRows,
      tableState,
      tableMessage,
      pagination: { page, totalPages, total },
      filters,
      tutors: tutorsResult ?? [],
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
    const budgetId = parseFormValue(formData.get("budgetId"));

    if (!budgetId) {
      return fail(400, {
        actionType: "undoSent",
        operatorError: "No encontramos el presupuesto a reabrir.",
      });
    }

    const budget = await getBudgetById({ budgetId, supabase: locals.supabase });
    if (!budget) {
      return fail(400, {
        actionType: "undoSent",
        operatorError: "No encontramos el presupuesto a reabrir.",
      });
    }

    if (budget.status !== "sent") {
      return fail(400, {
        actionType: "undoSent",
        operatorError: "Solo podés reabrir presupuestos en estado enviado.",
      });
    }

    const result = await updateBudgetStatus({
      budgetId,
      supabase: locals.supabase,
      status: "draft",
      extraFields: { sent_at: null },
    });

    if (!result.ok) {
      return fail(400, {
        actionType: "undoSent",
        operatorError: result.message,
      });
    }

    return {
      actionType: "undoSent",
      operatorSuccess: "Presupuesto reabierto en borrador.",
    };
  },

  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const budgetId = parseFormValue(formData.get("budgetId"));

    if (!budgetId) {
      return fail(400, {
        actionType: "delete",
        operatorError: "No encontramos el presupuesto a eliminar.",
      });
    }

    const budget = await getBudgetById({ budgetId, supabase: locals.supabase });
    if (!budget) {
      return fail(400, {
        actionType: "delete",
        operatorError: "No encontramos el presupuesto a eliminar.",
      });
    }

    if (budget.status !== "draft") {
      return fail(400, {
        actionType: "delete",
        operatorError:
          "Solo se pueden eliminar presupuestos en estado borrador.",
      });
    }

    const result = await deleteBudget({ budgetId, supabase: locals.supabase });
    if (!result.ok) {
      return fail(400, {
        actionType: "delete",
        operatorError: result.message,
      });
    }

    return {
      actionType: "delete",
      operatorSuccess: "Presupuesto eliminado correctamente.",
    };
  },

  accept: async ({ request, locals }) => {
    const formData = await request.formData();
    const budgetId = parseFormValue(formData.get("budgetId"));

    if (!budgetId) {
      return fail(400, {
        actionType: "accept",
        operatorError: "No encontramos el presupuesto a aceptar.",
      });
    }

    const budget = await getBudgetById({ budgetId, supabase: locals.supabase });
    if (!budget) {
      return fail(400, {
        actionType: "accept",
        operatorError: "No encontramos el presupuesto a aceptar.",
      });
    }

    if (budget.status !== "sent") {
      return fail(400, {
        actionType: "accept",
        operatorError: "Solo se pueden aceptar presupuestos en estado enviado.",
      });
    }

    const now = new Date().toISOString();
    const result = await updateBudgetStatus({
      budgetId,
      supabase: locals.supabase,
      status: "accepted",
      extraFields: { accepted_at: now, viewed_at: now },
    });

    if (!result.ok) {
      return fail(400, {
        actionType: "accept",
        operatorError: result.message,
      });
    }

    return {
      actionType: "accept",
      operatorSuccess: "Presupuesto aceptado correctamente.",
    };
  },

  reject: async ({ request, locals }) => {
    const formData = await request.formData();
    const budgetId = parseFormValue(formData.get("budgetId"));

    if (!budgetId) {
      return fail(400, {
        actionType: "reject",
        operatorError: "No encontramos el presupuesto a rechazar.",
      });
    }

    const budget = await getBudgetById({ budgetId, supabase: locals.supabase });
    if (!budget) {
      return fail(400, {
        actionType: "reject",
        operatorError: "No encontramos el presupuesto a rechazar.",
      });
    }

    if (budget.status !== "sent") {
      return fail(400, {
        actionType: "reject",
        operatorError:
          "Solo se pueden rechazar presupuestos en estado enviado.",
      });
    }

    const result = await updateBudgetStatus({
      budgetId,
      supabase: locals.supabase,
      status: "rejected",
      extraFields: { rejected_at: new Date().toISOString() },
    });

    if (!result.ok) {
      return fail(400, {
        actionType: "reject",
        operatorError: result.message,
      });
    }

    return {
      actionType: "reject",
      operatorSuccess: "Presupuesto rechazado correctamente.",
    };
  },
};
