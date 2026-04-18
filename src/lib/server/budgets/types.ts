/**
 * Tipos específicos para el dominio de budgets en el servidor.
 *
 * Algunos tipos ya existen en otros módulos - importalos desde ahí:
 * - BudgetStatus: $lib/types/budget.ts
 * - BudgetOperationalInputs: $lib/server/budgets/calculation.ts
 * - BudgetSettingsCosts: $lib/server/budgets/calculation.ts
 * - OperatorMessage: $lib/server/shared/ui-state.ts
 */

/** Fila de composición del presupuesto desde el formulario (strings). */
export type CompositionRow = {
  dogId: string;
  recipeId: string;
  assignedDays: string;
};

/** Fila de composición parseada (números). */
export type ParsedCompositionRow = {
  dogId: string;
  recipeId: string;
  assignedDays: number;
};

/** Valores crudos del formulario de budget. */
export type ActionValues = {
  budgetId?: string;
  tutorId: string;
  budgetMonth: string;
  budgetDays: string;
  notes: string;
  vacuumBagSmallQty: string;
  vacuumBagLargeQty: string;
  labelsQty: string;
  nonWovenBagQty: string;
  laborHoursQty: string;
  cookingHoursQty: string;
  calciumQty: string;
  kefirQty: string;
  rows: Array<CompositionRow>;
};

/** Resultado de operación de guardado de budget. */
export type BudgetSaveResult =
  | {
      actionType: "create" | "update";
      operatorSuccess: string;
      values: ActionValues;
    }
  | {
      actionType: "create" | "update";
      operatorError: string;
      values: ActionValues;
      status: number;
    };

/** Resultado de enviar WhatsApp. */
export type SendWhatsappResult =
  | { ok: true; waMeUrl: string }
  | { ok: false; message: string };

/** Resultado simple de operación. */
export type OperationResult = { ok: true } | { ok: false; message: string };
