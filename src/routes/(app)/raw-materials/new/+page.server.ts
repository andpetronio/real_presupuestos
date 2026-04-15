import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import {
  parseFormValue,
  parseNonNegativeNumber,
  parsePositiveNumber,
  parseWastagePercentage,
  calculateCostWithWastage,
  getRawMaterialError
} from '$lib/server/forms/parsers';

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();

    const name = parseFormValue(formData.get('name'));
    const baseUnit = parseFormValue(formData.get('baseUnit'));
    const purchaseQuantityRaw = parseFormValue(formData.get('purchaseQuantity'));
    const baseCostRaw = parseFormValue(formData.get('baseCost'));
    const wastagePercentageRaw = parseFormValue(formData.get('wastagePercentage'));

    const purchaseQuantity = parsePositiveNumber(purchaseQuantityRaw);
    const baseCost = parseNonNegativeNumber(baseCostRaw);
    const wastagePercentage = parseWastagePercentage(wastagePercentageRaw);

    if (!name || !baseUnit || purchaseQuantity === null || baseCost === null || wastagePercentage === null) {
      return fail(400, {
        operatorError:
          'Completá nombre, unidad base y cantidad comprada (> 0). El costo base debe ser mayor o igual a 0 y la merma entre 0 y 100%.',
        values: {
          name,
          baseUnit,
          purchaseQuantity: purchaseQuantityRaw,
          baseCost: baseCostRaw,
          wastagePercentage: wastagePercentageRaw
        }
      });
    }

    const costWithWastage = calculateCostWithWastage(baseCost, wastagePercentage);
    const derivedUnitCost = Number((costWithWastage / purchaseQuantity).toFixed(6));

    const { error } = await locals.supabase.from('raw_materials').insert({
      name,
      base_unit: baseUnit,
      purchase_quantity: purchaseQuantity,
      base_cost: baseCost,
      wastage_percentage: wastagePercentage,
      cost_with_wastage: costWithWastage,
      purchase_unit: baseUnit,
      purchase_cost: baseCost,
      derived_unit_cost: derivedUnitCost,
      is_active: true
    });

    if (error) {
      return fail(400, {
        operatorError: getRawMaterialError('create', error.message),
        values: {
          name,
          baseUnit,
          purchaseQuantity: purchaseQuantityRaw,
          baseCost: baseCostRaw,
          wastagePercentage: wastagePercentageRaw
        }
      });
    }

    throw redirect(303, '/raw-materials');
  }
};
