import { describe, expect, it } from "vitest";
import {
  aggregatePurchaseRequirementSnapshots,
  buildPurchaseRequirements,
  getNextReferenceMonthRange,
  getPurchaseMonthRange,
  resolvePurchaseMonth,
} from "./requirements";

describe("buildPurchaseRequirements", () => {
  it("agrega una materia prima asignada desde varias recetas y presupuestos", () => {
    const requirements = buildPurchaseRequirements([
      {
        rawMaterial: {
          id: "chicken",
          name: "Pechuga de pollo",
          baseUnit: "g",
          wastagePercentage: 30,
          yieldFactor: 1,
        },
        dailyQuantity: 100,
        assignedDays: 5,
      },
      {
        rawMaterial: {
          id: "chicken",
          name: "Pechuga de pollo",
          baseUnit: "g",
          wastagePercentage: 30,
          yieldFactor: 1,
        },
        dailyQuantity: 50,
        assignedDays: 10,
      },
    ]);

    expect(requirements).toHaveLength(1);
    expect(requirements[0]).toMatchObject({
      rawMaterialId: "chicken",
      netQuantity: 1000,
      wastagePercentage: 30,
    });
    expect(requirements[0]?.purchaseQuantity).toBeCloseTo(1428.5714285714);
  });

  it("conserva la cantidad neta cuando la merma es cero", () => {
    const [requirement] = buildPurchaseRequirements([
      {
        rawMaterial: {
          id: "rice",
          name: "Arroz",
          baseUnit: "g",
          wastagePercentage: 0,
          yieldFactor: 3,
        },
        dailyQuantity: 250,
        assignedDays: 4,
      },
    ]);

    expect(requirement?.netQuantity).toBe(1000);
    expect(requirement?.purchaseQuantity).toBeCloseTo(333.3333333333);
  });
});

describe("getNextReferenceMonthRange", () => {
  it("usa el siguiente mes calendario incluso al cruzar de año", () => {
    expect(getNextReferenceMonthRange(new Date(2026, 11, 16))).toEqual({
      start: "2027-01-01",
      end: "2027-02-01",
    });
  });
});

describe("purchase month selection", () => {
  it("acepta un mes válido y vuelve al próximo mes ante valores inválidos", () => {
    const now = new Date(2026, 8, 16);

    expect(resolvePurchaseMonth("2026-04", now)).toBe("2026-04");
    expect(resolvePurchaseMonth("2026-14", now)).toBe("2026-10");
    expect(getPurchaseMonthRange("2026-12")).toEqual({
      start: "2026-12-01",
      end: "2027-01-01",
    });
  });
});

describe("aggregatePurchaseRequirementSnapshots", () => {
  it("mantiene una fila por materia prima y marca merma variable", () => {
    const [requirement] = aggregatePurchaseRequirementSnapshots([
      {
        rawMaterialId: "chicken",
        rawMaterialName: "Pechuga de pollo",
        baseUnit: "g",
        wastagePercentage: 20,
        yieldFactor: 1,
        netQuantity: 500,
        purchaseQuantity: 625,
      },
      {
        rawMaterialId: "chicken",
        rawMaterialName: "Pechuga de pollo",
        baseUnit: "g",
        wastagePercentage: 30,
        yieldFactor: 1,
        netQuantity: 500,
        purchaseQuantity: 714.285714,
      },
    ]);

    expect(requirement?.netQuantity).toBe(1000);
    expect(requirement?.purchaseQuantity).toBeCloseTo(1339.285714);
    expect(Number.isNaN(requirement?.wastagePercentage)).toBe(true);
  });

  it("conserva el rendimiento congelado del arroz", () => {
    const [requirement] = aggregatePurchaseRequirementSnapshots([
      {
        rawMaterialId: "rice",
        rawMaterialName: "Arroz",
        baseUnit: "g",
        wastagePercentage: 0,
        yieldFactor: 3,
        netQuantity: 1500,
        purchaseQuantity: 500,
      },
    ]);

    expect(requirement).toMatchObject({ yieldFactor: 3, purchaseQuantity: 500 });
  });
});
