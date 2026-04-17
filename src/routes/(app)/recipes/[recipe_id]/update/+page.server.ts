import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import {
  parseFormValue,
  parseRecipeItems,
  validateRecipeItems,
  getRecipeError,
  getRecipeItemsError,
} from "$lib/server/forms/parsers";

export const load: PageServerLoad = async ({ locals, params }) => {
  const recipeId = params.recipe_id;

  const [recipeResult, recipeItemsResult, dogsResult, rawMaterialsResult] =
    await Promise.all([
      locals.supabase
        .from("recipes")
        .select("id, dog_id, name, notes")
        .eq("id", recipeId)
        .single(),
      locals.supabase
        .from("recipe_items")
        .select("raw_material_id, daily_quantity, created_at")
        .eq("recipe_id", recipeId)
        .order("created_at", { ascending: true }),
      locals.supabase
        .from("dogs")
        .select("id, tutor_id, name, tutors(full_name)")
        .order("name", { ascending: true }),
      locals.supabase
        .from("raw_materials")
        .select("id, name, base_unit, derived_unit_cost")
        .eq("is_active", true)
        .order("name", { ascending: true }),
    ]);

  if (recipeResult.error || !recipeResult.data) {
    throw redirect(303, "/recipes");
  }

  const rawMaterialCosts = new Map(
    (rawMaterialsResult.data ?? []).map((m) => [
      m.id,
      Number(m.derived_unit_cost),
    ]),
  );

  const recipeItems = (recipeItemsResult.data ?? []).map((item) => {
    const dailyQty = Number(item.daily_quantity);
    const unitCost = rawMaterialCosts.get(item.raw_material_id) ?? 0;
    return {
      rawMaterialId: item.raw_material_id,
      dailyQuantity: item.daily_quantity.toString(),
      itemCost: (dailyQty * unitCost).toFixed(2),
    };
  });

  return {
    recipe: recipeResult.data,
    recipeItems,
    dogOptions: (dogsResult.data ?? []).map((dog) => ({
      id: dog.id,
      name: dog.name,
      tutorName:
        (dog.tutors as unknown as { full_name: string } | null)?.full_name ??
        "",
    })),
    rawMaterialOptions: (rawMaterialsResult.data ?? []).map((material) => ({
      id: material.id,
      name: material.name,
      baseUnit: material.base_unit,
    })),
    rawMaterialCosts: Object.fromEntries(rawMaterialCosts),
  };
};

export const actions: Actions = {
  update: async ({ request, locals, params }) => {
    const recipeId = params.recipe_id;
    const formData = await request.formData();
    const dogId = parseFormValue(formData.get("dogId"));
    const name = parseFormValue(formData.get("name"));
    const notes = parseFormValue(formData.get("notes"));
    const itemRows = parseRecipeItems(formData);

    if (!recipeId || !dogId || !name) {
      return fail(400, {
        operatorError: "Para editar, completá perro y nombre de receta.",
        values: { dogId, name, notes, items: itemRows },
      });
    }

    const itemsValidation = validateRecipeItems(itemRows);
    if (!itemsValidation.ok) {
      return fail(400, {
        operatorError: itemsValidation.message,
        values: { dogId, name, notes, items: itemRows },
      });
    }

    const rawMaterialIds = itemsValidation.items.map(
      (item) => item.rawMaterialId,
    );
    const { data: rawMaterialsData, error: rawMaterialsError } =
      await locals.supabase
        .from("raw_materials")
        .select("id, base_unit")
        .in("id", rawMaterialIds);

    if (rawMaterialsError) {
      return fail(400, {
        operatorError:
          "No pudimos validar las materias primas seleccionadas. Reintentá en unos segundos.",
        values: { dogId, name, notes, items: itemRows },
      });
    }

    const rawMaterialUnitById = new Map(
      (rawMaterialsData ?? []).map((material) => [
        material.id,
        material.base_unit,
      ]),
    );
    if (rawMaterialUnitById.size !== new Set(rawMaterialIds).size) {
      return fail(400, {
        operatorError:
          "Hay materias primas inválidas o inactivas. Revisá el detalle de la receta.",
        values: { dogId, name, notes, items: itemRows },
      });
    }

    const { error } = await locals.supabase
      .from("recipes")
      .update({ dog_id: dogId, name, notes: notes || null })
      .eq("id", recipeId);

    if (error) {
      return fail(400, {
        operatorError: getRecipeError("update", error.message),
        values: { dogId, name, notes, items: itemRows },
      });
    }

    const { error: deleteItemsError } = await locals.supabase
      .from("recipe_items")
      .delete()
      .eq("recipe_id", recipeId);
    if (deleteItemsError) {
      return fail(400, {
        operatorError: getRecipeItemsError(deleteItemsError.message),
        values: { dogId, name, notes, items: itemRows },
      });
    }

    const recipeItemsPayload = itemsValidation.items.map((item) => ({
      recipe_id: recipeId,
      raw_material_id: item.rawMaterialId,
      daily_quantity: item.dailyQuantity,
      unit: rawMaterialUnitById.get(item.rawMaterialId) ?? "g",
    }));

    const { error: insertItemsError } = await locals.supabase
      .from("recipe_items")
      .insert(recipeItemsPayload);
    if (insertItemsError) {
      return fail(400, {
        operatorError: getRecipeItemsError(insertItemsError.message),
        values: { dogId, name, notes, items: itemRows },
      });
    }

    throw redirect(303, "/recipes");
  },
};
