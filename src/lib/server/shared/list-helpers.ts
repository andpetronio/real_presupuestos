import type { OperatorMessage } from "./ui-state";
import type { PostgrestFilterBuilder } from "@supabase/supabase-js";

export const DEFAULT_PAGE_SIZE = 10;

export type ListFilters = {
  search?: string;
  status?: string;
  [key: string]: string | undefined;
};

export const buildFallbackError = (
  entityLabel: string,
  actionLabel: "cargar" | "buscar" = "cargar",
): OperatorMessage => ({
  kind: "error",
  title: `No pudimos ${actionLabel} ${entityLabel}`,
  detail:
    "Reintentá en unos segundos o revisá la conexión con la base de datos.",
  actionLabel: "Reintentar",
});

export type EmptyLabels = {
  title: string;
  detail: string;
};

export type TableStateResult = {
  tableState: "success" | "empty" | "error";
  tableMessage: OperatorMessage | null;
};

export const getTableState = (
  total: number,
  filters: ListFilters,
  emptyLabels: EmptyLabels,
): TableStateResult => {
  const hasFilters = Object.values(filters).some(
    (v) => v !== undefined && v !== "" && v !== "all",
  );

  if (total === 0) {
    return {
      tableState: "empty",
      tableMessage: {
        kind: "empty",
        title: hasFilters ? "Sin resultados" : emptyLabels.title,
        detail: hasFilters
          ? `No se encontraron resultados para los filtros aplicados.`
          : emptyLabels.detail,
      },
    };
  }

  return {
    tableState: "success",
    tableMessage: null,
  };
};

export const getPagination = (
  pageParam: string | null,
  pageSize = DEFAULT_PAGE_SIZE,
) => {
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
};

export type QueryFilters = {
  search?: string;
  status?: string;
};

export function applyListFilters<
  T extends PostgrestFilterBuilder<any, any, any, any[], string, unknown>,
>(
  query: T,
  filters: QueryFilters,
  config: { searchColumn?: string; hasStatusFilter?: boolean },
): T {
  const search = filters.search?.trim() ?? "";
  if (search && config.searchColumn) {
    query = query.ilike(config.searchColumn, `%${search}%`) as T;
  }

  if (
    config.hasStatusFilter &&
    filters.status !== undefined &&
    filters.status !== "all"
  ) {
    if (filters.status === "active") {
      query = query.eq("is_active", true) as T;
    } else if (filters.status === "inactive") {
      query = query.eq("is_active", false) as T;
    }
  }

  return query;
}
