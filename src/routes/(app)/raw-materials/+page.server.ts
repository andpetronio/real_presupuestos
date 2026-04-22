import type { PageServerLoad } from "./$types";
import { parsePositiveInteger } from "$lib/server/forms/parsers";
import {
  buildFallbackError,
  getTableState,
  getPagination,
  applyListFilters,
} from "$lib/server/shared/list-helpers";
import { parseSortState } from "$lib/server/shared/sorting";

const EMPTY_LABELS = {
  title: "Todavía no hay materias primas",
  detail: 'Creá la primera desde "Nueva materia prima".',
};

export const load: PageServerLoad = async ({ locals, url }) => {
  const { page, pageSize, offset } = getPagination(
    url.searchParams.get("page"),
  );
  const sort = parseSortState({
    searchParams: url.searchParams,
    allowedSortBy: [
      "name",
      "base_unit",
      "cost_with_wastage",
      "is_active",
    ] as const,
    defaultSort: { sortBy: "name", sortDir: "asc" },
  });
  const filters = {
    search: url.searchParams.get("q")?.trim() ?? "",
    status: url.searchParams.get("status") ?? "all",
  };

  try {
    let query = locals.supabase
      .from("raw_materials")
      .select(
        "id, name, base_unit, purchase_quantity, base_cost, wastage_percentage, cost_with_wastage, is_active, created_at",
        { count: "exact" },
      );

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

    const rawMaterials = data ?? [];
    const total = count ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    const { tableState, tableMessage } = getTableState(
      total,
      filters,
      EMPTY_LABELS,
    );

    return {
      rawMaterials,
      filters,
      sort,
      pagination: { page, totalPages, total },
      tableState,
      tableMessage,
    };
  } catch {
    return {
      rawMaterials: [],
      filters,
      sort: { sortBy: "name", sortDir: "asc" as const },
      pagination: { page: 1, totalPages: 1, total: 0 },
      tableState: "error",
      tableMessage: buildFallbackError("materias primas"),
    };
  }
};
