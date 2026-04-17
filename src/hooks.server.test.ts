import { beforeEach, describe, expect, it, vi } from "vitest";

const importHandleWithUser = async (user: { id: string } | null) => {
  vi.resetModules();

  const getUser = vi.fn().mockResolvedValue({ data: { user } });

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

    const event = {
      cookies: { getAll: () => [], set: vi.fn() },
      locals: {},
    } as unknown as Parameters<typeof handle>[0]["event"];

    await handle({ event, resolve });

    expect(getUser).toHaveBeenCalledTimes(1);
    expect(event.locals.supabase).toBeDefined();
    expect(event.locals.user).toMatchObject({ id: "user-123" });
    expect(resolve).toHaveBeenCalledOnce();
  });

  it("setea locals.user en null cuando no hay sesión de Supabase", async () => {
    const { handle } = await importHandleWithUser(null);
    const resolve = vi.fn(async () => new Response("ok"));

    const event = {
      cookies: { getAll: () => [], set: vi.fn() },
      locals: {},
    } as unknown as Parameters<typeof handle>[0]["event"];

    await handle({ event, resolve });

    expect(event.locals.user).toBeNull();
  });
});
