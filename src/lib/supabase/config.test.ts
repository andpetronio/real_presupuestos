import { describe, expect, it } from "vitest";
import { resolveSupabasePublicEnv } from "./config";

describe("supabase public config guardrail", () => {
  it("normaliza y devuelve URL + publishable key cuando existen", () => {
    const config = resolveSupabasePublicEnv({
      PUBLIC_SUPABASE_URL: " https://example.supabase.co ",
      PUBLIC_SUPABASE_PUBLISHABLE_KEY: " public-anon-key ",
    });

    expect(config).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "public-anon-key",
    });
  });

  it("falla temprano con error claro cuando falta PUBLIC_SUPABASE_URL", () => {
    expect(() =>
      resolveSupabasePublicEnv({
        PUBLIC_SUPABASE_URL: "   ",
        PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-anon-key",
      }),
    ).toThrowError(/Missing required public env var: PUBLIC_SUPABASE_URL/);
  });

  it("falla temprano con error claro cuando falta PUBLIC_SUPABASE_PUBLISHABLE_KEY", () => {
    expect(() =>
      resolveSupabasePublicEnv({
        PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      }),
    ).toThrowError(
      /Missing required public env var: PUBLIC_SUPABASE_PUBLISHABLE_KEY/,
    );
  });
});
