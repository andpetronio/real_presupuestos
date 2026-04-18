import { redirect } from "@sveltejs/kit";
import {
  buildPublicLoginRedirect,
  parseFormString,
} from "$lib/server/auth/next";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals, request, url }) => {
  const formData = await request.formData();
  const requestedNext =
    parseFormString(formData.get("next")) ?? `${url.pathname}${url.search}`;

  await locals.supabase.auth.signOut();

  throw redirect(303, buildPublicLoginRedirect(requestedNext));
};
