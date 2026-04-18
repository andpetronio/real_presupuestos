import { describe, it, expect } from "vitest";
import { route } from "./navigation";

describe("route", () => {
  it("concatena segmentos con slash", () => {
    expect(route("/dogs", "id123", "/update")).toBe("/dogs/id123/update");
  });

  it("elimina slashes duplicados", () => {
    expect(route("/dogs/", "/id123/", "/update")).toBe("/dogs/id123/update");
  });

  it("filtra segmentos null y undefined", () => {
    expect(route("/dogs", undefined, "/update")).toBe("/dogs/update");
    expect(route("/dogs", null, "/update")).toBe("/dogs/update");
  });

  it("convierte números a string", () => {
    expect(route("/dogs/", 123, "/update")).toBe("/dogs/123/update");
  });

  it("maneja segmentos vacíos filtrándolos", () => {
    expect(route("/dogs", "", "/update")).toBe("/dogs/update");
  });

  it("arma paths estáticos simples", () => {
    expect(route("/dogs")).toBe("/dogs");
    expect(route("/dogs", "/new")).toBe("/dogs/new");
  });

  it("concatena múltiples segmentos", () => {
    expect(route("/budgets", "id1", "preview")).toBe("/budgets/id1/preview");
  });

  it("conserva el slash inicial del primer segmento", () => {
    expect(route("dogs", "123", "update")).toBe("dogs/123/update");
  });
});
