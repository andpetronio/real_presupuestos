import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import {
  getDeliveryTiming,
  markWholesaleOrderDelivered,
  markWholesaleOrderInPreparation,
  markWholesaleOrderReady,
  markWholesaleOrderPaid,
  parsePaymentMethod,
  parseText,
  toStatusLabel,
} from "$lib/server/wholesale-backoffice/orders";
import type { WholesaleOrderDetailView } from "$lib/types/view-models/wholesale-orders";

export const load: PageServerLoad = async ({ locals, params }) => {
  const orderResult = await locals.supabase
    .from("wholesale_orders")
    .select(
      "id, status, total_units, total_ars, notes, placed_at, expected_delivery_at, delivered_at, ready_at, paid_at, payment_method, wholesaler:wholesalers(name)",
    )
    .eq("id", params.order_id)
    .maybeSingle();

  if (orderResult.error || !orderResult.data) {
    throw redirect(303, "/mayorista-orders");
  }

  const itemsResult = await locals.supabase
    .from("wholesale_order_items")
    .select(
      "id, order_id, quantity, prepared_quantity, unit_price_ars_snapshot, line_total_ars_snapshot, product_name_snapshot, presentation_snapshot",
    )
    .eq("order_id", params.order_id)
    .order("created_at", { ascending: true });

  if (itemsResult.error) {
    throw redirect(303, "/mayorista-orders");
  }

  const order: WholesaleOrderDetailView = {
    id: orderResult.data.id,
    status: orderResult.data.status,
    statusLabel: toStatusLabel(orderResult.data.status),
    wholesalerName:
      (orderResult.data.wholesaler as { name?: string } | null)?.name ??
      "Mayorista",
    total_units: Number(orderResult.data.total_units ?? 0),
    total_ars: Number(orderResult.data.total_ars ?? 0),
    notes: orderResult.data.notes,
    placed_at: orderResult.data.placed_at,
    expected_delivery_at: orderResult.data.expected_delivery_at,
    delivered_at: orderResult.data.delivered_at,
    ready_at: orderResult.data.ready_at,
    paid_at: orderResult.data.paid_at,
    payment_method: orderResult.data.payment_method,
    ...getDeliveryTiming({
      expectedDeliveryAt: orderResult.data.expected_delivery_at,
      status: orderResult.data.status,
    }),
    items: (itemsResult.data ?? []).map((item) => ({
      id: item.id,
      order_id: item.order_id,
      quantity: Number(item.quantity ?? 0),
      prepared_quantity: Number(item.prepared_quantity ?? 0),
      unit_price_ars_snapshot: Number(item.unit_price_ars_snapshot ?? 0),
      line_total_ars_snapshot: Number(item.line_total_ars_snapshot ?? 0),
      product_name_snapshot: item.product_name_snapshot,
      presentation_snapshot: item.presentation_snapshot,
    })),
  };

  return { order };
};

export const actions: Actions = {
  markInPreparation: async ({ locals, params }) =>
    markWholesaleOrderInPreparation({
      supabase: locals.supabase,
      orderId: params.order_id,
    }),
  markReady: async ({ locals, params }) =>
    markWholesaleOrderReady({
      supabase: locals.supabase,
      orderId: params.order_id,
    }),
  markDelivered: async ({ locals, params }) =>
    markWholesaleOrderDelivered({
      supabase: locals.supabase,
      orderId: params.order_id,
    }),
  updatePreparedQuantity: async ({ request, locals }) => {
    const formData = await request.formData();
    const itemId = parseText(formData.get("itemId"));
    const preparedQuantityRaw = parseText(formData.get("preparedQuantity"));
    const preparedQuantity = Number(preparedQuantityRaw);

    if (!itemId || !Number.isFinite(preparedQuantity) || preparedQuantity < 0) {
      return fail(400, {
        operatorError: "Ingresá una cantidad preparada válida (>= 0).",
      });
    }

    const { error } = await locals.supabase
      .from("wholesale_order_items")
      .update({ prepared_quantity: Math.floor(preparedQuantity) })
      .eq("id", itemId);

    if (error) {
      return fail(400, {
        operatorError: "No pudimos actualizar la preparación parcial.",
      });
    }

    return { operatorSuccess: "Preparación parcial actualizada." };
  },
  markPaid: async ({ request, locals, params }) => {
    const formData = await request.formData();
    return markWholesaleOrderPaid({
      supabase: locals.supabase,
      orderId: params.order_id,
      paymentMethod: parsePaymentMethod(formData.get("paymentMethod")),
    });
  },
};
