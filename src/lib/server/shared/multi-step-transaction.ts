import type { SupabaseClient } from "@supabase/supabase-js";

export type RollbackAction = () => Promise<void>;

export class MultiStepTransaction {
  private supabase: SupabaseClient;
  private completedActions: RollbackAction[] = [];

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async execute<T>(action: () => Promise<T>): Promise<T> {
    try {
      const result = await action();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  registerRollback(action: RollbackAction): void {
    this.completedActions.unshift(action);
  }

  async rollback(): Promise<void> {
    const errors: Error[] = [];
    for (const action of this.completedActions) {
      try {
        await action();
      } catch (error) {
        errors.push(error as Error);
      }
    }
    if (errors.length > 0) {
      console.error("Rollback completed with errors:", errors);
    }
  }
}

export const createTransaction = (
  supabase: SupabaseClient,
): MultiStepTransaction => {
  return new MultiStepTransaction(supabase);
};
