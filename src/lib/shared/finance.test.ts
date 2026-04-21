import { describe, expect, it } from "vitest";
import { calculateProfitFromCostAndMargin } from "./finance";

describe("calculateProfitFromCostAndMargin", () => {
  it("regresión 40%: 114416.20 -> 76277.47", () => {
    expect(calculateProfitFromCostAndMargin(114416.2, 0.4)).toBe(76277.47);
  });

  it("margin 0% -> 0", () => {
    expect(calculateProfitFromCostAndMargin(114416.2, 0)).toBe(0);
  });

  it("margin >= 1 -> 0 (guardrail)", () => {
    expect(calculateProfitFromCostAndMargin(114416.2, 1)).toBe(0);
    expect(calculateProfitFromCostAndMargin(114416.2, 1.2)).toBe(0);
  });

  it("totalCost <= 0 -> 0", () => {
    expect(calculateProfitFromCostAndMargin(0, 0.4)).toBe(0);
    expect(calculateProfitFromCostAndMargin(-10, 0.4)).toBe(0);
  });
});
