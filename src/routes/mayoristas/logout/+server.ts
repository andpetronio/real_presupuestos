import { redirect, type RequestHandler } from "@sveltejs/kit";
import {
  clearWholesalerSessionCookie,
  readWholesalerSessionTokenHash,
} from "$lib/server/wholesale/session";

export const POST: RequestHandler = async ({ locals, cookies }) => {
  const tokenHash = readWholesalerSessionTokenHash(cookies);
  if (tokenHash) {
    await locals.supabase.rpc("wholesale_logout_by_token_hash", {
      p_session_token_hash: tokenHash,
    });
  }

  clearWholesalerSessionCookie(cookies);
  throw redirect(303, "/mayoristas/login");
};
