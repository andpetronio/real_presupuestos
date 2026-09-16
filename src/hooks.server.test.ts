import { beforeEach, describe, expect, it, vi } from "vitest";
import { asHandleEvent } from "$lib/test-helpers/sveltekit-events";
import { supabaseAuthCookieName } from "$lib/supabase/config";

const importHandleWithUser = async (
  user: { id: string } | null,
  error?: { code: string },
) => {
  vi.resetModules();

  const getUser = vi.fn().mockResolvedValue({ data: { user }, error });

  vi.doMock("$lib/supabase/server", () => ({
    createSupabaseServerClient: () => ({
      auth: {
        getUser,
      },
    }),
  }));

  const module = await import("./hooks.server");

  return {
    handle: module.handle,
    getUser,
  };
};

describe("hooks.server handle", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("inyecta supabase en locals y persiste user autenticado", async () => {
    const { handle, getUser } = await importHandleWithUser({ id: "user-123" });
    const resolve = vi.fn(async () => new Response("ok"));

    const event = asHandleEvent<Parameters<typeof handle>[0]["event"]>({
      cookies: { getAll: () => [], set: vi.fn() },
      locals: {},
    });

    await handle({ event, resolve });

    expect(getUser).toHaveBeenCalledTimes(1);
    expect(event.locals.supabase).toBeDefined();
    expect(event.locals.user).toMatchObject({ id: "user-123" });
    expect(resolve).toHaveBeenCalledOnce();
  });

  it("setea locals.user en null cuando no hay sesión de Supabase", async () => {
    const { handle } = await importHandleWithUser(null);
    const resolve = vi.fn(async () => new Response("ok"));

    const event = asHandleEvent<Parameters<typeof handle>[0]["event"]>({
      cookies: { getAll: () => [], set: vi.fn() },
      locals: {},
    });

    await handle({ event, resolve });

    expect(event.locals.user).toBeNull();
  });

  it("elimina solo las cookies de Supabase cuando el refresh token ya no existe", async () => {
    const { handle } = await importHandleWithUser(null, {
      code: "refresh_token_not_found",
    });
    const deleteCookie = vi.fn();
    const resolve = vi.fn(async () => new Response("ok"));
    const event = asHandleEvent<Parameters<typeof handle>[0]["event"]>({
      cookies: {
        getAll: () => [
          { name: supabaseAuthCookieName, value: "session" },
          { name: `${supabaseAuthCookieName}.0`, value: "chunk" },
          { name: "wholesale-session", value: "keep" },
        ],
        set: vi.fn(),
        delete: deleteCookie,
      },
      locals: {},
    });

    await handle({ event, resolve });

    expect(event.locals.user).toBeNull();
    expect(deleteCookie).toHaveBeenCalledWith(
      supabaseAuthCookieName,
      { path: "/" },
    );
    expect(deleteCookie).toHaveBeenCalledWith(
      `${supabaseAuthCookieName}.0`,
      { path: "/" },
    );
    expect(deleteCookie).toHaveBeenCalledTimes(2);
  });

  it("no elimina cookies ante otros errores de autenticación", async () => {
    const { handle } = await importHandleWithUser(null, {
      code: "unexpected_error",
    });
    const deleteCookie = vi.fn();
    const event = asHandleEvent<Parameters<typeof handle>[0]["event"]>({
      cookies: {
        getAll: () => [{ name: supabaseAuthCookieName, value: "session" }],
        set: vi.fn(),
        delete: deleteCookie,
      },
      locals: {},
    });

    await handle({ event, resolve: vi.fn(async () => new Response("ok")) });

    expect(deleteCookie).not.toHaveBeenCalled();
  });
});
