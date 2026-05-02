import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import {
  buildFallbackError,
  getPagination,
  getTableState,
} from "$lib/server/shared/list-helpers";
import { parseSortState } from "$lib/server/shared/sorting";
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
import type { WholesaleOrderListRow } from "$lib/types/view-models/wholesale-orders";

const EMPTY_LABELS = {
  title: "Todavía no hay pedidos mayoristas",
  detail: "Cuando un mayorista envíe un pedido, aparecerá acá.",
};

export const load: PageServerLoad = async ({ locals, url }) => {
  const { page, pageSize, offset } = getPagination(
    url.searchParams.get("page"),
  );
  const sort = parseSortState({
    searchParams: url.searchParams,
    allowedSortBy: [
      "wholesaler",
      "placed_at",
      "expected_delivery_at",
      "status",
      "total_units",
      "total_ars",
    ] as const,
    defaultSort: { sortBy: "wholesaler", sortDir: "asc" },
  });
  const filters = {
    search: url.searchParams.get("q")?.trim() ?? "",
    status: url.searchParams.get("status")?.trim() ?? "all",
  };

  try {
    let matchingWholesalerIds: string[] = [];
    if (filters.search) {
      const wholesalersResult = await locals.supabase
        .from("wholesalers")
        .select("id")
        .ilike("name", `%${filters.search}%`)
        .limit(100);

      if (wholesalersResult.error) {
        throw wholesalersResult.error;
      }

      matchingWholesalerIds = (wholesalersResult.data ?? []).map(
        (row) => row.id,
      );
    }

    let query = locals.supabase
      .from("wholesale_orders")
      .select(
        "id, wholesaler_id, status, total_units, total_ars, notes, placed_at, expected_delivery_at, delivered_at, ready_at, paid_at, payment_method, wholesaler:wholesalers(name)",
        { count: "exact" },
      );

    if (sort.sortBy === "wholesaler") {
      query = query.order("wholesaler(name)", {
        ascending: sort.sortDir === "asc",
      });
    } else {
      query = query.order(sort.sortBy, { ascending: sort.sortDir === "asc" });
    }
    query = query
      .order("placed_at", { ascending: false })
      .order("id", { ascending: true });

    if (filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.search) {
      if (matchingWholesalerIds.length > 0) {
        query = query.or(
          `notes.ilike.%${filters.search}%,wholesaler_id.in.(${matchingWholesalerIds.join(",")})`,
        );
      } else {
        query = query.ilike("notes", `%${filters.search}%`);
      }
    }

    const { data, count, error } = await query.range(
      offset,
      offset + pageSize - 1,
    );
    if (error) {
      throw error;
    }

    const orders: WholesaleOrderListRow[] = (data ?? []).map((row) => ({
      id: row.id,
      status: row.status,
      statusLabel: toStatusLabel(row.status),
      wholesalerName:
        (row.wholesaler as { name?: string } | null)?.name ?? "Mayorista",
      total_units: Number(row.total_units ?? 0),
      total_ars: Number(row.total_ars ?? 0),
      notes: row.notes,
      placed_at: row.placed_at,
      expected_delivery_at: row.expected_delivery_at,
      ready_at: row.ready_at,
      paid_at: row.paid_at,
      payment_method: row.payment_method,
      ...getDeliveryTiming({
        expectedDeliveryAt: row.expected_delivery_at,
        status: row.status,
      }),
    }));

    const total = count ?? 0;
    const { tableState, tableMessage } = getTableState(
      total,
      filters,
      EMPTY_LABELS,
    );

    return {
      orders,
      filters,
      sort,
      pagination: {
        page,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        total,
      },
      tableState,
      tableMessage,
    };
  } catch {
    return {
      orders: [] as WholesaleOrderListRow[],
      filters,
      sort: { sortBy: "wholesaler", sortDir: "asc" as const },
      pagination: { page: 1, totalPages: 1, total: 0 },
      tableState: "error" as const,
      tableMessage: buildFallbackError("pedidos mayoristas"),
    };
  }
};

export const actions: Actions = {
  markInPreparation: async ({ request, locals }) => {
    const formData = await request.formData();
    return markWholesaleOrderInPreparation({
      supabase: locals.supabase,
      orderId: parseText(formData.get("orderId")),
    });
  },
  markReady: async ({ request, locals }) => {
    const formData = await request.formData();
    return markWholesaleOrderReady({
      supabase: locals.supabase,
      orderId: parseText(formData.get("orderId")),
    });
  },
  markDelivered: async ({ request, locals }) => {
    const formData = await request.formData();
    return markWholesaleOrderDelivered({
      supabase: locals.supabase,
      orderId: parseText(formData.get("orderId")),
    });
  },
  markPaid: async ({ request, locals }) => {
    const formData = await request.formData();
    return markWholesaleOrderPaid({
      supabase: locals.supabase,
      orderId: parseText(formData.get("orderId")),
      paymentMethod: parsePaymentMethod(formData.get("paymentMethod")),
    });
  },
  updatePreparedQuantity: async ({ request, locals }) => {
    const formData = await request.formData();
    const itemId = parseText(formData.get("itemId"));
    const quantityRaw = parseText(formData.get("preparedQuantity"));
    const preparedQuantity = Number(quantityRaw);

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
};
