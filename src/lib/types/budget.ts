/**
 * Tipos compartidos para el dominio de presupuestos (budgets).
 */

export type BudgetStatus =
  | "draft"
  | "ready_to_send"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired"
  | "discarded"
  | "closed";
