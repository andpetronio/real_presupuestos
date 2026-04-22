export type SortDir = "asc" | "desc";

export type SortState<TField extends string> = {
  sortBy: TField;
  sortDir: SortDir;
};

const isSortDir = (value: string | null | undefined): value is SortDir =>
  value === "asc" || value === "desc";

export const parseSortState = <TField extends string>(params: {
  searchParams: URLSearchParams;
  allowedSortBy: ReadonlyArray<TField>;
  defaultSort: SortState<TField>;
}): SortState<TField> => {
  const { searchParams, allowedSortBy, defaultSort } = params;

  const sortByParam = searchParams.get("sortBy");
  const sortDirParam = searchParams.get("sortDir");

  const sortBy = allowedSortBy.includes(sortByParam as TField)
    ? (sortByParam as TField)
    : defaultSort.sortBy;

  const sortDir = isSortDir(sortDirParam) ? sortDirParam : defaultSort.sortDir;

  return {
    sortBy,
    sortDir,
  };
};

export const toggleSortState = <TField extends string>(params: {
  current: SortState<TField>;
  clickedField: TField;
  defaultDir?: SortDir;
}): SortState<TField> => {
  const { current, clickedField, defaultDir = "asc" } = params;

  if (current.sortBy !== clickedField) {
    return {
      sortBy: clickedField,
      sortDir: defaultDir,
    };
  }

  return {
    sortBy: clickedField,
    sortDir: current.sortDir === "asc" ? "desc" : "asc",
  };
};
