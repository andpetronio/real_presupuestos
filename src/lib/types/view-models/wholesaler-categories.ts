export type WholesalerCategoryListRow = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  wholesalers_count: number;
};

export type WholesalerCategoryFormValues = {
  name: string;
};

export type WholesalerCategoryFormState = {
  operatorError?: string;
  operatorSuccess?: string;
  values?: WholesalerCategoryFormValues;
};

export type WholesalerCategoriesPageDataViewModel = {
  categories: ReadonlyArray<WholesalerCategoryListRow>;
  tableState: "idle" | "success" | "error" | "empty";
  tableMessage: { title: string; detail: string } | null;
  pagination: { page: number; totalPages: number; total: number };
  filters: { search: string; status: string };
  sort: {
    sortBy: "name" | "is_active" | "created_at";
    sortDir: "asc" | "desc";
  };
};
