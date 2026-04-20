export type AssortmentWholesalerRow = {
  id: string;
  name: string;
  unique_random_code: string;
  min_total_units: number;
  is_active: boolean;
  enabledProductsCount: number;
};

export type AssortmentProductRow = {
  id: string;
  name: string;
  presentation: string;
  is_active: boolean;
  is_enabled: boolean;
};

export type AssortmentPageDataViewModel = {
  wholesaler: {
    id: string;
    name: string;
    unique_random_code: string;
    min_total_units: number;
    is_active: boolean;
  };
  products: ReadonlyArray<AssortmentProductRow>;
  filters: { search: string; status: string; availability: string };
};
