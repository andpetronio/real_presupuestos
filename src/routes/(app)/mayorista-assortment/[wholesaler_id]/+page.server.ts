import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import type { AssortmentProductRow } from "$lib/types/view-models/wholesale-assortment";

const parseText = (value: FormDataEntryValue | null): string =>
  typeof value === "string" ? value.trim() : "";

export const load: PageServerLoad = async ({ locals, params, url }) => {
  const filters = {
    search: url.searchParams.get("q")?.trim() ?? "",
    status: url.searchParams.get("status")?.trim() ?? "all",
    availability: url.searchParams.get("availability")?.trim() ?? "all",
  };

  const wholesalerResult = await locals.supabase
    .from("wholesalers")
    .select("id, name, unique_random_code, min_total_units, is_active")
    .eq("id", params.wholesaler_id)
    .maybeSingle();

  if (wholesalerResult.error || !wholesalerResult.data) {
    throw redirect(303, "/mayorista-assortment");
  }

  let productsQuery = locals.supabase
    .from("wholesale_products")
    .select("id, name, presentation, is_active")
    .order("name", { ascending: true })
    .order("presentation", { ascending: true });

  if (filters.search) {
    productsQuery = productsQuery.or(
      `name.ilike.%${filters.search}%,presentation.ilike.%${filters.search}%`,
    );
  }

  if (filters.status === "active") {
    productsQuery = productsQuery.eq("is_active", true);
  } else if (filters.status === "inactive") {
    productsQuery = productsQuery.eq("is_active", false);
  }

  const productsResult = await productsQuery;
  if (productsResult.error) {
    return {
      wholesaler: wholesalerResult.data,
      products: [] as AssortmentProductRow[],
      filters,
      tableState: "error" as const,
      tableMessage: {
        title: "No pudimos cargar el surtido",
        detail: "Reintentá en unos segundos o revisá la conexión con la base.",
      },
    };
  }

  const productIds = (productsResult.data ?? []).map((product) => product.id);
  const assignmentsResult = productIds.length
    ? await locals.supabase
        .from("wholesaler_products")
        .select("id, product_id, is_enabled")
        .eq("wholesaler_id", params.wholesaler_id)
        .in("product_id", productIds)
    : { data: [], error: null };

  if (assignmentsResult.error) {
    return {
      wholesaler: wholesalerResult.data,
      products: [] as AssortmentProductRow[],
      filters,
      tableState: "error" as const,
      tableMessage: {
        title: "No pudimos cargar el surtido",
        detail: "Reintentá en unos segundos o revisá la conexión con la base.",
      },
    };
  }

  const enabledByProductId = new Map<string, boolean>();
  for (const assignment of assignmentsResult.data ?? []) {
    enabledByProductId.set(assignment.product_id, assignment.is_enabled);
  }

  let products: AssortmentProductRow[] = (productsResult.data ?? []).map(
    (product) => ({
      ...product,
      is_enabled: enabledByProductId.get(product.id) ?? false,
    }),
  );

  if (filters.availability === "enabled") {
    products = products.filter((product) => product.is_enabled);
  } else if (filters.availability === "disabled") {
    products = products.filter((product) => !product.is_enabled);
  }

  return {
    wholesaler: wholesalerResult.data,
    products,
    filters,
    tableState: products.length > 0 ? ("success" as const) : ("empty" as const),
    tableMessage:
      products.length > 0
        ? null
        : {
            title: "Sin productos para mostrar",
            detail:
              "No encontramos productos con los filtros aplicados para este mayorista.",
          },
  };
};

export const actions: Actions = {
  toggleProduct: async ({ request, locals }) => {
    const formData = await request.formData();
    const wholesalerId = parseText(formData.get("wholesalerId"));
    const productId = parseText(formData.get("productId"));
    const enabled = parseText(formData.get("enabled")) === "true";

    if (!wholesalerId || !productId) {
      return fail(400, {
        operatorError: "Faltan datos para actualizar el surtido.",
      });
    }

    const existingResult = await locals.supabase
      .from("wholesaler_products")
      .select("id")
      .eq("wholesaler_id", wholesalerId)
      .eq("product_id", productId)
      .maybeSingle();

    if (existingResult.error) {
      return fail(400, {
        operatorError: "No pudimos actualizar el surtido del mayorista.",
      });
    }

    if (existingResult.data?.id) {
      const { error } = await locals.supabase
        .from("wholesaler_products")
        .update({ is_enabled: enabled })
        .eq("id", existingResult.data.id);

      if (error) {
        return fail(400, {
          operatorError: "No pudimos actualizar el surtido del mayorista.",
        });
      }
    } else {
      const { error } = await locals.supabase
        .from("wholesaler_products")
        .insert({
          wholesaler_id: wholesalerId,
          product_id: productId,
          is_enabled: enabled,
        });

      if (error) {
        return fail(400, {
          operatorError: "No pudimos actualizar el surtido del mayorista.",
        });
      }
    }

    return {
      operatorSuccess: enabled
        ? "Producto habilitado para el mayorista."
        : "Producto deshabilitado para el mayorista.",
    };
  },
};
