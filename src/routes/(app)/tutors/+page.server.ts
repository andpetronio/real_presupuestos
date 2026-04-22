import type { PageServerLoad, Actions } from "./$types";
import { fail } from "@sveltejs/kit";
import { parseFormValue } from "$lib/server/forms/parsers";
import {
  buildFallbackError,
  getTableState,
  getPagination,
  applyListFilters,
} from "$lib/server/shared/list-helpers";
import { parseSortState } from "$lib/server/shared/sorting";

const EMPTY_LABELS = {
  title: "Todavía no hay tutores cargados",
  detail: 'Creá el primero desde "Nuevo tutor".',
};

export const load: PageServerLoad = async ({ locals, url }) => {
  const { page, pageSize, offset } = getPagination(
    url.searchParams.get("page"),
  );
  const sort = parseSortState({
    searchParams: url.searchParams,
    allowedSortBy: ["full_name", "whatsapp_number", "is_active"] as const,
    defaultSort: { sortBy: "full_name", sortDir: "asc" },
  });
  const filters = {
    search: url.searchParams.get("q")?.trim() ?? "",
    status: url.searchParams.get("status")?.trim() ?? "active",
  };

  try {
    let query = locals.supabase
      .from("tutors")
      .select("id, full_name, whatsapp_number, notes, is_active, created_at", {
        count: "exact",
      });

    query = query.order(sort.sortBy, { ascending: sort.sortDir === "asc" });
    query = query
      .order("created_at", { ascending: false })
      .order("id", { ascending: true });

    query = applyListFilters(query, filters, {
      searchColumn: "full_name",
      hasStatusFilter: true,
    });

    const { data, count, error } = await query.range(
      offset,
      offset + pageSize - 1,
    );

    if (error) throw error;

    const tutors = data ?? [];
    const total = count ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    const { tableState, tableMessage } = getTableState(
      total,
      filters,
      EMPTY_LABELS,
    );

    return {
      tutors,
      filters,
      sort,
      pagination: { page, totalPages, total },
      tableState,
      tableMessage,
    };
  } catch {
    return {
      tutors: [],
      filters,
      sort: { sortBy: "full_name", sortDir: "asc" as const },
      pagination: { page: 1, totalPages: 1, total: 0 },
      tableState: "error",
      tableMessage: buildFallbackError("tutores"),
    };
  }
};

export const actions: Actions = {
  delete: async ({ request, locals }) => {
    const formData = await request.formData();
    const tutorId = parseFormValue(formData.get("tutorId"));

    if (!tutorId) {
      return fail(400, {
        actionType: "delete",
        operatorError: "No encontramos el tutor a desactivar.",
      });
    }

    const { error: tutorError } = await locals.supabase
      .from("tutors")
      .update({ is_active: false })
      .eq("id", tutorId);

    if (tutorError) {
      return fail(400, {
        actionType: "delete",
        operatorError:
          "No pudimos desactivar el tutor. Reintenta en unos segundos.",
      });
    }

    const { data: dogRows, error: dogsQueryError } = await locals.supabase
      .from("dogs")
      .select("id")
      .eq("tutor_id", tutorId);

    if (dogsQueryError) {
      return fail(400, {
        actionType: "delete",
        operatorError:
          "No pudimos aplicar la cascada de desactivacion para perros y recetas.",
      });
    }

    const dogIds = (dogRows ?? []).map((dog: { id: string }) => dog.id);

    const { error: dogsUpdateError } = await locals.supabase
      .from("dogs")
      .update({ is_active: false })
      .eq("tutor_id", tutorId);

    if (dogsUpdateError) {
      return fail(400, {
        actionType: "delete",
        operatorError: "No pudimos desactivar los perros del tutor.",
      });
    }

    if (dogIds.length > 0) {
      const { error: recipesUpdateError } = await locals.supabase
        .from("recipes")
        .update({ is_active: false })
        .in("dog_id", dogIds);

      if (recipesUpdateError) {
        return fail(400, {
          actionType: "delete",
          operatorError: "No pudimos desactivar las recetas del tutor.",
        });
      }
    }

    return {
      actionType: "delete",
      operatorSuccess:
        "Tutor desactivado correctamente. Perros y recetas asociados quedaron inactivos.",
    };
  },

  restore: async ({ request, locals }) => {
    const formData = await request.formData();
    const tutorId = parseFormValue(formData.get("tutorId"));

    if (!tutorId) {
      return fail(400, {
        actionType: "restore",
        operatorError: "No encontramos el tutor a restaurar.",
      });
    }

    const { error: tutorError } = await locals.supabase
      .from("tutors")
      .update({ is_active: true })
      .eq("id", tutorId);

    if (tutorError) {
      return fail(400, {
        actionType: "restore",
        operatorError:
          "No pudimos restaurar el tutor. Reintenta en unos segundos.",
      });
    }

    const { data: dogRows, error: dogsQueryError } = await locals.supabase
      .from("dogs")
      .select("id")
      .eq("tutor_id", tutorId);

    if (dogsQueryError) {
      return fail(400, {
        actionType: "restore",
        operatorError:
          "No pudimos aplicar la cascada de restauracion para perros y recetas.",
      });
    }

    const dogIds = (dogRows ?? []).map((dog: { id: string }) => dog.id);

    const { error: dogsUpdateError } = await locals.supabase
      .from("dogs")
      .update({ is_active: true })
      .eq("tutor_id", tutorId);

    if (dogsUpdateError) {
      return fail(400, {
        actionType: "restore",
        operatorError: "No pudimos restaurar los perros del tutor.",
      });
    }

    if (dogIds.length > 0) {
      const { error: recipesUpdateError } = await locals.supabase
        .from("recipes")
        .update({ is_active: true })
        .in("dog_id", dogIds);

      if (recipesUpdateError) {
        return fail(400, {
          actionType: "restore",
          operatorError: "No pudimos restaurar las recetas del tutor.",
        });
      }
    }

    return {
      actionType: "restore",
      operatorSuccess:
        "Tutor restaurado correctamente. Perros y recetas asociados quedaron activos.",
    };
  },
};
