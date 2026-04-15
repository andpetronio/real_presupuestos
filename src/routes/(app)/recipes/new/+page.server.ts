import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  parseFormValue,
  parseRecipeItems,
  validateRecipeItems,
  getRecipeError,
  getRecipeItemsError
} from '$lib/server/forms/parsers';

export const load: PageServerLoad = async ({ locals }) => {
  const [dogsResult, rawMaterialsResult] = await Promise.all([
    locals.supabase.from('dogs').select('id, name').order('name', { ascending: true }),
    locals.supabase
      .from('raw_materials')
      .select('id, name, base_unit, derived_unit_cost')
      .eq('is_active', true)
      .order('name', { ascending: true })
  ]);

  return {
    dogOptions: (dogsResult.data ?? []).map((dog) => ({ id: dog.id, name: dog.name })),
    rawMaterialOptions: (rawMaterialsResult.data ?? []).map((material) => ({
      id: material.id,
      name: material.name,
      baseUnit: material.base_unit
    })),
    rawMaterialCosts: Object.fromEntries((rawMaterialsResult.data ?? []).map((m) => [m.id, Number(m.derived_unit_cost)]))
  };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const dogId = parseFormValue(formData.get('dogId'));
    const name = parseFormValue(formData.get('name'));
    const notes = parseFormValue(formData.get('notes'));
    const itemRows = parseRecipeItems(formData);

    if (!dogId || !name) {
      return fail(400, {
        operatorError: 'Seleccioná un perro y nombre de receta.',
        values: { dogId, name, notes, items: itemRows }
      });
    }

    const itemsValidation = validateRecipeItems(itemRows);
    if (!itemsValidation.ok) {
      return fail(400, {
        operatorError: itemsValidation.message,
        values: { dogId, name, notes, items: itemRows }
      });
    }

    const rawMaterialIds = itemsValidation.items.map((item) => item.rawMaterialId);
    const { data: rawMaterialsData, error: rawMaterialsError } = await locals.supabase
      .from('raw_materials')
      .select('id, base_unit')
      .in('id', rawMaterialIds);

    if (rawMaterialsError) {
      return fail(400, {
        operatorError: 'No pudimos validar las materias primas seleccionadas. Reintentá en unos segundos.',
        values: { dogId, name, notes, items: itemRows }
      });
    }

    const rawMaterialUnitById = new Map((rawMaterialsData ?? []).map((material) => [material.id, material.base_unit]));
    if (rawMaterialUnitById.size !== new Set(rawMaterialIds).size) {
      return fail(400, {
        operatorError: 'Hay materias primas inválidas o inactivas. Revisá el detalle de la receta.',
        values: { dogId, name, notes, items: itemRows }
      });
    }

    const { data: newRecipe, error } = await locals.supabase
      .from('recipes')
      .insert({ dog_id: dogId, name, notes: notes || null, is_active: true })
      .select('id')
      .single();

    if (error) {
      return fail(400, {
        operatorError: getRecipeError('create', error.message),
        values: { dogId, name, notes, items: itemRows }
      });
    }

    const recipeItemsPayload = itemsValidation.items.map((item) => ({
      recipe_id: newRecipe.id,
      raw_material_id: item.rawMaterialId,
      daily_quantity: item.dailyQuantity,
      unit: rawMaterialUnitById.get(item.rawMaterialId) ?? 'g'
    }));

    const { error: recipeItemsError } = await locals.supabase.from('recipe_items').insert(recipeItemsPayload);
    if (recipeItemsError) {
      await locals.supabase.from('recipes').delete().eq('id', newRecipe.id);
      return fail(400, {
        operatorError: getRecipeItemsError(recipeItemsError.message),
        values: { dogId, name, notes, items: itemRows }
      });
    }

    throw redirect(303, '/recipes');
  }
};
