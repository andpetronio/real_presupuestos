import { describe, expect, it } from "vitest";
import {
  didTutorChange,
  resetRowsForTutorChange,
  syncRowOnDogChange,
} from "./composition-editor.logic";

describe("composition-editor.logic", () => {
  it("resetRowsForTutorChange limpia perro/receta/días en todas las filas", () => {
    const rows = [
      { dogId: "d-1", recipeId: "r-1", assignedDays: "15" },
      { dogId: "d-2", recipeId: "r-2", assignedDays: "16" },
    ];

    expect(resetRowsForTutorChange(rows)).toEqual([
      { dogId: "", recipeId: "", assignedDays: "" },
      { dogId: "", recipeId: "", assignedDays: "" },
    ]);
  });

  it("didTutorChange retorna false cuando el tutor no cambió", () => {
    expect(didTutorChange("t-1", "t-1")).toBe(false);
  });

  it("didTutorChange retorna true cuando cambia tutor", () => {
    expect(didTutorChange("t-1", "t-2")).toBe(true);
  });

  it("syncRowOnDogChange limpia receta cuando ya no corresponde al nuevo perro", () => {
    const row = { dogId: "d-1", recipeId: "r-1", assignedDays: "12" };
    const recipeOptions = [
      { id: "r-1", dogId: "d-1", name: "Receta 1" },
      { id: "r-2", dogId: "d-2", name: "Receta 2" },
    ];

    expect(
      syncRowOnDogChange({
        row,
        nextDogId: "d-2",
        recipeOptions,
      }),
    ).toEqual({
      dogId: "d-2",
      recipeId: "",
      assignedDays: "12",
    });
  });

  it("syncRowOnDogChange conserva receta si sigue siendo válida", () => {
    const row = { dogId: "d-1", recipeId: "r-1", assignedDays: "12" };
    const recipeOptions = [{ id: "r-1", dogId: "d-1", name: "Receta 1" }];

    expect(
      syncRowOnDogChange({
        row,
        nextDogId: "d-1",
        recipeOptions,
      }),
    ).toEqual(row);
  });
});
