import { createHash, randomBytes } from "node:crypto";
import type { Cookies } from "@sveltejs/kit";
import type { SupabaseClient } from "@supabase/supabase-js";

export const WHOLESALER_SESSION_COOKIE = "wholesaler_session";
const SESSION_TTL_DAYS = 14;

export const hashSessionToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

export const createSessionToken = (): string => randomBytes(32).toString("hex");

export const buildSessionExpirationIso = (now = new Date()): string => {
  const expiresAt = new Date(
    now.getTime() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  );
  return expiresAt.toISOString();
};

export const setWholesalerSessionCookie = (cookies: Cookies, token: string) => {
  cookies.set(WHOLESALER_SESSION_COOKIE, token, {
    path: "/mayoristas",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
};

export const clearWholesalerSessionCookie = (cookies: Cookies) => {
  cookies.delete(WHOLESALER_SESSION_COOKIE, {
    path: "/mayoristas",
  });
};

type LoginRpcResult = {
  ok: boolean;
  wholesaler_id: string | null;
  wholesaler_name: string | null;
  min_total_units: number | null;
  error_code: string | null;
};

export const loginWholesalerByCode = async (params: {
  supabase: SupabaseClient;
  code: string;
  cookies: Cookies;
}): Promise<{ ok: true } | { ok: false; errorCode: string }> => {
  const sessionToken = createSessionToken();
  const sessionTokenHash = hashSessionToken(sessionToken);
  const expiresAtIso = buildSessionExpirationIso();

  const { data, error } = await params.supabase.rpc("wholesale_login_by_code", {
    p_code: params.code,
    p_session_token_hash: sessionTokenHash,
    p_expires_at: expiresAtIso,
  });

  if (error) {
    return { ok: false, errorCode: "unexpected_error" };
  }

  const row = ((data as LoginRpcResult[] | null) ?? [])[0];
  if (!row?.ok) {
    return { ok: false, errorCode: row?.error_code ?? "invalid_code" };
  }

  setWholesalerSessionCookie(params.cookies, sessionToken);
  return { ok: true };
};

export const readWholesalerSessionTokenHash = (
  cookies: Cookies,
): string | null => {
  const token = cookies.get(WHOLESALER_SESSION_COOKIE);
  if (!token) return null;
  const normalized = token.trim();
  if (!normalized) return null;
  return hashSessionToken(normalized);
};
