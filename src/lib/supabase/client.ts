import { createBrowserClient } from "@supabase/ssr";
import {
  supabaseAuthCookieName,
  supabasePublicEnv,
} from "$lib/supabase/config";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    supabasePublicEnv.url,
    supabasePublicEnv.publishableKey,
    { cookieOptions: { name: supabaseAuthCookieName } },
  );
}
