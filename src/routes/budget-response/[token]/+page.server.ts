import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import type { BudgetStatus } from "$lib/types/budget";

type PublicBudgetRow = {
  id: string;
  status: BudgetStatus;
  final_sale_price: number;
  expires_at: string | null;
  notes: string | null;
  rejection_reason: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  sent_at: string | null;
  tutorName: string;
  canRespond: boolean;
};

type PublicBudgetRpcRow = {
  id: string;
  status: BudgetStatus;
  final_sale_price: number;
  expires_at: string | null;
  notes: string | null;
  rejection_reason: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  sent_at: string | null;
  tutor_name: string | null;
  can_respond: boolean;
};

type PublicBudgetMutationRpcRow = {
  ok: boolean;
  code: string;
  rejection_reason?: string;
};

type BudgetDogRow = {
  id: string;
  dog_id: string;
};

type BudgetDogRecipeRow = {
  budget_dog_id: string;
  recipe_id: string;
};

type DogRow = {
  id: string;
  name: string;
};

type RecipeRow = {
  id: string;
  name: string;
};

type RecipeItemRow = {
  recipe_id: string;
  raw_material_id: string;
};

type RawMaterialRow = {
  id: string;
  name: string;
};

type DogRecipeRawMaterialsView = {
  dogId: string;
  dogName: string;
  recipes: Array<{
    recipeId: string;
    recipeName: string;
    rawMaterials: string[];
  }>;
};

const fallbackError = {
  kind: "error" as const,
  title: "No pudimos cargar este presupuesto",
  detail:
    "Reintentá en unos segundos o pedile al equipo que te reenvíe el enlace.",
};

const parseText = (value: FormDataEntryValue | null): string =>
  typeof value === "string" ? value.trim() : "";

const readBudgetByToken = async (
  locals: App.Locals,
  token: string,
): Promise<PublicBudgetRow | null> => {
  const result = await locals.supabase.rpc("public_get_budget_response", {
    p_token: token,
  });
  if (result.error) throw result.error;
  const row = ((result.data ?? []) as PublicBudgetRpcRow[])[0];
  if (!row) return null;

  return {
    id: row.id,
    status: row.status,
    final_sale_price: Number(row.final_sale_price ?? 0),
    expires_at: row.expires_at,
    notes: row.notes,
    rejection_reason: row.rejection_reason,
    accepted_at: row.accepted_at,
    rejected_at: row.rejected_at,
    sent_at: row.sent_at,
    tutorName: row.tutor_name ?? "Sin tutor",
    canRespond: row.can_respond,
  };
};

const getBlockedResponseMessageFromCode = (code: string): string => {
  if (code === "blocked_accepted")
    return "Este presupuesto ya fue aceptado. ¡Gracias por confirmarlo!";
  if (code === "blocked_rejected")
    return "Este presupuesto ya fue rechazado y no admite nuevas respuestas.";
  if (code === "blocked_expired")
    return "Este presupuesto venció y ya no puede responderse.";
  return "Este presupuesto no admite respuesta en este momento.";
};

const mapPublicView = (budget: PublicBudgetRow) => ({
  id: budget.id,
  status: budget.status,
  finalSalePrice: Number(budget.final_sale_price ?? 0),
  expiresAt: budget.expires_at,
  notes: budget.notes,
  rejectionReason: budget.rejection_reason,
  acceptedAt: budget.accepted_at,
  rejectedAt: budget.rejected_at,
  sentAt: budget.sent_at,
  tutorName: budget.tutorName,
  canRespond: budget.canRespond,
});

export const load: PageServerLoad = async ({ params, locals }) => {
  try {
    const token = params.token?.trim();
    if (!token) {
      return {
        budget: null,
        recipeDetailsByDog: [],
        pageState: "error" as const,
        pageMessage: {
          kind: "error" as const,
          title: "Enlace inválido",
          detail: "El enlace de respuesta está incompleto.",
        },
      };
    }

    const budget = await readBudgetByToken(locals, token);
    if (!budget) {
      return {
        budget: null,
        recipeDetailsByDog: [],
        pageState: "error" as const,
        pageMessage: {
          kind: "error" as const,
          title: "Presupuesto no encontrado",
          detail: "No encontramos un presupuesto asociado a este enlace.",
        },
      };
    }

    return {
      budget: mapPublicView(budget),
      recipeDetailsByDog: [],
      pageState: "success" as const,
      pageMessage: null,
    };
  } catch {
    return {
      budget: null,
      recipeDetailsByDog: [],
      pageState: "error" as const,
      pageMessage: fallbackError,
    };
  }
};

export const actions: Actions = {
  accept: async ({ params, locals }) => {
    try {
      const token = params.token?.trim();
      if (!token) {
        return fail(400, {
          actionType: "accept",
          operatorError: "El enlace de respuesta es inválido.",
        });
      }

      const budget = await readBudgetByToken(locals, token);
      if (!budget) {
        return fail(404, {
          actionType: "accept",
          operatorError: "No encontramos el presupuesto para este enlace.",
        });
      }

      const mutation = await locals.supabase.rpc("public_accept_budget", {
        p_token: token,
      });

      if (mutation.error) {
        return fail(400, {
          actionType: "accept",
          operatorError:
            "No pudimos registrar tu respuesta. Reintentá en unos segundos.",
        });
      }

      const result = ((mutation.data ?? []) as PublicBudgetMutationRpcRow[])[0];
      if (!result?.ok) {
        if (result?.code === "not_found") {
          return fail(404, {
            actionType: "accept",
            operatorError: "No encontramos el presupuesto para este enlace.",
          });
        }

        return fail(400, {
          actionType: "accept",
          operatorError: getBlockedResponseMessageFromCode(
            result?.code ?? "blocked_other",
          ),
        });
      }

      return {
        actionType: "accept",
        operatorSuccess: "¡Gracias! Confirmamos tu aceptación del presupuesto.",
      };
    } catch {
      return fail(400, {
        actionType: "accept",
        operatorError:
          "No pudimos registrar tu respuesta. Reintentá en unos segundos.",
      });
    }
  },
  reject: async ({ params, locals, request }) => {
    try {
      const token = params.token?.trim();
      if (!token) {
        return fail(400, {
          actionType: "reject",
          operatorError: "El enlace de respuesta es inválido.",
          rejectionReason: "",
        });
      }

      const formData = await request.formData();
      const rejectionReason = parseText(formData.get("rejectionReason"));

      if (rejectionReason.length > 500) {
        return fail(400, {
          actionType: "reject",
          operatorError:
            "El motivo de rechazo puede tener hasta 500 caracteres.",
          rejectionReason,
        });
      }

      const budget = await readBudgetByToken(locals, token);
      if (!budget) {
        return fail(404, {
          actionType: "reject",
          operatorError: "No encontramos el presupuesto para este enlace.",
          rejectionReason,
        });
      }

      const mutation = await locals.supabase.rpc("public_reject_budget", {
        p_token: token,
        p_rejection_reason: rejectionReason,
      });

      if (mutation.error) {
        return fail(400, {
          actionType: "reject",
          operatorError:
            "No pudimos registrar tu respuesta. Reintentá en unos segundos.",
          rejectionReason,
        });
      }

      const result = ((mutation.data ?? []) as PublicBudgetMutationRpcRow[])[0];
      if (!result?.ok) {
        if (result?.code === "not_found") {
          return fail(404, {
            actionType: "reject",
            operatorError: "No encontramos el presupuesto para este enlace.",
            rejectionReason,
          });
        }

        if (result?.code === "reason_too_long") {
          return fail(400, {
            actionType: "reject",
            operatorError:
              "El motivo de rechazo puede tener hasta 500 caracteres.",
            rejectionReason,
          });
        }

        return fail(400, {
          actionType: "reject",
          operatorError: getBlockedResponseMessageFromCode(
            result?.code ?? "blocked_other",
          ),
          rejectionReason,
        });
      }

      return {
        actionType: "reject",
        operatorSuccess:
          "Gracias por tu respuesta. Registramos el rechazo del presupuesto.",
        rejectionReason: rejectionReason || "",
      };
    } catch {
      return fail(400, {
        actionType: "reject",
        operatorError:
          "No pudimos registrar tu respuesta. Reintentá en unos segundos.",
        rejectionReason: "",
      });
    }
  },
};
