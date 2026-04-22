import { describe, expect, it } from "vitest";
import {
  buildPaginationHref,
  parseBudgetFilters,
  hasActiveFilters,
} from "./budget-pagination.model";

describe("buildPaginationHref", () => {
  it("builds URL with only page param when no filters active", () => {
    const result = buildPaginationHref("/budgets", 2, {
      status: "all",
      search: "",
      tutorId: null,
    });
    expect(result).toBe("/budgets?page=2");
  });

  it("preserves status filter in URL", () => {
    const result = buildPaginationHref("/budgets", 3, {
      status: "sent",
      search: "",
      tutorId: null,
    });
    expect(result).toContain("status=sent");
    expect(result).toContain("page=3");
  });

  it("preserves search filter in URL", () => {
    const result = buildPaginationHref("/budgets", 1, {
      status: "all",
      search: "Juan Pérez",
      tutorId: null,
    });
    // "é" is UTF-8 encoded as %C3%A9 by URLSearchParams
    expect(result).toContain("q=Juan+P%C3%A9rez");
    expect(result).toContain("page=1");
  });

  it("preserves tutor filter in URL", () => {
    const result = buildPaginationHref("/budgets", 2, {
      status: "all",
      search: "",
      tutorId: "tutor-123",
    });
    expect(result).toContain("tutor=tutor-123");
    expect(result).toContain("page=2");
  });

  it("omits status=all from URL", () => {
    const result = buildPaginationHref("/budgets", 1, {
      status: "all",
      search: "test",
      tutorId: null,
    });
    expect(result).not.toContain("status=");
    expect(result).toContain("q=test");
  });

  it("includes all active filters", () => {
    const result = buildPaginationHref("/budgets", 5, {
      status: "accepted",
      search: "María",
      tutorId: "t-99",
    });
    expect(result).toContain("status=accepted");
    expect(result).toContain("q=Mar%C3%ADa");
    expect(result).toContain("tutor=t-99");
    expect(result).toContain("page=5");
  });

  it("preserves sortBy/sortDir", () => {
    const result = buildPaginationHref("/budgets", 2, {
      status: "all",
      search: "",
      tutorId: null,
      sortBy: "total_cost",
      sortDir: "desc",
    });

    expect(result).toBe("/budgets?sortBy=total_cost&sortDir=desc&page=2");
  });
});

describe("parseBudgetFilters", () => {
  const makeParams = (entries: [string, string][]) =>
    new URLSearchParams(entries);

  it("returns page=1 when no page param", () => {
    const result = parseBudgetFilters(makeParams([]));
    expect(result.page).toBe(1);
  });

  it("parses valid page number", () => {
    const result = parseBudgetFilters(makeParams([["page", "3"]]));
    expect(result.page).toBe(3);
  });

  it("clamps page to 1 when negative", () => {
    const result = parseBudgetFilters(makeParams([["page", "-5"]]));
    expect(result.page).toBe(1);
  });

  it("clamps page to 1 when NaN", () => {
    const result = parseBudgetFilters(makeParams([["page", "abc"]]));
    expect(result.page).toBe(1);
  });

  it("defaults status to all", () => {
    const result = parseBudgetFilters(makeParams([]));
    expect(result.status).toBe("all");
  });

  it("parses status param", () => {
    const result = parseBudgetFilters(makeParams([["status", "sent"]]));
    expect(result.status).toBe("sent");
  });

  it("defaults search to empty string", () => {
    const result = parseBudgetFilters(makeParams([]));
    expect(result.search).toBe("");
  });

  it("parses search param", () => {
    const result = parseBudgetFilters(makeParams([["q", "Juan"]]));
    expect(result.search).toBe("Juan");
  });

  it("defaults tutorId to null", () => {
    const result = parseBudgetFilters(makeParams([]));
    expect(result.tutorId).toBeNull();
  });

  it("parses tutor param", () => {
    const result = parseBudgetFilters(makeParams([["tutor", "tutor-abc"]]));
    expect(result.tutorId).toBe("tutor-abc");
  });

  it("parsea sort con defaults seguros", () => {
    const result = parseBudgetFilters(
      makeParams([
        ["sortBy", "final_sale_price"],
        ["sortDir", "desc"],
      ]),
    );

    expect(result.sortBy).toBe("final_sale_price");
    expect(result.sortDir).toBe("desc");
  });
});

describe("hasActiveFilters", () => {
  it("returns false when no filters active", () => {
    expect(hasActiveFilters({ status: "all", search: "", tutorId: null })).toBe(
      false,
    );
  });

  it("returns true when status filter active", () => {
    expect(
      hasActiveFilters({ status: "sent", search: "", tutorId: null }),
    ).toBe(true);
  });

  it("returns true when search filter active", () => {
    expect(
      hasActiveFilters({ status: "all", search: "Juan", tutorId: null }),
    ).toBe(true);
  });

  it("returns true when tutor filter active", () => {
    expect(
      hasActiveFilters({ status: "all", search: "", tutorId: "t-123" }),
    ).toBe(true);
  });

  it("returns false for status=pending (still a filter)", () => {
    expect(
      hasActiveFilters({ status: "pending", search: "", tutorId: null }),
    ).toBe(true);
  });
});
