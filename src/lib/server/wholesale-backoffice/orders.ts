import { fail } from "@sveltejs/kit";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  WholesaleOrderStatus,
  WholesalePaymentMethod,
} from "$lib/types/view-models/wholesale-orders";

export const parseText = (value: FormDataEntryValue | null): string =>
  typeof value === "string" ? value.trim() : "";

export const toStatusLabel = (status: string): string => {
  if (status === "received") return "Recibido";
  if (status === "in_preparation") return "En preparación";
  if (status === "ready") return "Listo";
  if (status === "delivered") return "Entregado";
  if (status === "paid") return "Cobrado";
  return status;
};

export const paymentMethods = new Set<WholesalePaymentMethod>([
  "cash",
  "transfer",
  "mercadopago",
  "other",
]);

export const parsePaymentMethod = (
  value: FormDataEntryValue | null,
): WholesalePaymentMethod | null => {
  const parsed = parseText(value) as WholesalePaymentMethod;
  return paymentMethods.has(parsed) ? parsed : null;
};

export const getDeliveryTiming = (params: {
  expectedDeliveryAt: string;
  status: WholesaleOrderStatus;
  now?: Date;
}): { isOverdue: boolean; daysToDelivery: number } => {
  const expectedDate = new Date(params.expectedDeliveryAt);
  if (Number.isNaN(expectedDate.getTime())) {
    return { isOverdue: false, daysToDelivery: 0 };
  }
  const now = params.now ?? new Date();
  const dayMs = 1000 * 60 * 60 * 24;
  const diffDays = Math.ceil(
    (expectedDate.getTime() - now.getTime()) / dayMs,
  );
  const isFinal = params.status === "delivered";
  const isOverdue = !isFinal && diffDays < 0;
  return { isOverdue, daysToDelivery: diffDays };
};

const getOrderStatus = async (params: {
  supabase: SupabaseClient;
  orderId: string;
}) => {
  return params.supabase
    .from("wholesale_orders")
    .select("status")
    .eq("id", params.orderId)
    .maybeSingle();
};

export const markWholesaleOrderInPreparation = async (params: {
  supabase: SupabaseClient;
  orderId: string;
}) => {
  if (!params.orderId) {
    return fail(400, { operatorError: "No encontramos el pedido." });
  }

  const orderResult = await getOrderStatus(params);

  if (orderResult.error || !orderResult.data) {
    return fail(400, { operatorError: "No encontramos el pedido." });
  }

  if (orderResult.data.status !== "received") {
    return fail(400, {
      operatorError:
        "Solo podés pasar a preparación un pedido en estado recibido.",
    });
  }

  const { error } = await params.supabase
    .from("wholesale_orders")
    .update({ status: "in_preparation" })
    .eq("id", params.orderId);

  if (error) {
    return fail(400, { operatorError: "No pudimos actualizar el pedido." });
  }

  return { operatorSuccess: "Pedido marcado en preparación." };
};

export const markWholesaleOrderReady = async (params: {
  supabase: SupabaseClient;
  orderId: string;
}) => {
  if (!params.orderId) {
    return fail(400, { operatorError: "No encontramos el pedido." });
  }

  const orderResult = await getOrderStatus(params);

  if (orderResult.error || !orderResult.data) {
    return fail(400, { operatorError: "No encontramos el pedido." });
  }

  if (
    orderResult.data.status !== "received" &&
    orderResult.data.status !== "in_preparation"
  ) {
    return fail(400, {
      operatorError:
        "Solo podés marcar como listo un pedido recibido o en preparación.",
    });
  }

  const { error } = await params.supabase
    .from("wholesale_orders")
    .update({
      status: "ready",
      ready_at: new Date().toISOString(),
    })
    .eq("id", params.orderId);

  if (error) {
    return fail(400, { operatorError: "No pudimos actualizar el pedido." });
  }

  return { operatorSuccess: "Pedido marcado como listo." };
};

export const markWholesaleOrderDelivered = async (params: {
  supabase: SupabaseClient;
  orderId: string;
}) => {
  if (!params.orderId) {
    return fail(400, { operatorError: "No encontramos el pedido." });
  }

  const orderResult = await getOrderStatus(params);

  if (orderResult.error || !orderResult.data) {
    return fail(400, { operatorError: "No encontramos el pedido." });
  }

  if (orderResult.data.status !== "ready") {
    return fail(400, {
      operatorError: "Solo podés marcar como entregado un pedido listo.",
    });
  }

  const { error } = await params.supabase
    .from("wholesale_orders")
    .update({
      status: "delivered",
      delivered_at: new Date().toISOString(),
    })
    .eq("id", params.orderId);

  if (error) {
    return fail(400, { operatorError: "No pudimos actualizar el pedido." });
  }

  return { operatorSuccess: "Pedido marcado como entregado." };
};

export const markWholesaleOrderPaid = async (params: {
  supabase: SupabaseClient;
  orderId: string;
  paymentMethod: WholesalePaymentMethod | null;
}) => {
  if (!params.orderId) {
    return fail(400, { operatorError: "No encontramos el pedido." });
  }

  if (!params.paymentMethod) {
    return fail(400, {
      operatorError: "Seleccioná un método de pago válido.",
    });
  }

  const orderResult = await getOrderStatus(params);

  if (orderResult.error || !orderResult.data) {
    return fail(400, { operatorError: "No encontramos el pedido." });
  }

  const { error } = await params.supabase
    .from("wholesale_orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      payment_method: params.paymentMethod,
    })
    .eq("id", params.orderId);

  if (error) {
    return fail(400, { operatorError: "No pudimos actualizar el pedido." });
  }

  return { operatorSuccess: "Pedido marcado como cobrado." };
};
