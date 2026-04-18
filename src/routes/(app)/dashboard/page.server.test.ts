import { describe, expect, it, vi } from "vitest";
import { load } from "./+page.server";
import { asLoadEvent } from "$lib/test-helpers/sveltekit-events";

type BudgetMetricRow = {
  status:
    | "draft"
    | "ready_to_send"
    | "sent"
    | "accepted"
    | "rejected"
    | "expired"
    | "discarded";
  sent_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  final_sale_price: number;
};

const createSupabaseFromMock = (
  rows: BudgetMetricRow[],
  error: unknown = null,
  unviewedCount = 0,
) =>
  vi.fn().mockImplementation((table: string) => {
    if (table === "budgets") {
      return {
        select: vi.fn((_columns?: string, options?: { head?: boolean }) => {
          if (options?.head) {
            return {
              eq: vi.fn(() => ({
                is: async () => ({ count: unviewedCount, error: null }),
              })),
            };
          }

          return Promise.resolve({ data: rows, error });
        }),
      };
    }

    return {
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    };
  });

const createEvent = (params: {
  rows?: BudgetMetricRow[];
  error?: unknown;
  period?: string;
}) => {
  const { rows = [], error = null, period = "30d" } = params;

  const from = createSupabaseFromMock(rows, error, 0);

  return asLoadEvent<Parameters<typeof load>[0]>({
    parent: async () => ({ actorId: "op-1" }),
    locals: { supabase: { from } },
    url: new URL(`http://localhost/dashboard?period=${period}`),
  });
};

describe("(app)/dashboard/+page.server load", () => {
  it("calcula metricas del periodo seleccionado", async () => {
    const now = new Date();
    const inRange = new Date(now);
    inRange.setDate(now.getDate() - 2);

    const outRange = new Date(now);
    outRange.setDate(now.getDate() - 50);

    const data = (await load(
      createEvent({
        period: "7d",
        rows: [
          {
            status: "accepted",
            sent_at: inRange.toISOString(),
            accepted_at: inRange.toISOString(),
            rejected_at: null,
            final_sale_price: 100000,
          },
          {
            status: "rejected",
            sent_at: inRange.toISOString(),
            accepted_at: null,
            rejected_at: inRange.toISOString(),
            final_sale_price: 50000,
          },
          {
            status: "accepted",
            sent_at: outRange.toISOString(),
            accepted_at: outRange.toISOString(),
            rejected_at: null,
            final_sale_price: 999999,
          },
        ],
      }),
    )) as {
      state: "success" | "error";
      period: string;
      metrics: {
        sent: number;
        accepted: number;
        rejected: number;
        responded: number;
        pending: number;
        acceptanceRate: number;
        rejectionRate: number;
        acceptedTotal: number;
        avgAcceptedTicket: number;
      };
      timeseries: Array<{
        bucket: string;
        sent: number;
        responded: number;
        accepted: number;
        rejected: number;
        acceptedAmount: number;
        avgTicket: number | null;
        acceptanceRate: number;
      }>;
      comparison: {
        sentDeltaPct: number | null;
        respondedDeltaPct: number | null;
        acceptanceRateDeltaPct: number | null;
        acceptedTotalDeltaPct: number | null;
        avgAcceptedTicketDeltaPct: number | null;
        paymentsDeltaPct: number | null;
      };
    };

    expect(data.state).toBe("success");
    expect(data.period).toBe("7d");
    expect(data.metrics.sent).toBe(2);
    expect(data.metrics.accepted).toBe(1);
    expect(data.metrics.rejected).toBe(1);
    expect(data.metrics.responded).toBe(2);
    expect(data.metrics.pending).toBe(0);
    expect(data.metrics.acceptanceRate).toBe(0.5);
    expect(data.metrics.rejectionRate).toBe(0.5);
    expect(data.metrics.acceptedTotal).toBe(100000);
    expect(data.metrics.avgAcceptedTicket).toBe(100000);
    expect(data.timeseries.length).toBeGreaterThan(0);
    expect(data.comparison).toHaveProperty("sentDeltaPct");
    expect(data.comparison).toHaveProperty("respondedDeltaPct");
    expect(data.comparison).toHaveProperty("acceptanceRateDeltaPct");
    expect(data.comparison).toHaveProperty("acceptedTotalDeltaPct");
    expect(data.comparison).toHaveProperty("avgAcceptedTicketDeltaPct");
    expect(data.comparison).toHaveProperty("paymentsDeltaPct");
  });

  it("usa 30d por defecto cuando period es invalido", async () => {
    const data = (await load(createEvent({ period: "invalid" }))) as {
      period: string;
      state: string;
    };

    expect(data.state).toBe("success");
    expect(data.period).toBe("30d");
  });

  it("retorna fallback seguro en error tecnico", async () => {
    const data = (await load(createEvent({ error: new Error("db down") }))) as {
      state: string;
      metrics: {
        sent: number;
        accepted: number;
        rejected: number;
        responded: number;
        pending: number;
        acceptanceRate: number;
        rejectionRate: number;
        acceptedTotal: number;
        avgAcceptedTicket: number;
      };
      message: { kind: string; title: string; actionLabel: string };
      timeseries: unknown[];
      comparison: {
        sentDeltaPct: number | null;
        respondedDeltaPct: number | null;
        acceptanceRateDeltaPct: number | null;
        acceptedTotalDeltaPct: number | null;
        avgAcceptedTicketDeltaPct: number | null;
        paymentsDeltaPct: number | null;
      };
      payments: { collected: number; count: number; avgAmount: number };
    };

    expect(data.state).toBe("error");
    expect(data.metrics).toEqual({
      sent: 0,
      accepted: 0,
      rejected: 0,
      responded: 0,
      pending: 0,
      acceptanceRate: 0,
      rejectionRate: 0,
      acceptedTotal: 0,
      avgAcceptedTicket: 0,
    });
    expect(data.timeseries).toEqual([]);
    expect(data.comparison).toEqual({
      sentDeltaPct: 0,
      respondedDeltaPct: 0,
      acceptanceRateDeltaPct: 0,
      acceptedTotalDeltaPct: 0,
      avgAcceptedTicketDeltaPct: 0,
      paymentsDeltaPct: 0,
    });
    expect(data.message).toMatchObject({
      kind: "error",
      title: "No pudimos cargar el dashboard",
      actionLabel: "Reintentar",
    });
  });

  it("calcula pendientes cuando hay enviados sin respuesta", async () => {
    const now = new Date();
    const inRange = new Date(now);
    inRange.setDate(now.getDate() - 1);

    const data = (await load(
      createEvent({
        period: "30d",
        rows: [
          {
            status: "sent",
            sent_at: inRange.toISOString(),
            accepted_at: null,
            rejected_at: null,
            final_sale_price: 1000,
          },
        ],
      }),
    )) as {
      metrics: { sent: number; responded: number; pending: number };
    };

    expect(data.metrics.sent).toBe(1);
    expect(data.metrics.responded).toBe(0);
    expect(data.metrics.pending).toBe(1);
  });
});

describe("(app)/dashboard/+page.server period options", () => {
  const createPeriodEvent = (period: string | null) => {
    const from = createSupabaseFromMock([], null, 0);

    return asLoadEvent<Parameters<typeof load>[0]>({
      parent: async () => ({ actorId: "op-1" }),
      locals: { supabase: { from } },
      url: new URL(
        `http://localhost/dashboard${period ? `?period=${period}` : ""}`,
      ),
    });
  };

  it("incluye las 4 opciones de periodo con las claves correctas", async () => {
    const data = (await load(createPeriodEvent("30d"))) as {
      periodOptions: ReadonlyArray<{ key: string; label: string }>;
    };

    expect(data.periodOptions).toHaveLength(4);
    expect(data.periodOptions.map((p) => p.key)).toEqual([
      "7d",
      "30d",
      "90d",
      "mtd",
    ]);
    expect(data.periodOptions.map((p) => p.label)).toEqual([
      "Ultimos 7 dias",
      "Ultimos 30 dias",
      "Ultimos 90 dias",
      "Mes actual",
    ]);
  });

  it("usa 30d por defecto cuando no hay parametro de periodo", async () => {
    const data = (await load(createPeriodEvent(null))) as {
      period: string;
      state: string;
    };

    expect(data.state).toBe("success");
    expect(data.period).toBe("30d");
  });

  it("reconoce 7d como periodo valido", async () => {
    const data = (await load(createPeriodEvent("7d"))) as {
      period: string;
      state: string;
    };

    expect(data.state).toBe("success");
    expect(data.period).toBe("7d");
  });

  it("reconoce 90d como periodo valido", async () => {
    const data = (await load(createPeriodEvent("90d"))) as {
      period: string;
      state: string;
    };

    expect(data.state).toBe("success");
    expect(data.period).toBe("90d");
  });

  it("reconoce mtd como periodo valido", async () => {
    const data = (await load(createPeriodEvent("mtd"))) as {
      period: string;
      state: string;
    };

    expect(data.state).toBe("success");
    expect(data.period).toBe("mtd");
  });
});

describe("(app)/dashboard/+page.server metrics calculation", () => {
  const createMetricsEvent = (rows: BudgetMetricRow[], period = "30d") => {
    const from = createSupabaseFromMock(rows, null, 0);

    return asLoadEvent<Parameters<typeof load>[0]>({
      parent: async () => ({ actorId: "op-1" }),
      locals: { supabase: { from } },
      url: new URL(`http://localhost/dashboard?period=${period}`),
    });
  };

  it("devuelve metricas en cero cuando no hay presupuestos", async () => {
    const data = (await load(createMetricsEvent([]))) as {
      metrics: {
        sent: number;
        accepted: number;
        rejected: number;
        responded: number;
        pending: number;
        acceptanceRate: number;
        rejectionRate: number;
        acceptedTotal: number;
        avgAcceptedTicket: number;
      };
    };

    expect(data.metrics.sent).toBe(0);
    expect(data.metrics.accepted).toBe(0);
    expect(data.metrics.rejected).toBe(0);
    expect(data.metrics.responded).toBe(0);
    expect(data.metrics.pending).toBe(0);
    expect(data.metrics.acceptanceRate).toBe(0);
    expect(data.metrics.rejectionRate).toBe(0);
    expect(data.metrics.acceptedTotal).toBe(0);
    expect(data.metrics.avgAcceptedTicket).toBe(0);
  });

  it("calcula 100% de aceptacion cuando todos los presupuestos fueron aceptados", async () => {
    const now = new Date();
    const inRange = new Date(now);
    inRange.setDate(now.getDate() - 5);

    const data = (await load(
      createMetricsEvent([
        {
          status: "accepted",
          sent_at: inRange.toISOString(),
          accepted_at: inRange.toISOString(),
          rejected_at: null,
          final_sale_price: 100000,
        },
        {
          status: "accepted",
          sent_at: inRange.toISOString(),
          accepted_at: inRange.toISOString(),
          rejected_at: null,
          final_sale_price: 150000,
        },
      ]),
    )) as {
      metrics: {
        accepted: number;
        rejected: number;
        responded: number;
        acceptanceRate: number;
        rejectionRate: number;
        acceptedTotal: number;
        avgAcceptedTicket: number;
      };
    };

    expect(data.metrics.accepted).toBe(2);
    expect(data.metrics.rejected).toBe(0);
    expect(data.metrics.responded).toBe(2);
    expect(data.metrics.acceptanceRate).toBe(1);
    expect(data.metrics.rejectionRate).toBe(0);
    expect(data.metrics.acceptedTotal).toBe(250000);
    expect(data.metrics.avgAcceptedTicket).toBe(125000);
  });

  it("calcula 100% de rechazo cuando todos los presupuestos fueron rechazados", async () => {
    const now = new Date();
    const inRange = new Date(now);
    inRange.setDate(now.getDate() - 5);

    const data = (await load(
      createMetricsEvent([
        {
          status: "rejected",
          sent_at: inRange.toISOString(),
          accepted_at: null,
          rejected_at: inRange.toISOString(),
          final_sale_price: 100000,
        },
        {
          status: "rejected",
          sent_at: inRange.toISOString(),
          accepted_at: null,
          rejected_at: inRange.toISOString(),
          final_sale_price: 80000,
        },
      ]),
    )) as {
      metrics: {
        accepted: number;
        rejected: number;
        responded: number;
        acceptanceRate: number;
        rejectionRate: number;
      };
    };

    expect(data.metrics.accepted).toBe(0);
    expect(data.metrics.rejected).toBe(2);
    expect(data.metrics.responded).toBe(2);
    expect(data.metrics.acceptanceRate).toBe(0);
    expect(data.metrics.rejectionRate).toBe(1);
  });

  it("calcula correctamente metricas mixtas", async () => {
    const now = new Date();
    const inRange = new Date(now);
    inRange.setDate(now.getDate() - 5);

    const data = (await load(
      createMetricsEvent([
        {
          status: "accepted",
          sent_at: inRange.toISOString(),
          accepted_at: inRange.toISOString(),
          rejected_at: null,
          final_sale_price: 100000,
        },
        {
          status: "accepted",
          sent_at: inRange.toISOString(),
          accepted_at: inRange.toISOString(),
          rejected_at: null,
          final_sale_price: 200000,
        },
        {
          status: "rejected",
          sent_at: inRange.toISOString(),
          accepted_at: null,
          rejected_at: inRange.toISOString(),
          final_sale_price: 50000,
        },
        {
          status: "rejected",
          sent_at: inRange.toISOString(),
          accepted_at: null,
          rejected_at: inRange.toISOString(),
          final_sale_price: 30000,
        },
      ]),
    )) as {
      metrics: {
        accepted: number;
        rejected: number;
        responded: number;
        acceptanceRate: number;
        rejectionRate: number;
        acceptedTotal: number;
        avgAcceptedTicket: number;
      };
    };

    expect(data.metrics.accepted).toBe(2);
    expect(data.metrics.rejected).toBe(2);
    expect(data.metrics.responded).toBe(4);
    expect(data.metrics.acceptanceRate).toBe(0.5);
    expect(data.metrics.rejectionRate).toBe(0.5);
    expect(data.metrics.acceptedTotal).toBe(300000);
    expect(data.metrics.avgAcceptedTicket).toBe(150000);
  });

  it("excluye presupuestos fuera del periodo seleccionado", async () => {
    const now = new Date();
    const inRange = new Date(now);
    inRange.setDate(now.getDate() - 3);

    const outOfRange = new Date(now);
    outOfRange.setDate(now.getDate() - 40);

    const data = (await load(
      createMetricsEvent(
        [
          {
            status: "accepted",
            sent_at: inRange.toISOString(),
            accepted_at: inRange.toISOString(),
            rejected_at: null,
            final_sale_price: 100000,
          },
          {
            status: "accepted",
            sent_at: outOfRange.toISOString(),
            accepted_at: outOfRange.toISOString(),
            rejected_at: null,
            final_sale_price: 999999,
          },
        ],
        "7d",
      ),
    )) as {
      metrics: {
        accepted: number;
        responded: number;
      };
    };

    expect(data.metrics.accepted).toBe(1);
    expect(data.metrics.responded).toBe(1);
  });

  it("devuelve error state cuando la query de supabase falla", async () => {
    const from = createSupabaseFromMock([], new Error("Network error"), 0);

    const data = (await load(
      asLoadEvent<Parameters<typeof load>[0]>({
        parent: async () => ({ actorId: "op-1" }),
        locals: { supabase: { from } },
        url: new URL("http://localhost/dashboard?period=30d"),
      }),
    )) as {
      state: string;
      message: { kind: string; title: string; detail: string };
      metrics: { sent: number; accepted: number; rejected: number };
    };

    expect(data.state).toBe("error");
    expect(data.message.kind).toBe("error");
    expect(data.message.title).toBe("No pudimos cargar el dashboard");
    expect(data.metrics.sent).toBe(0);
    expect(data.metrics.accepted).toBe(0);
    expect(data.metrics.rejected).toBe(0);
  });

  it("incluye timeseries vacio cuando no hay datos", async () => {
    const data = (await load(createMetricsEvent([]))) as {
      timeseries: unknown[];
    };

    expect(Array.isArray(data.timeseries)).toBe(true);
    expect(data.timeseries.length).toBeGreaterThan(0);
  });

  it("calcula delta de metricas para comparacion con periodo anterior", async () => {
    const now = new Date();
    const inRange = new Date(now);
    inRange.setDate(now.getDate() - 5);

    const data = (await load(
      createMetricsEvent([
        {
          status: "accepted",
          sent_at: inRange.toISOString(),
          accepted_at: inRange.toISOString(),
          rejected_at: null,
          final_sale_price: 100000,
        },
      ]),
    )) as {
      comparison: {
        sentDeltaPct: number | null;
        respondedDeltaPct: number | null;
        acceptanceRateDeltaPct: number | null;
        acceptedTotalDeltaPct: number | null;
        avgAcceptedTicketDeltaPct: number | null;
        paymentsDeltaPct: number | null;
      };
    };

    expect(data.comparison).toHaveProperty("sentDeltaPct");
    expect(data.comparison).toHaveProperty("respondedDeltaPct");
    expect(data.comparison).toHaveProperty("acceptanceRateDeltaPct");
    expect(data.comparison).toHaveProperty("acceptedTotalDeltaPct");
    expect(data.comparison).toHaveProperty("avgAcceptedTicketDeltaPct");
    expect(data.comparison).toHaveProperty("paymentsDeltaPct");
  });
});
