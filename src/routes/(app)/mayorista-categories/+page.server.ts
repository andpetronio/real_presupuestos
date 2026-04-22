import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import {
  applyListFilters,
  buildFallbackError,
  getPagination,
  getTableState,
} from "$lib/server/shared/list-helpers";
import { parseSortState } from "$lib/server/shared/sorting";
import { parseText } from "$lib/server/wholesale-backoffice/wholesalers";
import type { WholesalerCategoryListRow } from "$lib/types/view-models/wholesaler-categories";

const EMPTY_LABELS = {
  title: "Todavía no hay categorías mayoristas",
  detail: "Creá la primera categoría para clasificar mayoristas.",
};

export const load: PageServerLoad = async ({ locals, url }) => {
  const { page, pageSize, offset } = getPagination(
    url.searchParams.get("page"),
  );
  const sort = parseSortState({
    searchParams: url.searchParams,
    allowedSortBy: ["name", "is_active", "created_at"] as const,
    defaultSort: { sortBy: "name", sortDir: "asc" },
  });
  const filters = {
    search: url.searchParams.get("q")?.trim() ?? "",
    status: url.searchParams.get("status")?.trim() ?? "active",
  };

  try {
    let query = locals.supabase
      .from("wholesaler_categories")
      .select("id, name, is_active, created_at", { count: "exact" });

    query = query.order(sort.sortBy, { ascending: sort.sortDir === "asc" });
    query = query
      .order("created_at", { ascending: false })
      .order("id", { ascending: true });

    query = applyListFilters(query, filters, {
      searchColumn: "name",
      hasStatusFilter: true,
    });

    const { data, count, error } = await query.range(
      offset,
      offset + pageSize - 1,
    );
    if (error) throw error;

    const total = count ?? 0;
    const { tableState, tableMessage } = getTableState(
      total,
      filters,
      EMPTY_LABELS,
    );

    return {
      categories: (data ?? []) as WholesalerCategoryListRow[],
      filters,
      sort,
      pagination: {
        page,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        total,
      },
      tableState,
      tableMessage,
    };
  } catch {
    return {
      categories: [] as WholesalerCategoryListRow[],
      filters,
      sort: { sortBy: "name", sortDir: "asc" as const },
      pagination: { page: 1, totalPages: 1, total: 0 },
      tableState: "error" as const,
      tableMessage: buildFallbackError("categorías mayoristas"),
    };
  }
};

export const actions: Actions = {
  toggleActive: async ({ request, locals }) => {
    const formData = await request.formData();
    const id = parseText(formData.get("id"));
    const shouldActivate = parseText(formData.get("activate")) === "true";

    if (!id) {
      return fail(400, { operatorError: "No encontramos la categoría." });
    }

    const { error } = await locals.supabase
      .from("wholesaler_categories")
      .update({ is_active: shouldActivate })
      .eq("id", id);

    if (error) {
      return fail(400, {
        operatorError: "No pudimos actualizar el estado de la categoría.",
      });
    }

    return {
      operatorSuccess: shouldActivate
        ? "Categoría restaurada."
        : "Categoría desactivada.",
    };
  },
};
