import { createBrowserClient } from "@supabase/ssr";
import { supabasePublicEnv } from "$lib/supabase/config";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    supabasePublicEnv.url,
    supabasePublicEnv.publishableKey,
  );
}
