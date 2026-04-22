/**
 * Pure functions for raw materials pagination and filtering.
 */

/**
 * Builds a query-string URL that preserves all filters and sets a new page number.
 */
export const buildPaginationHref = (
  baseUrl: string,
  newPage: number,
  filters: {
    search: string;
    status: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
  },
): string => {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.status && filters.status !== "all")
    params.set("status", filters.status);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortDir) params.set("sortDir", filters.sortDir);
  params.set("page", String(newPage));
  const queryString = params.toString();
  return `${baseUrl}?${queryString}`;
};

/**
 * Determines if any filter is active.
 */
export const hasActiveFilters = (filters: {
  search: string;
  status: string;
}): boolean => {
  return filters.search !== "" || filters.status !== "all";
};
