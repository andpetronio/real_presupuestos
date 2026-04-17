import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import {
  parseFormValue,
  parseNonNegativeNumber,
  parsePositiveNumber,
  parseWastagePercentage,
  calculateCostWithWastage,
  getRawMaterialError,
} from "$lib/server/forms/parsers";

export const load: PageServerLoad = async ({ locals, params }) => {
  const rawMaterialId = params.raw_material_id;

  const { data, error } = await locals.supabase
    .from("raw_materials")
    .select(
      "id, name, base_unit, purchase_quantity, base_cost, wastage_percentage",
    )
    .eq("id", rawMaterialId)
    .single();

  if (error || !data) {
    throw redirect(303, "/raw-materials");
  }

  return { rawMaterial: data };
};

export const actions: Actions = {
  update: async ({ request, locals, params }) => {
    const rawMaterialId = params.raw_material_id;
    const formData = await request.formData();

    const name = parseFormValue(formData.get("name"));
    const baseUnit = parseFormValue(formData.get("baseUnit"));
    const purchaseQuantityRaw = parseFormValue(
      formData.get("purchaseQuantity"),
    );
    const baseCostRaw = parseFormValue(formData.get("baseCost"));
    const wastagePercentageRaw = parseFormValue(
      formData.get("wastagePercentage"),
    );

    const purchaseQuantity = parsePositiveNumber(purchaseQuantityRaw);
    const baseCost = parseNonNegativeNumber(baseCostRaw);
    const wastagePercentage = parseWastagePercentage(wastagePercentageRaw);

    if (
      !rawMaterialId ||
      !name ||
      !baseUnit ||
      purchaseQuantity === null ||
      baseCost === null ||
      wastagePercentage === null
    ) {
      return fail(400, {
        operatorError:
          "Completá nombre, unidad base y cantidad comprada (> 0). El costo base debe ser mayor o igual a 0 y la merma entre 0 y 100%.",
        values: {
          name,
          baseUnit,
          purchaseQuantity: purchaseQuantityRaw,
          baseCost: baseCostRaw,
          wastagePercentage: wastagePercentageRaw,
        },
      });
    }

    const costWithWastage = calculateCostWithWastage(
      baseCost,
      wastagePercentage,
    );
    const derivedUnitCost = Number(
      (costWithWastage / purchaseQuantity).toFixed(6),
    );

    const { error } = await locals.supabase
      .from("raw_materials")
      .update({
        name,
        base_unit: baseUnit,
        purchase_quantity: purchaseQuantity,
        base_cost: baseCost,
        wastage_percentage: wastagePercentage,
        cost_with_wastage: costWithWastage,
        purchase_unit: baseUnit,
        purchase_cost: baseCost,
        derived_unit_cost: derivedUnitCost,
      })
      .eq("id", rawMaterialId);

    if (error) {
      return fail(400, {
        operatorError:
          "No pudimos guardar los cambios de la materia prima. Reintentá en unos segundos.",
        values: {
          name,
          baseUnit,
          purchaseQuantity: purchaseQuantityRaw,
          baseCost: baseCostRaw,
          wastagePercentage: wastagePercentageRaw,
        },
      });
    }

    throw redirect(303, "/raw-materials");
  },
};
