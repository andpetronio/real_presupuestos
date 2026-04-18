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
import { parseActionValues } from "$lib/server/budgets/parsers";
import { updateBudgetStatus } from "$lib/server/budgets/persistence";
import { sendBudgetWhatsapp } from "$lib/server/budgets/whatsapp";
import {
  acceptBudget,
  deleteBudgetDraft,
  rejectBudget,
  undoSentBudget,
} from "$lib/server/budgets/actions";
import { saveBudget } from "$lib/server/budgets/save";

const EMPTY_LABELS = {
  title: "Todavía no hay presupuestos",
  detail:
    "Creá el primero con tutor, perros, recetas y costos operativos globales.",
};

const logLoadError = (message: string, error: unknown): void => {
  if (process.env.NODE_ENV === "test") return;
  console.error(message, { error });
};

export const load: PageServerLoad = async ({ locals, url }) => {
  try {
    // Auto-expirar presupuestos vencidos (si falla, continuamos)
    try {
      await autoExpireSentBudgets(locals.supabase);
    } catch (error) {
      logLoadError("[budgets/load] Auto-expiración falló", error);
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
  } catch (error) {
    logLoadError("[budgets/load] No se pudo cargar el listado", error);
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
    return undoSentBudget({ formData, locals });
  },

  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    return deleteBudgetDraft({ formData, locals });
  },

  accept: async ({ request, locals }) => {
    const formData = await request.formData();
    return acceptBudget({ formData, locals });
  },

  reject: async ({ request, locals }) => {
    const formData = await request.formData();
    return rejectBudget({ formData, locals });
  },
};
