/**
 * Parsers y helpers de formulario compartidos entre todos los server modules.
 * Centraliza la lógica de parsing para evitar duplicación.
 */

// ─── Generic parsers ──────────────────────────────────────────────────────────

export const parseFormValue = (value: FormDataEntryValue | null): string =>
  typeof value === "string" ? value.trim() : "";

export const parseNonNegativeNumber = (value: string): number | null => {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

export const parsePositiveNumber = (value: string): number | null => {
  const parsed = parseNonNegativeNumber(value);
  return parsed !== null && parsed > 0 ? parsed : null;
};

export const parsePositiveInteger = (value: string): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0)
    return null;
  return parsed;
};

export const parseWastagePercentage = (value: string): number | null => {
  const parsed = parseNonNegativeNumber(value);
  return parsed !== null && parsed <= 100 ? parsed : null;
};

// ─── Domain-specific parsers ──────────────────────────────────────────────────

export type RecipeItemDraft = {
  rawMaterialId: string;
  dailyQuantity: string;
};

export const parseRecipeItems = (formData: FormData): RecipeItemDraft[] => {
  const materialIds = formData
    .getAll("rawMaterialId")
    .map((v) => parseFormValue(v));
  const quantities = formData
    .getAll("dailyQuantity")
    .map((v) => parseFormValue(v));
  const totalRows = Math.max(materialIds.length, quantities.length);
  const rows: RecipeItemDraft[] = [];

  for (let index = 0; index < totalRows; index += 1) {
    const rawMaterialId = materialIds[index] ?? "";
    const dailyQuantity = quantities[index] ?? "";
    if (!rawMaterialId && !dailyQuantity) continue;
    rows.push({ rawMaterialId, dailyQuantity });
  }

  return rows;
};

export type RecipeItemsValidation =
  | {
      ok: true;
      items: ReadonlyArray<{ rawMaterialId: string; dailyQuantity: number }>;
    }
  | { ok: false; message: string };

export const validateRecipeItems = (
  rows: RecipeItemDraft[],
): RecipeItemsValidation => {
  if (rows.length === 0) {
    return {
      ok: false,
      message:
        "Agregá al menos una materia prima con su cantidad para crear la receta.",
    };
  }

  const parsedItems: Array<{ rawMaterialId: string; dailyQuantity: number }> =
    [];
  const seenMaterials = new Set<string>();

  for (const row of rows) {
    if (!row.rawMaterialId)
      return {
        ok: false,
        message: "Cada fila de receta necesita una materia prima seleccionada.",
      };
    const dailyQuantity = parsePositiveNumber(row.dailyQuantity);
    if (dailyQuantity === null)
      return {
        ok: false,
        message: "La cantidad de cada materia prima debe ser mayor a 0.",
      };
    if (seenMaterials.has(row.rawMaterialId))
      return {
        ok: false,
        message: "No repitas materias primas en la misma receta.",
      };
    seenMaterials.add(row.rawMaterialId);
    parsedItems.push({ rawMaterialId: row.rawMaterialId, dailyQuantity });
  }

  return { ok: true, items: parsedItems };
};

// ─── Business calculations ────────────────────────────────────────────────────

export const calculateCostWithWastage = (
  baseCost: number,
  wastagePercentage: number,
): number => Number((baseCost * (1 + wastagePercentage / 100)).toFixed(2));

// ─── Error helpers ────────────────────────────────────────────────────────────

export const getTutorError = (
  action: "create" | "update",
  errorMessage: string | undefined,
): string => {
  if (!errorMessage) {
    return action === "create"
      ? "No pudimos crear el tutor. Reintentá en unos segundos."
      : "No pudimos guardar los cambios del tutor. Reintentá en unos segundos.";
  }
  const normalized = errorMessage.toLowerCase();
  if (normalized.includes("tutors_whatsapp_number_unique")) {
    return "Ya existe un tutor con ese WhatsApp. Verificá el número.";
  }
  return action === "create"
    ? "No pudimos crear el tutor. Reintentá en unos segundos."
    : "No pudimos guardar los cambios del tutor. Reintentá en unos segundos.";
};

export const getVeterinaryError = (
  action: "create" | "update",
  errorMessage: string | undefined,
): string => {
  if (!errorMessage) {
    return action === "create"
      ? "No pudimos crear la veterinaria. Reintentá en unos segundos."
      : "No pudimos guardar los cambios. Reintentá en unos segundos.";
  }
  const normalized = errorMessage.toLowerCase();
  if (normalized.includes("veterinaries_name_unique")) {
    return "Ya existe una veterinaria con ese nombre. Verificá antes de guardar.";
  }
  return action === "create"
    ? "No pudimos crear la veterinaria. Reintentá en unos segundos."
    : "No pudimos guardar los cambios. Reintentá en unos segundos.";
};

export const getRawMaterialError = (
  action: "create" | "update",
  errorMessage: string | undefined,
): string => {
  if (!errorMessage) {
    return action === "create"
      ? "No pudimos crear la materia prima. Reintentá en unos segundos."
      : "No pudimos guardar los cambios de la materia prima. Reintentá en unos segundos.";
  }
  const normalized = errorMessage.toLowerCase();
  if (normalized.includes("raw_materials_name_unique")) {
    return "Ya existe una materia prima con ese nombre.";
  }
  return action === "create"
    ? "No pudimos crear la materia prima. Reintentá en unos segundos."
    : "No pudimos guardar los cambios de la materia prima. Reintentá en unos segundos.";
};

export const getRecipeError = (
  action: "create" | "update",
  errorMessage: string | undefined,
): string => {
  if (!errorMessage) {
    return action === "create"
      ? "No pudimos crear la receta. Reintentá en unos segundos."
      : "No pudimos guardar los cambios de la receta. Reintentá en unos segundos.";
  }
  const normalized = errorMessage.toLowerCase();
  if (normalized.includes("violates foreign key constraint")) {
    return "El perro seleccionado no es válido. Recargá la pantalla e intentá de nuevo.";
  }
  return action === "create"
    ? "No pudimos crear la receta. Reintentá en unos segundos."
    : "No pudimos guardar los cambios de la receta. Reintentá en unos segundos.";
};

export const getRecipeItemsError = (
  errorMessage: string | undefined,
): string => {
  if (!errorMessage)
    return "No pudimos guardar las materias primas de la receta. Reintentá en unos segundos.";
  const normalized = errorMessage.toLowerCase();
  if (normalized.includes("recipe_items_unique_material_per_recipe")) {
    return "No repitas materias primas en la misma receta.";
  }
  return "No pudimos guardar las materias primas de la receta. Reintentá en unos segundos.";
};
