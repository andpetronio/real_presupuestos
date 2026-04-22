export type WholesalerCategoryOption = {
  id: string;
  name: string;
  is_active: boolean;
};

export type WholesalerListRow = {
  id: string;
  name: string;
  unique_random_code: string;
  min_total_units: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  category_id: string | null;
  category_name: string | null;
  tax_id: string | null;
  contact_full_name: string | null;
  contact_whatsapp: string | null;
  contact_email: string | null;
  address: string | null;
  delivery_preference: string | null;
  payment_preference: string | null;
};

export type WholesalerFormValues = {
  name: string;
  categoryId: string;
  code: string;
  minTotalUnits: string;
  taxId: string;
  contactFullName: string;
  contactWhatsapp: string;
  contactEmail: string;
  address: string;
  deliveryPreference: string;
  paymentPreference: string;
  notes: string;
};

export type WholesalerFormState = {
  operatorError?: string;
  operatorSuccess?: string;
  values?: WholesalerFormValues;
};

export type WholesalersPageDataViewModel = {
  wholesalers: ReadonlyArray<WholesalerListRow>;
  tableState: "idle" | "success" | "error" | "empty";
  tableMessage: { title: string; detail: string } | null;
  pagination: { page: number; totalPages: number; total: number };
  filters: { search: string; status: string };
  sort: {
    sortBy: "name" | "contact_full_name" | "is_active";
    sortDir: "asc" | "desc";
  };
};
