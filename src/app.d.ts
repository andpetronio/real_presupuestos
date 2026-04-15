// See https://svelte.dev/docs/kit/types#app.d.ts
import type { SupabaseClient, User } from "@supabase/supabase-js";

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      supabase: SupabaseClient;
      user: User | null;
    }
    // interface PageData {}
    // interface Platform {}
  }
}

export {};
