import type { BudgetStatus } from "$lib/types/budget";

export type BudgetRowViewModel = {
  id: string;
  status: BudgetStatus;
  tutor: { full_name: string } | null;
  ingredient_total_global: number;
  operational_total_global: number;
  total_cost: number;
  final_sale_price: number;
  expires_at: string | null;
};

export type BudgetTutorOptionViewModel = {
  id: string;
  full_name: string;
};

export type BudgetsPageDataViewModel = {
  budgets: ReadonlyArray<BudgetRowViewModel>;
  tableState: "idle" | "success" | "error" | "empty";
  tableMessage: { title: string; detail: string } | null;
  pagination: { page: number; totalPages: number; total: number };
  filters: {
    status: BudgetStatus | "pending" | "all";
    search: string;
    tutorId: string | null;
  };
  sort: {
    sortBy:
      | "tutor"
      | "status"
      | "total_cost"
      | "final_sale_price"
      | "expires_at";
    sortDir: "asc" | "desc";
  };
  tutors: ReadonlyArray<BudgetTutorOptionViewModel>;
};

export type BudgetsActionDataViewModel = {
  actionType?: "sendWhatsapp" | "delete" | "undoSent" | "accept" | "reject";
  operatorError?: string;
  operatorSuccess?: string;
};
