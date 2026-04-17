export type DogRowViewModel = {
  id: string;
  name: string;
  diet_type: "mixta" | "cocida" | "barf";
  meals_per_day: number;
  is_active: boolean;
  tutor: { full_name: string } | null;
  veterinary: { name: string } | null;
};

export type DogsPageDataViewModel = {
  dogs: ReadonlyArray<DogRowViewModel>;
  tableState: "idle" | "success" | "error" | "empty";
  tableMessage: { title: string; detail: string } | null;
  pagination: { page: number; totalPages: number; total: number };
  filters: {
    search: string;
    status: string;
  };
};

export type DogsActionDataViewModel = {
  actionType?: "delete";
  operatorError?: string;
  operatorSuccess?: string;
};
