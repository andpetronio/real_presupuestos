import type { Handle } from "@sveltejs/kit";
import { isSupabaseAuthCookie } from "$lib/supabase/config";
import { createSupabaseServerClient } from "$lib/supabase/server";

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createSupabaseServerClient(event.cookies);

  const {
    data: { user },
    error,
  } = await event.locals.supabase.auth.getUser();

  if (error?.code === "refresh_token_not_found") {
    for (const { name } of event.cookies.getAll()) {
      if (isSupabaseAuthCookie(name)) {
        event.cookies.delete(name, { path: "/" });
      }
    }
  }

  event.locals.user = user;

  return resolve(event);
};
