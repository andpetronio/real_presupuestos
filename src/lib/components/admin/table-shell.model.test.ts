import { describe, expect, it } from "vitest";
import { resolveTableShellView } from "./table-shell.model";

describe("resolveTableShellView", () => {
  const base = {
    loadingLabel: "Cargando…",
    emptyTitle: "Sin resultados",
    emptyDetail: "No encontramos registros.",
    emptyActionLabel: "Crear registro",
    errorTitle: "Error inesperado",
    errorDetail: "Reintentá en unos segundos.",
  };

  it("resuelve estado loading", () => {
    expect(resolveTableShellView({ ...base, state: "loading" })).toEqual({
      kind: "loading",
      message: "Cargando…",
    });
  });

  it("resuelve estado empty con CTA opcional", () => {
    expect(resolveTableShellView({ ...base, state: "empty" })).toEqual({
      kind: "empty",
      title: "Sin resultados",
      detail: "No encontramos registros.",
      actionLabel: "Crear registro",
    });
  });

  it("resuelve estado error con feedback operator-friendly", () => {
    expect(resolveTableShellView({ ...base, state: "error" })).toEqual({
      kind: "error",
      title: "Error inesperado",
      detail: "Reintentá en unos segundos.",
    });
  });

  it("resuelve estado success para render normal de tabla", () => {
    expect(resolveTableShellView({ ...base, state: "success" })).toEqual({
      kind: "success",
    });
  });
});
