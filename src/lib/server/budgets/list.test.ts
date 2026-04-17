import { describe, expect, it } from "vitest";
import {
  applyBudgetListFilters,
  hasBudgetFilters,
  parseBudgetFilters,
  resolveBudgetTableMessage,
  type BudgetListFilters,
} from "./list";

const makeQuerySpy = () => {
  const calls: Array<{ method: string; args: unknown[] }> = [];

  const query = {
    in: (...args: unknown[]) => {
      calls.push({ method: "in", args });
      return query;
    },
    eq: (...args: unknown[]) => {
      calls.push({ method: "eq", args });
      return query;
    },
    ilike: (...args: unknown[]) => {
      calls.push({ method: "ilike", args });
      return query;
    },
  };

  return { query, calls };
};

describe("parseBudgetFilters", () => {
  it("uses normalized defaults when params are missing", () => {
    const url = new URL("http://localhost/budgets");

    const result = parseBudgetFilters(url);

    expect(result).toEqual({
      status: "all",
      search: "",
      tutorId: null,
    });
  });

  it("normalizes incoming URL params", () => {
    const url = new URL(
      "http://localhost/budgets?status=pending&q=%20ana%20&tutor=t-1",
    );

    const result = parseBudgetFilters(url);

    expect(result).toEqual({
      status: "pending",
      search: "ana",
      tutorId: "t-1",
    });
  });
});

describe("applyBudgetListFilters", () => {
  it("maps pending status to draft + ready_to_send", () => {
    const { query, calls } = makeQuerySpy();

    applyBudgetListFilters(query as never, {
      status: "pending",
      search: "",
      tutorId: null,
    });

    expect(calls).toContainEqual({
      method: "in",
      args: ["status", ["draft", "ready_to_send"]],
    });
  });

  it("applies exact status for non-pending filters", () => {
    const { query, calls } = makeQuerySpy();

    applyBudgetListFilters(query as never, {
      status: "accepted",
      search: "",
      tutorId: null,
    });

    expect(calls).toContainEqual({
      method: "eq",
      args: ["status", "accepted"],
    });
  });

  it("applies tutor and tutor-name search filters", () => {
    const { query, calls } = makeQuerySpy();

    applyBudgetListFilters(query as never, {
      status: "all",
      search: "lucas",
      tutorId: "t-99",
    });

    expect(calls).toContainEqual({
      method: "eq",
      args: ["tutor_id", "t-99"],
    });
    expect(calls).toContainEqual({
      method: "ilike",
      args: ["tutor:full_name", "%lucas%"],
    });
  });
});

describe("hasBudgetFilters", () => {
  it("returns false only for default filter set", () => {
    const defaults: BudgetListFilters = {
      status: "all",
      search: "",
      tutorId: null,
    };

    expect(hasBudgetFilters(defaults)).toBe(false);
  });

  it("returns true when at least one filter is active", () => {
    expect(
      hasBudgetFilters({ status: "sent", search: "", tutorId: null }),
    ).toBe(true);
    expect(
      hasBudgetFilters({ status: "all", search: "ana", tutorId: null }),
    ).toBe(true);
    expect(
      hasBudgetFilters({ status: "all", search: "", tutorId: "t-1" }),
    ).toBe(true);
  });
});

describe("resolveBudgetTableMessage", () => {
  const emptyLabels = {
    title: "Sin presupuestos",
    detail: "Creá un presupuesto para empezar.",
  };

  it("returns success state when list has rows", () => {
    const result = resolveBudgetTableMessage({
      total: 3,
      hasFilters: false,
      emptyLabels,
    });

    expect(result).toEqual({
      tableState: "success",
      tableMessage: null,
    });
  });

  it("returns filtered empty message when filters are active", () => {
    const result = resolveBudgetTableMessage({
      total: 0,
      hasFilters: true,
      emptyLabels,
    });

    expect(result.tableState).toBe("empty");
    expect(result.tableMessage).toEqual({
      kind: "empty",
      title: "Sin resultados",
      detail:
        "No se encontraron presupuestos para los filtros aplicados. Probá modificar o limpiar los filtros.",
    });
  });

  it("returns default empty labels when no filters are active", () => {
    const result = resolveBudgetTableMessage({
      total: 0,
      hasFilters: false,
      emptyLabels,
    });

    expect(result).toEqual({
      tableState: "empty",
      tableMessage: {
        kind: "empty",
        title: emptyLabels.title,
        detail: emptyLabels.detail,
      },
    });
  });
});
