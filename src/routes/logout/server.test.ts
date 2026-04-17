import { describe, expect, it, vi } from "vitest";
import { POST } from "./+server";

type LogoutRequestInput = {
  pathname?: string;
  search?: string;
  formNext?: string;
};

const createEvent = ({
  pathname = "/logout",
  search = "",
  formNext,
}: LogoutRequestInput = {}) => {
  const signOut = vi.fn().mockResolvedValue({ error: null });
  const formData = new FormData();

  if (formNext !== undefined) formData.set("next", formNext);

  return {
    event: {
      request: {
        formData: async () => formData,
      },
      locals: {
        supabase: {
          auth: {
            signOut,
          },
        },
      },
      url: new URL(`https://example.test${pathname}${search}`),
    } as unknown as Parameters<typeof POST>[0],
    signOut,
  };
};

describe("/logout POST", () => {
  it("cierra sesión y redirige a login conservando next seguro", async () => {
    const { event, signOut } = createEvent({ formNext: "/recipes?tab=active" });

    await expect(POST(event)).rejects.toMatchObject({
      status: 303,
      location: "/?next=%2Frecipes%3Ftab%3Dactive",
    });

    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("normaliza next inseguro en logout", async () => {
    const { event } = createEvent({ formNext: "https://malicioso.com/steal" });

    await expect(POST(event)).rejects.toMatchObject({
      status: 303,
      location: "/?next=%2Fdashboard",
    });
  });
});
