export type SortDir = "asc" | "desc";

type Primitive = string | number | boolean | null | undefined;

export const getNextSortDir = (params: {
  currentSortBy: string;
  currentSortDir: SortDir;
  clickedField: string;
  defaultDir?: SortDir;
}): SortDir => {
  const {
    currentSortBy,
    currentSortDir,
    clickedField,
    defaultDir = "asc",
  } = params;

  if (currentSortBy !== clickedField) {
    return defaultDir;
  }

  return currentSortDir === "asc" ? "desc" : "asc";
};

export const buildSortHref = (params: {
  basePath: string;
  currentSortBy: string;
  currentSortDir: SortDir;
  clickedField: string;
  filters: Record<string, Primitive>;
}): string => {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params.filters)) {
    if (value === null || value === undefined || value === "") continue;
    if (value === "all") continue;
    searchParams.set(key, String(value));
  }

  searchParams.set("sortBy", params.clickedField);
  searchParams.set(
    "sortDir",
    getNextSortDir({
      currentSortBy: params.currentSortBy,
      currentSortDir: params.currentSortDir,
      clickedField: params.clickedField,
    }),
  );
  searchParams.set("page", "1");

  return `${params.basePath}?${searchParams.toString()}`;
};
