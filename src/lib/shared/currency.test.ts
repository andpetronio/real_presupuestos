import { describe, it, expect } from "vitest";
import { formatArs, formatQuantity } from "./currency";

describe("formatArs", () => {
  it("formatea un número entero con símbolo $", () => {
    const result = formatArs(1000);
    expect(result).toMatch(/\$\s*1\.?000/);
  });

  it("siempre muestra 2 decimales", () => {
    expect(formatArs(100)).toMatch(/\$[^,]*,\d{2}$/);
    expect(formatArs(100.5)).toMatch(/\$[^,]*,\d{2}$/);
  });

  it("usa separador de miles argentino", () => {
    expect(formatArs(1234567)).toContain("1.234.567");
  });

  it("usa coma decimal argentina", () => {
    expect(formatArs(1234.56)).toMatch(/,\d{2}$/);
    expect(formatArs(1234.56)).toContain("$");
  });

  it("maneja cero", () => {
    expect(formatArs(0)).toContain("0,00");
    expect(formatArs(0)).toContain("$");
  });

  it("redondea a 2 decimales", () => {
    expect(formatArs(123.456)).toContain("123,46");
    expect(formatArs(123.454)).toContain("123,45");
  });
});

describe("formatQuantity", () => {
  it("sin decimales cuando el valor es entero", () => {
    const result = formatQuantity(1000);
    expect(result).not.toContain(",");
    expect(result).toBe("1.000");
  });

  it("2 decimales cuando tiene parte fraccional", () => {
    expect(formatQuantity(1234.5)).toBe("1.234,50");
  });

  it("redondea a 2 decimales", () => {
    expect(formatQuantity(1234.567)).toBe("1.234,57");
    expect(formatQuantity(1234.564)).toBe("1.234,56");
  });

  it("maneja cero", () => {
    expect(formatQuantity(0)).toBe("0");
  });

  it("usa punto como separador de miles", () => {
    expect(formatQuantity(1234567)).toContain("1.234.567");
  });

  it("usa coma como separador decimal", () => {
    expect(formatQuantity(1234.5)).toContain("234,50");
  });
});
