import type { PageServerLoad } from "./$types";
import { parsePositiveInteger } from "$lib/server/forms/parsers";
import {
  buildFallbackError,
  getTableState,
  getPagination,
  applyListFilters,
} from "$lib/server/shared/list-helpers";

const EMPTY_LABELS = {
  title: "Todavía no hay recetas",
  detail: 'Creá la primera desde "Nueva receta".',
};

export const load: PageServerLoad = async ({ locals, url }) => {
  const { page, pageSize, offset } = getPagination(
    url.searchParams.get("page"),
  );
  const filters = {
    search: url.searchParams.get("q")?.trim() ?? "",
    status: url.searchParams.get("status") ?? "all",
  };

  try {
    let query = locals.supabase
      .from("recipes")
      .select(
        "id, dog_id, name, notes, is_active, created_at, dog:dogs(name)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    query = applyListFilters(query, filters, {
      searchColumn: "name",
      hasStatusFilter: true,
    });

    const { data, count, error } = await query.range(
      offset,
      offset + pageSize - 1,
    );

    if (error) throw error;

    const recipes = data ?? [];
    const total = count ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    const { tableState, tableMessage } = getTableState(
      total,
      filters,
      EMPTY_LABELS,
    );

    return {
      recipes,
      filters,
      pagination: { page, totalPages, total },
      tableState,
      tableMessage,
    };
  } catch {
    return {
      recipes: [],
      filters,
      pagination: { page: 1, totalPages: 1, total: 0 },
      tableState: "error",
      tableMessage: buildFallbackError("recetas"),
    };
  }
};
