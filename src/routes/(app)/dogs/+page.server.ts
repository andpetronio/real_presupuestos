import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import {
  parsePositiveInteger,
  parseFormValue,
} from "$lib/server/forms/parsers";
import {
  buildFallbackError,
  getTableState,
  getPagination,
  applyListFilters,
} from "$lib/server/shared/list-helpers";

const EMPTY_LABELS = {
  title: "Todavía no hay perros cargados",
  detail: 'Creá el primero desde "Nuevo perro".',
};

export const load: PageServerLoad = async ({ locals, url }) => {
  const { page, pageSize, offset } = getPagination(
    url.searchParams.get("page"),
  );
  const filters = {
    search: url.searchParams.get("q")?.trim() ?? "",
    status: url.searchParams.get("status") ?? "all",
  };

  try {
    let query = locals.supabase
      .from("dogs")
      .select(
        "id, name, diet_type, meals_per_day, is_active, notes, created_at, tutor:tutors(full_name), veterinary:veterinaries(name)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    query = applyListFilters(query, filters, {
      searchColumn: "name",
      hasStatusFilter: true,
    });

    const { data, count, error } = await query.range(
      offset,
      offset + pageSize - 1,
    );

    if (error) throw error;

    const dogs = data ?? [];
    const total = count ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    const { tableState, tableMessage } = getTableState(
      total,
      filters,
      EMPTY_LABELS,
    );

    return {
      dogs,
      filters,
      pagination: { page, totalPages, total },
      tableState,
      tableMessage,
    };
  } catch {
    return {
      dogs: [],
      filters,
      pagination: { page: 1, totalPages: 1, total: 0 },
      tableState: "error",
      tableMessage: buildFallbackError("perros"),
    };
  }
};

export const actions: Actions = {
  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const dogId = parseFormValue(formData.get("dogId"));

    if (!dogId) {
      return fail(400, {
        actionType: "delete",
        operatorError: "No encontramos el perro a desactivar.",
      });
    }

    const { error } = await locals.supabase
      .from("dogs")
      .update({ is_active: false })
      .eq("id", dogId);

    if (error) {
      return fail(400, {
        actionType: "delete",
        operatorError:
          "No pudimos desactivar el perro. Reintentá en unos segundos.",
      });
    }

    return {
      actionType: "delete",
      operatorSuccess: "Perro desactivado correctamente.",
    };
  },
};
