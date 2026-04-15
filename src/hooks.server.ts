import type { Handle } from "@sveltejs/kit";
import { createSupabaseServerClient } from "$lib/supabase/server";

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createSupabaseServerClient(event.cookies);

  const {
    data: { user },
  } = await event.locals.supabase.auth.getUser();

  event.locals.user = user;

  return resolve(event);
};
