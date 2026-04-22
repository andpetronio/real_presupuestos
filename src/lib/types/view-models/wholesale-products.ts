export type WholesaleProductImageView = {
  id: string;
  public_url: string;
  sort_order: number;
  storage_path?: string;
};

export type WholesaleProductListRow = {
  id: string;
  name: string;
  presentation: string;
  price_ars: number;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  images: ReadonlyArray<WholesaleProductImageView>;
};

export type WholesaleProductFormValues = {
  name: string;
  presentation: string;
  priceArs: string;
  description: string;
};

export type WholesaleProductFormState = {
  operatorError?: string;
  operatorSuccess?: string;
  values?: WholesaleProductFormValues;
};

export type WholesaleProductsPageDataViewModel = {
  products: ReadonlyArray<WholesaleProductListRow>;
  tableState: "idle" | "success" | "error" | "empty";
  tableMessage: { title: string; detail: string } | null;
  pagination: { page: number; totalPages: number; total: number };
  filters: { search: string; status: string };
  sort: {
    sortBy: "name" | "presentation" | "price_ars" | "is_active" | "created_at";
    sortDir: "asc" | "desc";
  };
};
