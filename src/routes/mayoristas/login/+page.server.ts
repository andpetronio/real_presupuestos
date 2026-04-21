import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import {
  clearWholesalerSessionCookie,
  loginWholesalerByCode,
  readWholesalerSessionTokenHash,
} from "$lib/server/wholesale/session";

type PortalDataRpc = {
  ok: boolean;
};

export const load: PageServerLoad = async ({ locals, cookies }) => {
  const tokenHash = readWholesalerSessionTokenHash(cookies);
  if (!tokenHash) return {};

  const { data, error } = await locals.supabase.rpc(
    "wholesale_get_portal_data",
    {
      p_session_token_hash: tokenHash,
    },
  );

  if (error) {
    clearWholesalerSessionCookie(cookies);
    return {};
  }

  const row = data as PortalDataRpc | null;
  if (row?.ok) {
    throw redirect(303, "/mayoristas/portal");
  }

  clearWholesalerSessionCookie(cookies);
  return {};
};

export const actions: Actions = {
  loginByCode: async ({ request, locals, cookies }) => {
    const formData = await request.formData();
    const codeEntry = formData.get("code");
    const code = typeof codeEntry === "string" ? codeEntry.trim().toUpperCase() : "";

    if (!code) {
      return fail(400, {
        operatorError: "Ingresá el código de cliente para continuar.",
        code,
      });
    }

    const result = await loginWholesalerByCode({
      supabase: locals.supabase,
      code,
      cookies,
    });

    if (!result.ok) {
      return fail(400, {
        operatorError: "Código inválido o cliente inactivo.",
        code,
      });
    }

    throw redirect(303, "/mayoristas/portal");
  },
};
