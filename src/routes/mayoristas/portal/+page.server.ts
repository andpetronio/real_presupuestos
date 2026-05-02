import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import {
  clearWholesalerSessionCookie,
  readWholesalerSessionTokenHash,
} from "$lib/server/wholesale/session";

type PortalProduct = {
  id: string;
  name: string;
  presentation: string;
  description?: string;
  price_ars: number;
  images: Array<{
    id: string;
    public_url: string;
    sort_order: number;
  }>;
};

type PortalDataPayload = {
  ok: boolean;
  error_code?: string;
  wholesaler?: {
    id: string;
    name: string;
    min_total_units: number;
  };
  products?: PortalProduct[];
};

const resolvePortalData = async (
  params: Parameters<PageServerLoad>[0],
): Promise<PortalDataPayload | null> => {
  const tokenHash = readWholesalerSessionTokenHash(params.cookies);
  if (!tokenHash) return null;

  const { data, error } = await params.locals.supabase.rpc(
    "wholesale_get_portal_data",
    {
      p_session_token_hash: tokenHash,
    },
  );

  if (error || !data) {
    return null;
  }

  return data as PortalDataPayload;
};

export const load: PageServerLoad = async (event) => {
  const payload = await resolvePortalData(event);

  if (!payload?.ok || !payload.wholesaler) {
    clearWholesalerSessionCookie(event.cookies);
    throw redirect(303, "/mayoristas/login");
  }

  return {
    wholesaler: payload.wholesaler,
    products: payload.products ?? [],
  };
};

export const actions: Actions = {
  placeOrder: async (event) => {
    const tokenHash = readWholesalerSessionTokenHash(event.cookies);
    if (!tokenHash) {
      clearWholesalerSessionCookie(event.cookies);
      throw redirect(303, "/mayoristas/login");
    }

    const formData = await event.request.formData();
    const notesEntry = formData.get("notes");
    const notes = typeof notesEntry === "string" ? notesEntry.trim() : "";

    const itemsEntry = formData.get("items");
    const itemsRaw = typeof itemsEntry === "string" ? itemsEntry : "[]";

    let items: unknown;
    try {
      items = JSON.parse(itemsRaw);
    } catch {
      return fail(400, {
        operatorError: "No pudimos procesar el carrito. Reintentá.",
        orderCreated: false,
      });
    }

    const { data, error } = await event.locals.supabase.rpc(
      "wholesale_place_order",
      {
        p_session_token_hash: tokenHash,
        p_items: items,
        p_notes: notes,
      },
    );

    if (error) {
      return fail(400, {
        operatorError:
          "No pudimos registrar el pedido. Reintentá en unos segundos.",
        orderCreated: false,
      });
    }

    const row = ((data as Array<{
      ok: boolean;
      order_id: string | null;
      total_units: number;
      total_ars: number;
      error_code: string | null;
    }> | null) ?? [])[0];

    if (!row?.ok || !row.order_id) {
      const messageByCode: Record<string, string> = {
        empty_cart: "Tu carrito está vacío.",
        no_valid_items: "Tu carrito no tiene productos válidos.",
        min_units_not_met:
          "No alcanzaste el mínimo de unidades para enviar el pedido.",
        session_invalid: "Tu sesión venció. Volvé a ingresar.",
      };

      if (row?.error_code === "session_invalid") {
        clearWholesalerSessionCookie(event.cookies);
        throw redirect(303, "/mayoristas/login");
      }

      return fail(400, {
        operatorError:
          messageByCode[row?.error_code ?? ""] ??
          "No pudimos registrar el pedido.",
        orderCreated: false,
      });
    }

    return {
      orderCreated: true,
      operatorSuccess: "¡Pedido enviado! Lo registramos como recibido.",
      orderId: row.order_id,
      totalUnits: row.total_units,
      totalArs: Number(row.total_ars),
    };
  },
};
