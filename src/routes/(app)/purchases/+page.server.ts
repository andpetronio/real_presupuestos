import type { PageServerLoad } from "./$types";
import {
  aggregatePurchaseRequirementSnapshots,
  getPurchaseMonthRange,
  resolvePurchaseMonth,
} from "$lib/server/purchases/requirements";

const EMPTY_RESULT = {
  requirements: [],
  pageState: "success" as const,
  pageMessage: null,
};

export const load: PageServerLoad = async ({ locals, url }) => {
  const selectedMonth = resolvePurchaseMonth(
    url.searchParams.get("month"),
    new Date(),
  );
  const referenceMonth = getPurchaseMonthRange(selectedMonth);

  try {
    const snapshotsResult = await locals.supabase
      .from("purchase_requirement_snapshots")
      .select(
        "raw_material_id, raw_material_name, base_unit, wastage_percentage, yield_factor, net_quantity, purchase_quantity",
      )
      .gte("reference_month", referenceMonth.start)
      .lt("reference_month", referenceMonth.end);

    if (snapshotsResult.error) throw snapshotsResult.error;

    return {
      requirements: aggregatePurchaseRequirementSnapshots(
        (snapshotsResult.data ?? []).map((snapshot) => ({
          rawMaterialId: snapshot.raw_material_id,
          rawMaterialName: snapshot.raw_material_name,
          baseUnit: snapshot.base_unit,
          wastagePercentage: Number(snapshot.wastage_percentage),
          yieldFactor: Number(snapshot.yield_factor),
          netQuantity: Number(snapshot.net_quantity),
          purchaseQuantity:
            snapshot.purchase_quantity === null
              ? null
              : Number(snapshot.purchase_quantity),
        })),
      ),
      referenceMonth: selectedMonth,
      pageState: "success" as const,
      pageMessage: null,
    };
  } catch {
    return {
      requirements: [],
      referenceMonth: selectedMonth,
      pageState: "error" as const,
      pageMessage: "No pudimos cargar el consolidado de compras.",
    };
  }
};
