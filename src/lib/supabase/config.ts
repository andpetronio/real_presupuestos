import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';

type PublicSupabaseEnv = {
  url: string;
  publishableKey: string;
};

const MISSING_ENV_ERROR_PREFIX = '[supabase-config] Missing required public env var';

const requireNonEmpty = (name: string, value: string | undefined): string => {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(
      `${MISSING_ENV_ERROR_PREFIX}: ${name}. Definila en tu entorno (.env, CI o runtime config) antes de iniciar la app.`
    );
  }

  return normalized;
};

export const resolveSupabasePublicEnv = (
  env: {
    PUBLIC_SUPABASE_URL?: string;
    PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  } = {
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_PUBLISHABLE_KEY
  }
): PublicSupabaseEnv => ({
  url: requireNonEmpty('PUBLIC_SUPABASE_URL', env.PUBLIC_SUPABASE_URL),
  publishableKey: requireNonEmpty('PUBLIC_SUPABASE_PUBLISHABLE_KEY', env.PUBLIC_SUPABASE_PUBLISHABLE_KEY)
});

export const supabasePublicEnv = resolveSupabasePublicEnv();
