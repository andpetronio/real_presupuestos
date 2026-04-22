import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { readWholesalerSessionTokenHash } from "$lib/server/wholesale/session";

export const load: PageServerLoad = async ({ cookies }) => {
  const tokenHash = readWholesalerSessionTokenHash(cookies);

  if (tokenHash) {
    throw redirect(303, "/mayoristas/portal");
  }

  throw redirect(303, "/mayoristas/login");
};
