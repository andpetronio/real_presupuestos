import { createServerClient } from "@supabase/ssr";
import type { Cookies } from "@sveltejs/kit";
import {
  supabaseAuthCookieName,
  supabasePublicEnv,
} from "$lib/supabase/config";

export function createSupabaseServerClient(cookies: Cookies) {
  return createServerClient(
    supabasePublicEnv.url,
    supabasePublicEnv.publishableKey,
    {
      cookieOptions: { name: supabaseAuthCookieName },
      cookies: {
        getAll: () => cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            cookies.set(name, value, {
              path: "/",
              ...options,
            });
          }
        },
      },
    },
  );
}
