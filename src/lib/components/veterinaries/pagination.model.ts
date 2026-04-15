/**
 * Pure functions for veterinarians pagination and filtering.
 */

/**
 * Builds a query-string URL that preserves all filters and sets a new page number.
 */
export const buildPaginationHref = (
  baseUrl: string,
  newPage: number,
  filters: { search: string }
): string => {
  const params = new URLSearchParams();
  if (filters.search) params.set('q', filters.search);
  params.set('page', String(newPage));
  const queryString = params.toString();
  return `${baseUrl}?${queryString}`;
};

/**
 * Determines if any filter is active.
 */
export const hasActiveFilters = (filters: { search: string }): boolean => {
  return filters.search !== '';
};