import type { RecipeOption } from "$lib/server/budgets/queries";
import type { CompositionRow } from "$lib/server/budgets/types";

export const didTutorChange = (
  currentTutorId: string,
  nextTutorId: string,
): boolean => currentTutorId !== nextTutorId;

export const resetRowsForTutorChange = (
  rows: ReadonlyArray<CompositionRow>,
): CompositionRow[] =>
  rows.map(() => ({
    dogId: "",
    recipeId: "",
    assignedDays: "",
  }));

export const syncRowOnDogChange = (params: {
  row: CompositionRow;
  nextDogId: string;
  recipeOptions: ReadonlyArray<RecipeOption>;
}): CompositionRow => {
  const { row, nextDogId, recipeOptions } = params;

  if (row.dogId === nextDogId) return row;

  const recipeStillValid = recipeOptions.some(
    (recipe) => recipe.id === row.recipeId && recipe.dogId === nextDogId,
  );

  return {
    ...row,
    dogId: nextDogId,
    recipeId: recipeStillValid ? row.recipeId : "",
  };
};
