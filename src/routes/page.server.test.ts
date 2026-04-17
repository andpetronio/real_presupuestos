import { describe, expect, it, vi } from "vitest";
import { actions, load } from "./+page.server";

type TestEventInput = {
  userId?: string | null;
  next?: string;
};

type LoginActionInput = {
  email?: string;
  password?: string;
  formNext?: string;
  queryNext?: string;
  errorMessage?: string;
};

const createEvent = ({ userId = null, next }: TestEventInput) =>
  ({
    locals: {
      user: userId ? ({ id: userId } as { id: string }) : null,
    },
    url: new URL(
      `https://example.test/${next ? `?next=${encodeURIComponent(next)}` : ""}`,
    ),
  }) as Parameters<typeof load>[0];

const createLoginEvent = ({
  email,
  password,
  formNext,
  queryNext,
  errorMessage,
}: LoginActionInput = {}) => {
  const signInWithPassword = vi
    .fn()
    .mockResolvedValue(
      errorMessage ? { error: { message: errorMessage } } : { error: null },
    );
  const formData = new FormData();

  if (email !== undefined) formData.set("email", email);
  if (password !== undefined) formData.set("password", password);
  if (formNext !== undefined) formData.set("next", formNext);

  return {
    event: {
      request: {
        formData: async () => formData,
      },
      locals: {
        supabase: {
          auth: {
            signInWithPassword,
          },
        },
      },
      url: new URL(
        `https://example.test/${queryNext ? `?next=${encodeURIComponent(queryNext)}` : ""}`,
      ),
    } as unknown as Parameters<(typeof actions)["login"]>[0],
    signInWithPassword,
  };
};

describe("/+page.server load", () => {
  it("redirige a /dashboard cuando hay sesión y no hay next", async () => {
    await expect(load(createEvent({ userId: "user-1" }))).rejects.toMatchObject(
      {
        status: 303,
        location: "/dashboard",
      },
    );
  });

  it("redirige a next interno cuando hay sesión", async () => {
    await expect(
      load(createEvent({ userId: "user-1", next: "/budgets?status=draft" })),
    ).rejects.toMatchObject({
      status: 303,
      location: "/budgets?status=draft",
    });
  });

  it("normaliza next externo/inválido a /dashboard", async () => {
    const data = (await load(createEvent({ next: "//malicioso.com" }))) as {
      nextPath: string;
    };
    expect(data.nextPath).toBe("/dashboard");
  });
});

describe("/+page.server actions.login", () => {
  it("hace signInWithPassword y redirige a next seguro cuando autentica", async () => {
    const { event, signInWithPassword } = createLoginEvent({
      email: "ops@example.com",
      password: "super-secret",
      formNext: "/budgets?status=draft",
    });

    await expect(actions.login(event)).rejects.toMatchObject({
      status: 303,
      location: "/budgets?status=draft",
    });

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "ops@example.com",
      password: "super-secret",
    });
  });

  it("normaliza next inseguro a /dashboard en login exitoso", async () => {
    const { event } = createLoginEvent({
      email: "ops@example.com",
      password: "super-secret",
      formNext: "https://malicioso.com/hijack",
    });

    await expect(actions.login(event)).rejects.toMatchObject({
      status: 303,
      location: "/dashboard",
    });
  });

  it("devuelve error operator-friendly si faltan credenciales", async () => {
    const { event, signInWithPassword } = createLoginEvent({
      formNext: "/dashboard",
    });

    const result = (await actions.login(event)) as {
      status: number;
      data: { operatorError: string; nextPath: string };
    };

    expect(signInWithPassword).not.toHaveBeenCalled();
    expect(result.status).toBe(400);
    expect(result.data).toMatchObject({
      operatorError:
        "No pudimos iniciar sesión. Verificá email y contraseña e intentá de nuevo.",
      nextPath: "/dashboard",
    });
  });

  it("traduce invalid credentials a mensaje de operador claro", async () => {
    const { event } = createLoginEvent({
      email: "ops@example.com",
      password: "incorrecta",
      errorMessage: "Invalid login credentials",
    });

    const result = (await actions.login(event)) as {
      status: number;
      data: { operatorError: string; nextPath: string; email: string };
    };

    expect(result.status).toBe(400);
    expect(result.data).toMatchObject({
      operatorError: "Credenciales inválidas. Revisá email y contraseña.",
      nextPath: "/dashboard",
      email: "ops@example.com",
    });
  });

  it("normaliza email con espacios y mayúsculas para login móvil", async () => {
    const { event, signInWithPassword } = createLoginEvent({
      email: "  Ops@Example.COM  ",
      password: "super-secret",
    });

    await expect(actions.login(event)).rejects.toMatchObject({
      status: 303,
      location: "/dashboard",
    });

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "ops@example.com",
      password: "super-secret",
    });
  });
});
