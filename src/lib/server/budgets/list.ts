import type { PostgrestFilterBuilder } from "@supabase/supabase-js";
import type { BudgetStatus } from "$lib/types/budget";

export type BudgetListStatusFilter = BudgetStatus | "pending" | "all";

const allowedStatusFilters = new Set<BudgetListStatusFilter>([
  "all",
  "pending",
  "draft",
  "ready_to_send",
  "sent",
  "accepted",
  "rejected",
  "expired",
  "discarded",
  "closed",
]);

export type BudgetListFilters = {
  status: BudgetListStatusFilter;
  search: string;
  tutorId: string | null;
};

export type BudgetTableMessage = {
  kind: "empty";
  title: string;
  detail: string;
};

export const parseBudgetFilters = (url: URL): BudgetListFilters => {
  const statusParam = url.searchParams.get("status");
  const status =
    statusParam &&
    allowedStatusFilters.has(statusParam as BudgetListStatusFilter)
      ? (statusParam as BudgetListStatusFilter)
      : "all";

  return {
    status,
    search: url.searchParams.get("q")?.trim() ?? "",
    tutorId: url.searchParams.get("tutor"),
  };
};

export function applyBudgetListFilters<
  T extends PostgrestFilterBuilder<any, any, any, any[], string, unknown>,
>(query: T, filters: BudgetListFilters): T {
  if (filters.status !== "all") {
    if (filters.status === "pending") {
      query = query.in("status", ["draft", "ready_to_send"]) as T;
    } else {
      query = query.eq("status", filters.status) as T;
    }
  }

  if (filters.tutorId) {
    query = query.eq("tutor_id", filters.tutorId) as T;
  }

  if (filters.search) {
    query = query.ilike("tutor:full_name", `%${filters.search}%`) as T;
  }

  return query;
}

export const hasBudgetFilters = (filters: BudgetListFilters): boolean =>
  filters.status !== "all" || filters.search !== "" || filters.tutorId !== null;

export const resolveBudgetTableMessage = (params: {
  total: number;
  hasFilters: boolean;
  emptyLabels: { title: string; detail: string };
}): {
  tableState: "success" | "empty";
  tableMessage: BudgetTableMessage | null;
} => {
  const { total, hasFilters, emptyLabels } = params;
  if (total > 0) {
    return {
      tableState: "success",
      tableMessage: null,
    };
  }

  return {
    tableState: "empty",
    tableMessage: {
      kind: "empty",
      title: hasFilters ? "Sin resultados" : emptyLabels.title,
      detail: hasFilters
        ? "No se encontraron presupuestos para los filtros aplicados. Probá modificar o limpiar los filtros."
        : emptyLabels.detail,
    },
  };
};
