import { fail } from "@sveltejs/kit";
import type { SupabaseClient } from "@supabase/supabase-js";

export const parseText = (value: FormDataEntryValue | null): string =>
  typeof value === "string" ? value.trim() : "";

export const toStatusLabel = (status: string): string => {
  if (status === "pending") return "Pendiente";
  if (status === "delivered") return "Entregado";
  if (status === "paid") return "Cobrado";
  return status;
};

export const markWholesaleOrderDelivered = async (params: {
  supabase: SupabaseClient;
  orderId: string;
}) => {
  if (!params.orderId) {
    return fail(400, { operatorError: "No encontramos el pedido." });
  }

  const orderResult = await params.supabase
    .from("wholesale_orders")
    .select("status")
    .eq("id", params.orderId)
    .maybeSingle();

  if (orderResult.error || !orderResult.data) {
    return fail(400, { operatorError: "No encontramos el pedido." });
  }

  if (orderResult.data.status !== "pending") {
    return fail(400, {
      operatorError: "Solo podés marcar como entregado un pedido pendiente.",
    });
  }

  const { error } = await params.supabase
    .from("wholesale_orders")
    .update({ status: "delivered", delivered_at: new Date().toISOString() })
    .eq("id", params.orderId);

  if (error) {
    return fail(400, { operatorError: "No pudimos actualizar el pedido." });
  }

  return { operatorSuccess: "Pedido marcado como entregado." };
};

export const markWholesaleOrderPaid = async (params: {
  supabase: SupabaseClient;
  orderId: string;
}) => {
  if (!params.orderId) {
    return fail(400, { operatorError: "No encontramos el pedido." });
  }

  const orderResult = await params.supabase
    .from("wholesale_orders")
    .select("status")
    .eq("id", params.orderId)
    .maybeSingle();

  if (orderResult.error || !orderResult.data) {
    return fail(400, { operatorError: "No encontramos el pedido." });
  }

  if (orderResult.data.status !== "delivered") {
    return fail(400, {
      operatorError: "Solo podés marcar como cobrado un pedido entregado.",
    });
  }

  const { error } = await params.supabase
    .from("wholesale_orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", params.orderId);

  if (error) {
    return fail(400, { operatorError: "No pudimos actualizar el pedido." });
  }

  return { operatorSuccess: "Pedido marcado como cobrado." };
};
