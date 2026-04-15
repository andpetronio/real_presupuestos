import { computeOperationalTotal, type CamelCaseOperationalSettings, type OperationalInputs } from '$lib/shared/costs';

// Re-export with legacy names for backward compatibility with internal consumers.
export type { OperationalInputs as BudgetOperationalInputs };
export type { CamelCaseOperationalSettings as BudgetCamelCaseOperationalSettings };

export type BudgetSettingsCosts = CamelCaseOperationalSettings & {
  mealPlanMargin: number;
  budgetValidityDays: number;
};

export type BudgetRecipeAssignment = {
  dogId: string;
  recipeId: string;
  assignedDays: number;
};

export type RecipeDailyCost = {
  recipeId: string;
  dailyCost: number;
};

export type CalculatedDogTotals = {
  dogId: string;
  ingredientTotal: number;
  operationalTotal: number;
  totalCost: number;
  finalSalePrice: number;
};

export type BudgetCalculationResult = {
  ingredientTotal: number;
  operationalTotal: number;
  totalCost: number;
  finalSalePrice: number;
  appliedMargin: number;
  dogTotals: ReadonlyArray<CalculatedDogTotals>;
};

const roundMoney = (value: number): number => Number(value.toFixed(2));

export const calculateBudgetTotals = (input: {
  settings: BudgetSettingsCosts;
  operationals: OperationalInputs;
  assignments: ReadonlyArray<BudgetRecipeAssignment>;
  recipeDailyCosts: ReadonlyArray<RecipeDailyCost>;
}): BudgetCalculationResult => {
  const recipeDailyCostMap = new Map(input.recipeDailyCosts.map((entry) => [entry.recipeId, entry.dailyCost]));

  const ingredientByDog = new Map<string, number>();

  for (const assignment of input.assignments) {
    const recipeDailyCost = recipeDailyCostMap.get(assignment.recipeId) ?? 0;
    const subtotal = recipeDailyCost * assignment.assignedDays;
    ingredientByDog.set(assignment.dogId, (ingredientByDog.get(assignment.dogId) ?? 0) + subtotal);
  }

  const ingredientTotal = roundMoney(Array.from(ingredientByDog.values()).reduce((acc, value) => acc + value, 0));

  // Delegate to the shared pure helper — no more duplication.
  const operationalTotal = computeOperationalTotal(input.operationals, input.settings);

  const totalCost = roundMoney(ingredientTotal + operationalTotal);
  const margin = input.settings.mealPlanMargin;
  const finalSalePrice = roundMoney(totalCost / (1 - margin));

  const dogs = Array.from(ingredientByDog.entries()).map(([dogId, ingredient]) => ({
    dogId,
    ingredient: roundMoney(ingredient)
  }));

  const ingredientTotalForSplit = dogs.reduce((acc, dog) => acc + dog.ingredient, 0);

  const dogTotals: CalculatedDogTotals[] = dogs.map((dog) => {
    const ratio =
      ingredientTotalForSplit > 0 ? dog.ingredient / ingredientTotalForSplit : dogs.length > 0 ? 1 / dogs.length : 0;
    const operationalShare = roundMoney(operationalTotal * ratio);
    const total = roundMoney(dog.ingredient + operationalShare);
    return {
      dogId: dog.dogId,
      ingredientTotal: dog.ingredient,
      operationalTotal: operationalShare,
      totalCost: total,
      finalSalePrice: roundMoney(total / (1 - margin))
    };
  });

  return {
    ingredientTotal,
    operationalTotal,
    totalCost,
    finalSalePrice,
    appliedMargin: margin,
    dogTotals
  };
};
