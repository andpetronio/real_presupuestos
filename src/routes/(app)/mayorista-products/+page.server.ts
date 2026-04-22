import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import {
  applyListFilters,
  buildFallbackError,
  getPagination,
  getTableState,
} from "$lib/server/shared/list-helpers";
import { parseText } from "$lib/server/wholesale-backoffice/products";
import { parseSortState } from "$lib/server/shared/sorting";

const EMPTY_LABELS = {
  title: "Todavía no hay productos mayoristas",
  detail: "Creá productos para habilitar compras.",
};

export const load: PageServerLoad = async ({ locals, url }) => {
  const { page, pageSize, offset } = getPagination(
    url.searchParams.get("page"),
  );
  const sort = parseSortState({
    searchParams: url.searchParams,
    allowedSortBy: [
      "name",
      "presentation",
      "price_ars",
      "is_active",
      "created_at",
    ] as const,
    defaultSort: { sortBy: "name", sortDir: "asc" },
  });
  const filters = {
    search: url.searchParams.get("q")?.trim() ?? "",
    status: url.searchParams.get("status")?.trim() ?? "active",
  };

  try {
    let query = locals.supabase
      .from("wholesale_products")
      .select(
        "id, name, presentation, price_ars, description, is_active, created_at",
        { count: "exact" },
      );

    query = query.order(sort.sortBy, { ascending: sort.sortDir === "asc" });
    query = query
      .order("presentation", { ascending: true })
      .order("created_at", { ascending: false })
      .order("id", { ascending: true });

    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,presentation.ilike.%${filters.search}%`,
      );
    }

    query = applyListFilters(query, filters, {
      searchColumn: undefined,
      hasStatusFilter: true,
    });

    const { data, count, error } = await query.range(
      offset,
      offset + pageSize - 1,
    );
    if (error) throw error;

    const productIds = (data ?? []).map((row) => row.id);
    const imagesResult =
      productIds.length > 0
        ? await locals.supabase
            .from("wholesale_product_images")
            .select("id, product_id, public_url, sort_order")
            .in("product_id", productIds)
            .order("sort_order", { ascending: true })
        : { data: [], error: null };

    if (imagesResult.error) throw imagesResult.error;

    const imagesByProductId = new Map<
      string,
      Array<{ id: string; public_url: string; sort_order: number }>
    >();
    for (const image of imagesResult.data ?? []) {
      const existing = imagesByProductId.get(image.product_id) ?? [];
      existing.push(image);
      imagesByProductId.set(image.product_id, existing);
    }

    const products = (data ?? []).map((row) => ({
      ...row,
      images: imagesByProductId.get(row.id) ?? [],
    }));

    const total = count ?? 0;
    const { tableState, tableMessage } = getTableState(
      total,
      filters,
      EMPTY_LABELS,
    );

    return {
      products,
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
      products: [],
      filters,
      sort: { sortBy: "name", sortDir: "asc" as const },
      pagination: { page: 1, totalPages: 1, total: 0 },
      tableState: "error" as const,
      tableMessage: buildFallbackError("productos mayoristas"),
    };
  }
};

export const actions: Actions = {
  toggleActive: async ({ request, locals }) => {
    const formData = await request.formData();
    const id = parseText(formData.get("id"));
    const shouldActivate = parseText(formData.get("activate")) === "true";
    if (!id) {
      return fail(400, { operatorError: "No encontramos el producto." });
    }

    const { error } = await locals.supabase
      .from("wholesale_products")
      .update({ is_active: shouldActivate })
      .eq("id", id);

    if (error) {
      return fail(400, {
        operatorError: "No pudimos actualizar el estado del producto.",
      });
    }

    return {
      operatorSuccess: shouldActivate
        ? "Producto restaurado."
        : "Producto desactivado.",
    };
  },
};
