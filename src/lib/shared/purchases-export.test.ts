import { describe, expect, it } from "vitest";
import { buildPurchaseExportRows } from "./purchases-export";

describe("buildPurchaseExportRows", () => {
  it("conserva valores numéricos y marca los valores históricos variables", () => {
    expect(
      buildPurchaseExportRows([
        {
          rawMaterialName: "Pechuga de pollo",
          baseUnit: "g",
          netQuantity: 1000,
          wastagePercentage: Number.NaN,
          yieldFactor: 3,
          purchaseQuantity: 1428.571429,
        },
      ]),
    ).toEqual([
      [
        "Materia prima",
        "Unidad",
        "Cantidad neta",
        "Merma (%)",
        "Rendimiento",
        "Cantidad a comprar",
      ],
      ["Pechuga de pollo", "g", 1000, "Variable", 3, 1428.57],
    ]);
  });
});
