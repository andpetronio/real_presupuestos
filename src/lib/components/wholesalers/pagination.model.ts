export const buildPaginationHref = (
  baseUrl: string,
  newPage: number,
  filters: { search: string; status: string },
): string => {
  const params = new URLSearchParams();
  if (filters.search) params.set('q', filters.search);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  params.set('page', String(newPage));
  return `${baseUrl}?${params.toString()}`;
};
