/**
 * Pure functions for budgets pagination and filtering.
 * These are tested in budget-pagination.model.test.ts.
 */

/**
 * Builds a query-string URL that preserves all filters and sets a new page number.
 */
export const buildPaginationHref = (
  baseUrl: string,
  newPage: number,
  filters: {
    status: string;
    search: string;
    tutorId: string | null;
    sortBy?: string;
    sortDir?: "asc" | "desc";
  },
): string => {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== "all")
    params.set("status", filters.status);
  if (filters.search) params.set("q", filters.search);
  if (filters.tutorId) params.set("tutor", filters.tutorId);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortDir) params.set("sortDir", filters.sortDir);
  params.set("page", String(newPage));
  const queryString = params.toString();
  return `${baseUrl}?${queryString}`;
};

/**
 * Parses URL search params into a filter state object.
 */
export const parseBudgetFilters = (
  searchParams: URLSearchParams,
): {
  page: number;
  status: string;
  search: string;
  tutorId: string | null;
  sortBy: string;
  sortDir: "asc" | "desc";
} => {
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  return {
    page: isNaN(page) || page < 1 ? 1 : page,
    status: searchParams.get("status") ?? "all",
    search: searchParams.get("q") ?? "",
    tutorId: searchParams.get("tutor") || null,
    sortBy: searchParams.get("sortBy") ?? "tutor",
    sortDir: searchParams.get("sortDir") === "desc" ? "desc" : "asc",
  };
};

/**
 * Determines if any filter is active.
 */
export const hasActiveFilters = (filters: {
  status: string;
  search: string;
  tutorId: string | null;
}): boolean => {
  return (
    filters.status !== "all" ||
    filters.search !== "" ||
    filters.tutorId !== null
  );
};
