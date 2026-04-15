import { createServerClient } from "@supabase/ssr";
import type { Cookies } from "@sveltejs/kit";
import { supabasePublicEnv } from "$lib/supabase/config";

export function createSupabaseServerClient(cookies: Cookies) {
  return createServerClient(
    supabasePublicEnv.url,
    supabasePublicEnv.publishableKey,
    {
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
