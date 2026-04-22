import { describe, expect, it } from "vitest";
import { buildPaginationHref, hasActiveFilters } from "./pagination.model";

describe("buildPaginationHref", () => {
  it("preserva q, status y page cuando status es distinto de all", () => {
    const href = buildPaginationHref("/tutors", 3, {
      search: "ana",
      status: "inactive",
    });

    expect(href).toBe("/tutors?q=ana&status=inactive&page=3");
  });

  it("omite status cuando es all", () => {
    const href = buildPaginationHref("/tutors", 2, {
      search: "ana",
      status: "all",
    });

    expect(href).toBe("/tutors?q=ana&page=2");
  });

  it("preserva sorter en la URL de paginación", () => {
    const href = buildPaginationHref("/tutors", 4, {
      search: "ana",
      status: "active",
      sortBy: "whatsapp_number",
      sortDir: "desc",
    });

    expect(href).toBe(
      "/tutors?q=ana&status=active&sortBy=whatsapp_number&sortDir=desc&page=4",
    );
  });
});

describe("hasActiveFilters", () => {
  it("retorna true si hay status activo", () => {
    expect(hasActiveFilters({ search: "", status: "inactive" })).toBe(true);
  });

  it("retorna false sin filtros activos", () => {
    expect(hasActiveFilters({ search: "", status: "all" })).toBe(false);
  });
});
