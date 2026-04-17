/**
 * Operational cost calculations.
 *
 * Architecture:
 * - `computeOperationalTotal` — pure helper, camelCase inputs + settings.
 *   Used by the server (calculation.ts) directly.
 * - `sumOperationalCost` — client-side convenience. Converts snake_case settings
 *   (from DB) to camelCase and delegates to computeOperationalTotal.
 *
 * For the full budget calculation with margins and ingredient splits,
 * see `$lib/server/budgets/calculation.ts`.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** camelCase inputs from form values. */
export type OperationalInputs = {
  vacuumBagSmallQty: number;
  vacuumBagLargeQty: number;
  labelsQty: number;
  nonWovenBagQty: number;
  laborHoursQty: number;
  cookingHoursQty: number;
  calciumQty: number;
  kefirQty: number;
};

/**
 * Snake_case settings from the database (client-side).
 * Use CamelCaseOperationalSettings for the camelCase version.
 */
export type OperationalSettings = {
  vacuum_bag_small_unit_cost: number;
  vacuum_bag_large_unit_cost: number;
  label_unit_cost: number;
  non_woven_bag_unit_cost: number;
  labor_hour_cost: number;
  cooking_hour_cost: number;
  calcium_unit_cost: number;
  kefir_unit_cost: number;
};

/** camelCase settings — used internally and by calculation.ts. */
export type CamelCaseOperationalSettings = {
  vacuumBagSmallUnitCost: number;
  vacuumBagLargeUnitCost: number;
  labelUnitCost: number;
  nonWovenBagUnitCost: number;
  laborHourCost: number;
  cookingHourCost: number;
  calciumUnitCost: number;
  kefirUnitCost: number;
};

// ─── Pure helper (camelCase) ──────────────────────────────────────────────────

/**
 * Sums the operational cost — pure function working in camelCase.
 * Rounds to 2 decimal places.
 */
export const computeOperationalTotal = (
  inputs: OperationalInputs,
  settings: CamelCaseOperationalSettings,
): number => {
  const raw =
    inputs.vacuumBagSmallQty * settings.vacuumBagSmallUnitCost +
    inputs.vacuumBagLargeQty * settings.vacuumBagLargeUnitCost +
    inputs.labelsQty * settings.labelUnitCost +
    inputs.nonWovenBagQty * settings.nonWovenBagUnitCost +
    inputs.laborHoursQty * settings.laborHourCost +
    inputs.cookingHoursQty * settings.cookingHourCost +
    inputs.calciumQty * settings.calciumUnitCost +
    inputs.kefirQty * settings.kefirUnitCost;

  return Number(raw.toFixed(2));
};

// ─── Client convenience (snake → camel) ──────────────────────────────────────

const snakeToCamelSettings = (
  snake: OperationalSettings,
): CamelCaseOperationalSettings => ({
  vacuumBagSmallUnitCost: snake.vacuum_bag_small_unit_cost,
  vacuumBagLargeUnitCost: snake.vacuum_bag_large_unit_cost,
  labelUnitCost: snake.label_unit_cost,
  nonWovenBagUnitCost: snake.non_woven_bag_unit_cost,
  laborHourCost: snake.labor_hour_cost,
  cookingHourCost: snake.cooking_hour_cost,
  calciumUnitCost: snake.calcium_unit_cost,
  kefirUnitCost: snake.kefir_unit_cost,
});

/**
 * Sums the operational cost for client-side budget preview.
 * Converts snake_case settings (from DB) to camelCase before computing.
 */
export const sumOperationalCost = (
  inputs: OperationalInputs,
  settings: OperationalSettings,
): number => {
  return computeOperationalTotal(inputs, snakeToCamelSettings(settings));
};
