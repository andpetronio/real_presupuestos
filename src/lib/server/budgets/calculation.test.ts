import { describe, it, expect } from "vitest";
import {
  calculateBudgetTotals,
  type BudgetSettingsCosts,
  type BudgetRecipeAssignment,
  type RecipeDailyCost,
  type CalculatedDogTotals,
} from "./calculation";
import {
  computeOperationalTotal,
  type CamelCaseOperationalSettings,
  type OperationalInputs,
} from "$lib/shared/costs";

const defaultSettings: BudgetSettingsCosts = {
  vacuumBagSmallUnitCost: 100,
  vacuumBagLargeUnitCost: 200,
  labelUnitCost: 5,
  nonWovenBagUnitCost: 50,
  laborHourCost: 500,
  cookingHourCost: 600,
  calciumUnitCost: 10,
  kefirUnitCost: 15,
  mealPlanMargin: 0.2,
  budgetValidityDays: 7,
};

const defaultOperationals: OperationalInputs = {
  vacuumBagSmallQty: 0,
  vacuumBagLargeQty: 0,
  labelsQty: 0,
  nonWovenBagQty: 0,
  laborHoursQty: 0,
  cookingHoursQty: 0,
  calciumQty: 0,
  kefirQty: 0,
};

describe("calculateBudgetTotals", () => {
  describe("basic calculation — single dog, single recipe, no operational costs, 20% margin", () => {
    it("verifies finalSalePrice = totalCost / (1 - margin)", () => {
      const assignments: ReadonlyArray<BudgetRecipeAssignment> = [
        { dogId: "d-1", recipeId: "r-1", assignedDays: 10 },
      ];
      const recipeDailyCosts: ReadonlyArray<RecipeDailyCost> = [
        { recipeId: "r-1", dailyCost: 50 },
      ];

      const result = calculateBudgetTotals({
        settings: { ...defaultSettings, mealPlanMargin: 0.2 },
        operationals: defaultOperationals,
        assignments,
        recipeDailyCosts,
      });

      // 10 days * $50/day = $500 ingredient total
      expect(result.ingredientTotal).toBe(500);
      // No operationals
      expect(result.operationalTotal).toBe(0);
      // $500 + $0 = $500
      expect(result.totalCost).toBe(500);
      // $500 / (1 - 0.20) = $625
      expect(result.finalSalePrice).toBe(625);
      expect(result.appliedMargin).toBe(0.2);
    });

    it("single dog gets all operational cost", () => {
      const assignments: ReadonlyArray<BudgetRecipeAssignment> = [
        { dogId: "d-1", recipeId: "r-1", assignedDays: 5 },
      ];
      const recipeDailyCosts: ReadonlyArray<RecipeDailyCost> = [
        { recipeId: "r-1", dailyCost: 100 },
      ];
      const operationals: OperationalInputs = {
        vacuumBagSmallQty: 1,
        vacuumBagLargeQty: 0,
        labelsQty: 0,
        nonWovenBagQty: 0,
        laborHoursQty: 0,
        cookingHoursQty: 0,
        calciumQty: 0,
        kefirQty: 0,
      };

      const result = calculateBudgetTotals({
        settings: defaultSettings,
        operationals,
        assignments,
        recipeDailyCosts,
      });

      // 5 days * $100 = $500 ingredient
      expect(result.ingredientTotal).toBe(500);
      // 1 * $100 = $100 operational
      expect(result.operationalTotal).toBe(100);
      // $500 + $100 = $600 total
      expect(result.totalCost).toBe(600);
      // $600 / 0.8 = $750
      expect(result.finalSalePrice).toBe(750);
    });
  });

  describe("multiple dogs — operational cost split proportionally by ingredient weight", () => {
    it("splits operational cost proportionally by ingredient ratio", () => {
      const assignments: ReadonlyArray<BudgetRecipeAssignment> = [
        { dogId: "d-1", recipeId: "r-1", assignedDays: 10 }, // $500
        { dogId: "d-2", recipeId: "r-2", assignedDays: 5 }, // $250
      ];
      const recipeDailyCosts: ReadonlyArray<RecipeDailyCost> = [
        { recipeId: "r-1", dailyCost: 50 },
        { recipeId: "r-2", dailyCost: 50 },
      ];
      const operationals: OperationalInputs = {
        vacuumBagSmallQty: 0,
        vacuumBagLargeQty: 0,
        labelsQty: 0,
        nonWovenBagQty: 0,
        laborHoursQty: 1, // $500
        cookingHoursQty: 0,
        calciumQty: 0,
        kefirQty: 0,
      };

      const result = calculateBudgetTotals({
        settings: defaultSettings,
        operationals,
        assignments,
        recipeDailyCosts,
      });

      // d-1: 10 * 50 = $500; d-2: 5 * 50 = $250 → total = $750
      expect(result.ingredientTotal).toBe(750);
      expect(result.operationalTotal).toBe(500);

      // ratio d-1 = 500/750 = 2/3; ratio d-2 = 250/750 = 1/3
      // d-1 ops = 500 * 2/3 = 333.33; d-2 ops = 500 * 1/3 = 166.67
      const dogTotals = result.dogTotals as unknown as CalculatedDogTotals[];
      const d1 = dogTotals.find((d) => d.dogId === "d-1")!;
      const d2 = dogTotals.find((d) => d.dogId === "d-2")!;

      expect(d1.ingredientTotal).toBe(500);
      expect(d2.ingredientTotal).toBe(250);
      expect(d1.operationalTotal).toBeCloseTo(333.33, 2);
      expect(d2.operationalTotal).toBeCloseTo(166.67, 2);
    });
  });

  describe("operational total delegation", () => {
    it("operationalTotal matches what computeOperationalTotal produces", () => {
      const assignments: ReadonlyArray<BudgetRecipeAssignment> = [
        { dogId: "d-1", recipeId: "r-1", assignedDays: 7 },
      ];
      const recipeDailyCosts: ReadonlyArray<RecipeDailyCost> = [
        { recipeId: "r-1", dailyCost: 30 },
      ];
      const operationals: OperationalInputs = {
        vacuumBagSmallQty: 2,
        vacuumBagLargeQty: 1,
        labelsQty: 5,
        nonWovenBagQty: 2,
        laborHoursQty: 3,
        cookingHoursQty: 2,
        calciumQty: 1,
        kefirQty: 1,
      };

      const expectedOps = computeOperationalTotal(
        operationals,
        defaultSettings,
      );

      const result = calculateBudgetTotals({
        settings: defaultSettings,
        operationals,
        assignments,
        recipeDailyCosts,
      });

      expect(result.operationalTotal).toBe(expectedOps);
    });
  });

  describe("dog totals structure", () => {
    it("each dog has all required fields", () => {
      const assignments: ReadonlyArray<BudgetRecipeAssignment> = [
        { dogId: "d-1", recipeId: "r-1", assignedDays: 4 },
      ];
      const recipeDailyCosts: ReadonlyArray<RecipeDailyCost> = [
        { recipeId: "r-1", dailyCost: 25 },
      ];

      const result = calculateBudgetTotals({
        settings: defaultSettings,
        operationals: defaultOperationals,
        assignments,
        recipeDailyCosts,
      });

      const dog = (result.dogTotals as unknown as CalculatedDogTotals[])[0];
      expect(dog).toHaveProperty("dogId");
      expect(dog).toHaveProperty("ingredientTotal");
      expect(dog).toHaveProperty("operationalTotal");
      expect(dog).toHaveProperty("totalCost");
      expect(dog).toHaveProperty("finalSalePrice");
    });

    it("each dog finalSalePrice = dog totalCost / (1 - margin)", () => {
      const assignments: ReadonlyArray<BudgetRecipeAssignment> = [
        { dogId: "d-1", recipeId: "r-1", assignedDays: 5 },
      ];
      const recipeDailyCosts: ReadonlyArray<RecipeDailyCost> = [
        { recipeId: "r-1", dailyCost: 100 },
      ];

      const result = calculateBudgetTotals({
        settings: { ...defaultSettings, mealPlanMargin: 0.25 },
        operationals: defaultOperationals,
        assignments,
        recipeDailyCosts,
      });

      const dog = (result.dogTotals as unknown as CalculatedDogTotals[])[0];
      // ingredientTotal = 5 * 100 = 500; no operationals → totalCost = 500
      // finalSalePrice = 500 / (1 - 0.25) = 500 / 0.75 = 666.67
      expect(dog.totalCost).toBe(500);
      expect(dog.finalSalePrice).toBeCloseTo(666.67, 2);
    });
  });

  describe("edge case — zero assignments", () => {
    it("returns zeros gracefully", () => {
      const assignments: ReadonlyArray<BudgetRecipeAssignment> = [];
      const recipeDailyCosts: ReadonlyArray<RecipeDailyCost> = [];

      const result = calculateBudgetTotals({
        settings: defaultSettings,
        operationals: defaultOperationals,
        assignments,
        recipeDailyCosts,
      });

      expect(result.ingredientTotal).toBe(0);
      expect(result.operationalTotal).toBe(0);
      expect(result.totalCost).toBe(0);
      expect(result.finalSalePrice).toBe(0);
      expect(result.dogTotals).toHaveLength(0);
    });

    it("returns zeros when recipes have no daily cost", () => {
      const assignments: ReadonlyArray<BudgetRecipeAssignment> = [
        { dogId: "d-1", recipeId: "r-unknown", assignedDays: 10 },
      ];
      const recipeDailyCosts: ReadonlyArray<RecipeDailyCost> = [];

      const result = calculateBudgetTotals({
        settings: defaultSettings,
        operationals: defaultOperationals,
        assignments,
        recipeDailyCosts,
      });

      expect(result.ingredientTotal).toBe(0);
      expect(result.operationalTotal).toBe(0);
      expect(result.totalCost).toBe(0);
      expect(result.finalSalePrice).toBe(0);
    });
  });

  describe("edge case — single dog ratio = 1.0", () => {
    it("gets all operational cost", () => {
      const assignments: ReadonlyArray<BudgetRecipeAssignment> = [
        { dogId: "d-only", recipeId: "r-1", assignedDays: 3 },
      ];
      const recipeDailyCosts: ReadonlyArray<RecipeDailyCost> = [
        { recipeId: "r-1", dailyCost: 100 },
      ];
      const operationals: OperationalInputs = {
        vacuumBagSmallQty: 0,
        vacuumBagLargeQty: 0,
        labelsQty: 0,
        nonWovenBagQty: 0,
        laborHoursQty: 1,
        cookingHoursQty: 0,
        calciumQty: 0,
        kefirQty: 0,
      };

      const result = calculateBudgetTotals({
        settings: defaultSettings,
        operationals,
        assignments,
        recipeDailyCosts,
      });

      const dog = (result.dogTotals as unknown as CalculatedDogTotals[])[0];
      // 3 * 100 = 300 ingredient; 1 * 500 = 500 ops
      expect(dog.ingredientTotal).toBe(300);
      expect(dog.operationalTotal).toBe(500);
    });
  });

  describe("edge case — zero margin", () => {
    it("finalSalePrice equals totalCost when margin is 0", () => {
      const assignments: ReadonlyArray<BudgetRecipeAssignment> = [
        { dogId: "d-1", recipeId: "r-1", assignedDays: 10 },
      ];
      const recipeDailyCosts: ReadonlyArray<RecipeDailyCost> = [
        { recipeId: "r-1", dailyCost: 50 },
      ];
      const operationals: OperationalInputs = {
        vacuumBagSmallQty: 0,
        vacuumBagLargeQty: 0,
        labelsQty: 0,
        nonWovenBagQty: 0,
        laborHoursQty: 1,
        cookingHoursQty: 0,
        calciumQty: 0,
        kefirQty: 0,
      };

      const result = calculateBudgetTotals({
        settings: { ...defaultSettings, mealPlanMargin: 0 },
        operationals,
        assignments,
        recipeDailyCosts,
      });

      expect(result.totalCost).toBe(result.finalSalePrice);
      expect(result.finalSalePrice).toBe(1000); // 500 + 500
    });

    it("each dog finalSalePrice equals totalCost when margin is 0", () => {
      const assignments: ReadonlyArray<BudgetRecipeAssignment> = [
        { dogId: "d-1", recipeId: "r-1", assignedDays: 5 },
      ];
      const recipeDailyCosts: ReadonlyArray<RecipeDailyCost> = [
        { recipeId: "r-1", dailyCost: 100 },
      ];

      const result = calculateBudgetTotals({
        settings: { ...defaultSettings, mealPlanMargin: 0 },
        operationals: defaultOperationals,
        assignments,
        recipeDailyCosts,
      });

      const dog = (result.dogTotals as unknown as CalculatedDogTotals[])[0];
      expect(dog.finalSalePrice).toBe(dog.totalCost);
    });
  });

  describe("rounding — amounts are rounded to 2 decimals", () => {
    it("ingredient total is rounded to 2 decimals", () => {
      const assignments: ReadonlyArray<BudgetRecipeAssignment> = [
        { dogId: "d-1", recipeId: "r-1", assignedDays: 3 },
      ];
      const recipeDailyCosts: ReadonlyArray<RecipeDailyCost> = [
        { recipeId: "r-1", dailyCost: 33.333 },
      ];

      const result = calculateBudgetTotals({
        settings: defaultSettings,
        operationals: defaultOperationals,
        assignments,
        recipeDailyCosts,
      });

      // 3 * 33.333 = 99.999 → should round to 100.00
      expect(result.ingredientTotal).toBe(100);
    });

    it("operational share per dog is rounded to 2 decimals", () => {
      const assignments: ReadonlyArray<BudgetRecipeAssignment> = [
        { dogId: "d-1", recipeId: "r-1", assignedDays: 1 },
        { dogId: "d-2", recipeId: "r-2", assignedDays: 1 },
      ];
      const recipeDailyCosts: ReadonlyArray<RecipeDailyCost> = [
        { recipeId: "r-1", dailyCost: 100 },
        { recipeId: "r-2", dailyCost: 100 },
      ];
      const operationals: OperationalInputs = {
        vacuumBagSmallQty: 0,
        vacuumBagLargeQty: 0,
        labelsQty: 0,
        nonWovenBagQty: 0,
        laborHoursQty: 1,
        cookingHoursQty: 0,
        calciumQty: 0,
        kefirQty: 0,
      };

      const result = calculateBudgetTotals({
        settings: defaultSettings,
        operationals,
        assignments,
        recipeDailyCosts,
      });

      // Each dog has 50% of $500 ops = $250.00 exactly
      const dogTotals = result.dogTotals as unknown as CalculatedDogTotals[];
      for (const dog of dogTotals) {
        expect(dog.operationalTotal).toBe(250);
        expect(String(dog.operationalTotal)).not.toContain("e");
      }
    });

    it("finalSalePrice is rounded to 2 decimals", () => {
      const assignments: ReadonlyArray<BudgetRecipeAssignment> = [
        { dogId: "d-1", recipeId: "r-1", assignedDays: 3 },
      ];
      const recipeDailyCosts: ReadonlyArray<RecipeDailyCost> = [
        { recipeId: "r-1", dailyCost: 33.333 },
      ];

      const result = calculateBudgetTotals({
        settings: defaultSettings,
        operationals: defaultOperationals,
        assignments,
        recipeDailyCosts,
      });

      // 100 / 0.8 = 125.00
      expect(result.finalSalePrice).toBe(125);
    });
  });
});
