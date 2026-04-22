import { describe, expect, it } from "vitest";
import { parseSortState, toggleSortState } from "./sorting";

describe("parseSortState", () => {
  it("retorna default cuando params están ausentes", () => {
    const result = parseSortState({
      searchParams: new URLSearchParams(),
      allowedSortBy: ["name", "created_at"] as const,
      defaultSort: { sortBy: "name", sortDir: "asc" },
    });

    expect(result).toEqual({ sortBy: "name", sortDir: "asc" });
  });

  it("acepta sortBy/sortDir válidos", () => {
    const result = parseSortState({
      searchParams: new URLSearchParams([
        ["sortBy", "created_at"],
        ["sortDir", "desc"],
      ]),
      allowedSortBy: ["name", "created_at"] as const,
      defaultSort: { sortBy: "name", sortDir: "asc" },
    });

    expect(result).toEqual({ sortBy: "created_at", sortDir: "desc" });
  });

  it("ignora sortBy inválido y cae al default", () => {
    const result = parseSortState({
      searchParams: new URLSearchParams([
        ["sortBy", "drop table"],
        ["sortDir", "desc"],
      ]),
      allowedSortBy: ["name", "created_at"] as const,
      defaultSort: { sortBy: "name", sortDir: "asc" },
    });

    expect(result).toEqual({ sortBy: "name", sortDir: "desc" });
  });

  it("ignora sortDir inválido y usa default", () => {
    const result = parseSortState({
      searchParams: new URLSearchParams([
        ["sortBy", "name"],
        ["sortDir", "SIDEWAYS"],
      ]),
      allowedSortBy: ["name", "created_at"] as const,
      defaultSort: { sortBy: "created_at", sortDir: "desc" },
    });

    expect(result).toEqual({ sortBy: "name", sortDir: "desc" });
  });
});

describe("toggleSortState", () => {
  it("invierte dirección cuando se clickea misma columna", () => {
    const result = toggleSortState({
      current: { sortBy: "name", sortDir: "asc" },
      clickedField: "name",
    });

    expect(result).toEqual({ sortBy: "name", sortDir: "desc" });
  });

  it("resetea a defaultDir al cambiar de columna", () => {
    const result = toggleSortState({
      current: { sortBy: "name", sortDir: "desc" },
      clickedField: "created_at",
      defaultDir: "asc",
    });

    expect(result).toEqual({ sortBy: "created_at", sortDir: "asc" });
  });
});
