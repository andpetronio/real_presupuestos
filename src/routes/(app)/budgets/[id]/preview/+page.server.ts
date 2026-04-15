import type { Actions, PageServerLoad } from './$types';
import type { OperatorMessage } from '$lib/server/shared/ui-state';
import { sendWhatsappAction, markSentAction } from '$lib/server/budgets/preview/actions';

type BudgetPreviewData = {
  id: string;
  status: string;
  tutor_id: string | null;
  notes: string | null;
  final_sale_price: number;
  total_cost: number;
  ingredient_total_global: number;
  operational_total_global: number;
  applied_margin: number;
  created_at: string;
  expires_at: string | null;
  vacuum_bag_small_qty: number;
  vacuum_bag_large_qty: number;
  labels_qty: number;
  non_woven_bag_qty: number;
  labor_hours_qty: number;
  cooking_hours_qty: number;
  calcium_qty: number;
  kefir_qty: number;
  tutor: { full_name: string } | null;
};

type DogRecipeAssignment = {
  dogId: string;
  dogName: string;
  recipeId: string;
  recipeName: string;
  assignedDays: number;
};

type RecipeItemDetail = {
  materialId: string;
  materialName: string;
  baseUnit: string;
  dailyQuantity: number;
  unitCost: number;
  subtotal: number;
};

type RecipeCostBreakdown = {
  recipeId: string;
  recipeName: string;
  assignedDays: number;
  items: RecipeItemDetail[];
  recipeTotal: number;
};

type SettingsCosts = {
  vacuum_bag_small_unit_cost: number;
  vacuum_bag_large_unit_cost: number;
  label_unit_cost: number;
  non_woven_bag_unit_cost: number;
  labor_hour_cost: number;
  cooking_hour_cost: number;
  calcium_unit_cost: number;
  kefir_unit_cost: number;
  meal_plan_margin: number;
};

type OperationalLineItem = {
  name: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
};

const fallbackErrorMessage: OperatorMessage = {
  kind: 'error',
  title: 'No pudimos cargar el presupuesto',
  detail: 'Reintentá en unos segundos.'
};

export const load: PageServerLoad = async ({ params, locals }) => {
  const budgetId = params.id;

  try {
    // Query 1: budget + tutor en paralelo
    const [{ data: budgetBase, error: budgetError }, settingsResult] = await Promise.all([
      locals.supabase
        .from('budgets')
        .select(
          'id, status, tutor_id, notes, final_sale_price, total_cost, ingredient_total_global, operational_total_global, applied_margin, created_at, expires_at, vacuum_bag_small_qty, vacuum_bag_large_qty, labels_qty, non_woven_bag_qty, labor_hours_qty, cooking_hours_qty, calcium_qty, kefir_qty, tutor:tutors(full_name)'
        )
        .eq('id', budgetId)
        .single(),
      locals.supabase
        .from('settings')
        .select('vacuum_bag_small_unit_cost, vacuum_bag_large_unit_cost, label_unit_cost, non_woven_bag_unit_cost, labor_hour_cost, cooking_hour_cost, calcium_unit_cost, kefir_unit_cost, meal_plan_margin')
        .eq('id', 1)
        .single()
    ]);

    if (budgetError || !budgetBase) {
      return {
        budget: null,
        recipeBreakdowns: [],
        operationalItems: [],
        settings: null,
        pageState: 'error' as const,
        pageMessage: { kind: 'error' as const, title: 'Presupuesto no encontrado', detail: 'El presupuesto que buscás no existe.', actionLabel: 'Volver' }
      };
    }

    if (settingsResult.error) throw settingsResult.error;
    const settings: SettingsCosts = settingsResult.data;

    const tutorName = (budgetBase.tutor as { full_name?: string } | null)?.full_name ?? 'Sin tutor';
    const budget: BudgetPreviewData = { ...budgetBase, tutor: { full_name: tutorName } };

    const budgetDogsResult = await locals.supabase
      .from('budget_dogs')
      .select('id, dog_id')
      .eq('budget_id', budgetId);

    if (budgetDogsResult.error) throw budgetDogsResult.error;
    const budgetDogs = budgetDogsResult.data ?? [];

    if (budgetDogs.length === 0) {
      return {
        budget,
        recipeBreakdowns: [],
        operationalItems: [],
        settings,
        pageState: 'success' as const,
        pageMessage: null
      };
    }

    const budgetDogIds = budgetDogs.map((bd) => bd.id);
    const dogIdByBudgetDogId = new Map(budgetDogs.map((bd) => [bd.id, bd.dog_id]));
    const dogIds = Array.from(new Set(budgetDogs.map((bd) => bd.dog_id)));

    // Query 2: budget_dog_recipes → para extraer recipeIds antes de las queries paralelas
    const budgetDogRecipesResult = await locals.supabase
      .from('budget_dog_recipes')
      .select('budget_dog_id, recipe_id, assigned_days')
      .in('budget_dog_id', budgetDogIds)
      .order('created_at', { ascending: true });

    if (budgetDogRecipesResult.error) throw budgetDogRecipesResult.error;

    const recipeIds = Array.from(new Set((budgetDogRecipesResult.data ?? []).map((bdr) => bdr.recipe_id)));

    // Queries 3-4 (paralelas): dogs y recipes
    const [dogsResult, recipesResult] = await Promise.all([
      locals.supabase.from('dogs').select('id, name').in('id', dogIds),
      locals.supabase.from('recipes').select('id, name').in('id', recipeIds)
    ]);

    if (dogsResult.error) throw dogsResult.error;
    if (recipesResult.error) throw recipesResult.error;

    const dogNameById = new Map((dogsResult.data ?? []).map((d) => [d.id, d.name]));
    const recipeNameById = new Map((recipesResult.data ?? []).map((r) => [r.id, r.name]));

    // Query 5: recipe_items → para extraer rawMaterialIds
    const recipeItemsResult = await locals.supabase
      .from('recipe_items')
      .select('recipe_id, raw_material_id, daily_quantity, unit')
      .in('recipe_id', recipeIds);

    if (recipeItemsResult.error) throw recipeItemsResult.error;

    const recipeItems = recipeItemsResult.data ?? [];
    const rawMaterialIds = Array.from(new Set(recipeItems.map((ri) => ri.raw_material_id)));

    // Query 6: raw_materials
    const rawMaterialsResult = await locals.supabase
      .from('raw_materials')
      .select('id, name, base_unit, derived_unit_cost')
      .in('id', rawMaterialIds);

    if (rawMaterialsResult.error) throw rawMaterialsResult.error;

    const materialCostById = new Map((rawMaterialsResult.data ?? []).map((rm) => [rm.id, {
      name: rm.name,
      baseUnit: rm.base_unit,
      cost: Number(rm.derived_unit_cost)
    }]));

    const assignments: DogRecipeAssignment[] = (budgetDogRecipesResult.data ?? []).map((bdr) => ({
      dogId: dogIdByBudgetDogId.get(bdr.budget_dog_id) ?? '',
      dogName: dogNameById.get(dogIdByBudgetDogId.get(bdr.budget_dog_id) ?? '') ?? '',
      recipeId: bdr.recipe_id,
      recipeName: recipeNameById.get(bdr.recipe_id) ?? '',
      assignedDays: bdr.assigned_days
    }));

    const recipeBreakdowns: RecipeCostBreakdown[] = [];

    for (const assignment of assignments) {
      const itemsForRecipe = recipeItems.filter((ri) => ri.recipe_id === assignment.recipeId);
      const items: RecipeItemDetail[] = itemsForRecipe.map((ri) => {
        const materialInfo = materialCostById.get(ri.raw_material_id);
        const dailyQty = Number(ri.daily_quantity);
        const unitCost = materialInfo?.cost ?? 0;
        const subtotal = dailyQty * unitCost * assignment.assignedDays;
        return {
          materialId: ri.raw_material_id,
          materialName: materialInfo?.name ?? '',
          baseUnit: materialInfo?.baseUnit ?? 'g',
          dailyQuantity: dailyQty,
          unitCost,
          subtotal
        };
      });

      const recipeTotal = items.reduce((sum, item) => sum + item.subtotal, 0);

      recipeBreakdowns.push({
        recipeId: assignment.recipeId,
        recipeName: assignment.recipeName,
        assignedDays: assignment.assignedDays,
        items,
        recipeTotal
      });
    }

    const operationalItems: OperationalLineItem[] = [
      { name: 'Bolsas vacío(chicas)', quantity: budget.vacuum_bag_small_qty, unitCost: settings.vacuum_bag_small_unit_cost, subtotal: budget.vacuum_bag_small_qty * settings.vacuum_bag_small_unit_cost },
      { name: 'Bolsas vacío(grandes)', quantity: budget.vacuum_bag_large_qty, unitCost: settings.vacuum_bag_large_unit_cost, subtotal: budget.vacuum_bag_large_qty * settings.vacuum_bag_large_unit_cost },
      { name: 'Etiquetas', quantity: budget.labels_qty, unitCost: settings.label_unit_cost, subtotal: budget.labels_qty * settings.label_unit_cost },
      { name: 'Bolsas de fiselina', quantity: budget.non_woven_bag_qty, unitCost: settings.non_woven_bag_unit_cost, subtotal: budget.non_woven_bag_qty * settings.non_woven_bag_unit_cost },
      { name: 'Horas mano de obra', quantity: budget.labor_hours_qty, unitCost: settings.labor_hour_cost, subtotal: budget.labor_hours_qty * settings.labor_hour_cost },
      { name: 'Horas cocción', quantity: budget.cooking_hours_qty, unitCost: settings.cooking_hour_cost, subtotal: budget.cooking_hours_qty * settings.cooking_hour_cost },
      { name: 'Calcio', quantity: budget.calcium_qty, unitCost: settings.calcium_unit_cost, subtotal: budget.calcium_qty * settings.calcium_unit_cost },
      { name: 'Kefir', quantity: budget.kefir_qty, unitCost: settings.kefir_unit_cost, subtotal: budget.kefir_qty * settings.kefir_unit_cost }
    ].filter((item) => item.quantity > 0);

    return {
      budget,
      recipeBreakdowns,
      operationalItems,
      settings,
      pageState: 'success' as const,
      pageMessage: null
    };
  } catch {
    return {
      budget: null,
      recipeBreakdowns: [],
      operationalItems: [],
      settings: null,
      pageState: 'error' as const,
      pageMessage: fallbackErrorMessage
    };
  }
};

export const actions: Actions = {
  sendWhatsapp: sendWhatsappAction,
  markSent: markSentAction
};
