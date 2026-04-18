import { describe, expect, it } from "vitest";
import { computeMovingAverage, formatBucketLabel } from "./chart.model";

describe("formatBucketLabel", () => {
  it("formatea YYYY-MM-DD a DD/MM", () => {
    expect(formatBucketLabel("2025-04-15")).toBe("15/04");
  });

  it("formatea bucket de un solo dígito con padding", () => {
    expect(formatBucketLabel("2025-01-05")).toBe("05/01");
  });

  it("devuelve el input si no es parseable", () => {
    expect(formatBucketLabel("invalid")).toBe("invalid");
    expect(formatBucketLabel("")).toBe("");
  });
});

describe("computeMovingAverage", () => {
  it("calcula SMA con window=3", () => {
    const values = [0.5, 0.6, 0.4, 0.7, 0.8];
    const result = computeMovingAverage(values, 3);

    // Index 0: only [0.5] → avg = 0.5
    expect(result[0].average).toBeCloseTo(0.5);
    // Index 1: [0.5, 0.6] → avg = 0.55
    expect(result[1].average).toBeCloseTo(0.55);
    // Index 2: [0.5, 0.6, 0.4] → avg = 0.5
    expect(result[2].average).toBeCloseTo(0.5);
    // Index 3: [0.6, 0.4, 0.7] → avg ≈ 0.567
    expect(result[3].average).toBeCloseTo(0.567, 2);
    // Index 4: [0.4, 0.7, 0.8] → avg ≈ 0.633
    expect(result[4].average).toBeCloseTo(0.633, 2);
  });

  it("devuelve {raw, average} para cada posición", () => {
    const values = [0.1, 0.2, 0.3];
    const result = computeMovingAverage(values, 3);
    expect(result[1].raw).toBe(0.2);
  });

  it("window=1 devuelve el valor directo", () => {
    const values = [1, 2, 3];
    const result = computeMovingAverage(values, 1);
    expect(result[1].average).toBe(2);
  });

  it("array vacío devuelve array vacío", () => {
    expect(computeMovingAverage([])).toEqual([]);
  });

  it("array de un solo elemento", () => {
    const result = computeMovingAverage([0.75], 3);
    expect(result).toHaveLength(1);
    expect(result[0].average).toBeCloseTo(0.75);
  });
});
