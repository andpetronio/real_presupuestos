import type { PageServerLoad } from "./$types";

const toNumber = (value: number | string | null | undefined): number =>
  Number(value ?? 0);

export const load: PageServerLoad = async ({ locals }) => {
  const [ordersResult, topWholesalersResult, topProductsResult] =
    await Promise.all([
      locals.supabase
        .from("wholesale_orders")
        .select("id, status, total_units, total_ars, placed_at"),
      locals.supabase.rpc("wholesale_dashboard_top_wholesalers"),
      locals.supabase.rpc("wholesale_dashboard_top_products"),
    ]);

  const orders = ordersResult.data ?? [];

  const pendingCount = orders.filter(
    (order) => order.status === "received" || order.status === "in_preparation",
  ).length;
  const deliveredUnpaidCount = orders.filter(
    (order) => order.status === "delivered",
  ).length;
  const paidCount = orders.filter((order) => order.status === "paid").length;
  const totalArs = orders.reduce(
    (sum, row) => sum + toNumber(row.total_ars),
    0,
  );
  const totalUnits = orders.reduce(
    (sum, row) => sum + toNumber(row.total_units),
    0,
  );

  return {
    metrics: {
      pendingCount,
      deliveredUnpaidCount,
      paidCount,
      totalArs,
      totalUnits,
    },
    topWholesalers: topWholesalersResult.data ?? [],
    topProducts: topProductsResult.data ?? [],
  };
};
