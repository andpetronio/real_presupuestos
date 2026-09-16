import { describe, expect, it } from "vitest";
import { load } from "./+page.server";

type QueryCall = { method: string; args: unknown[] };

const createSupabase = (snapshots: unknown[]) => {
  const calls: QueryCall[] = [];
  const result = { data: snapshots, error: null };
  const query = {
    select: (...args: unknown[]) => {
      calls.push({ method: "select", args });
      return query;
    },
    gte: (...args: unknown[]) => {
      calls.push({ method: "gte", args });
      return query;
    },
    lt: (...args: unknown[]) => {
      calls.push({ method: "lt", args });
      return query;
    },
    then: <TResult>(
      onfulfilled?: ((value: typeof result) => TResult | PromiseLike<TResult>) | null,
    ) => Promise.resolve(result).then(onfulfilled),
  };

  return {
    calls,
    client: {
      from: (table: string) => {
        expect(table).toBe("purchase_requirement_snapshots");
        return query;
      },
    },
  };
};

describe("/purchases load", () => {
  it("lee snapshots del mes solicitado y agrega aportes históricos", async () => {
    const { client, calls } = createSupabase([
      {
        raw_material_id: "chicken",
        raw_material_name: "Pechuga de pollo",
        base_unit: "g",
        wastage_percentage: 30,
        yield_factor: 1,
        net_quantity: 500,
        purchase_quantity: 714.285714,
      },
      {
        raw_material_id: "chicken",
        raw_material_name: "Pechuga de pollo",
        base_unit: "g",
        wastage_percentage: 30,
        yield_factor: 1,
        net_quantity: 500,
        purchase_quantity: 714.285714,
      },
    ]);

    const result = await load({
      locals: { supabase: client },
      url: new URL("https://test.local/purchases?month=2026-10"),
    } as never);
    if (!result) throw new Error("La carga de compras no devolvió datos");

    expect(calls).toContainEqual({
      method: "gte",
      args: ["reference_month", "2026-10-01"],
    });
    expect(calls).toContainEqual({
      method: "lt",
      args: ["reference_month", "2026-11-01"],
    });
    expect(result.referenceMonth).toBe("2026-10");
    expect(result.requirements).toEqual([
      expect.objectContaining({
        rawMaterialId: "chicken",
        netQuantity: 1000,
        purchaseQuantity: expect.closeTo(1428.571428),
      }),
    ]);
  });

  it("devuelve vacío para un mes sin snapshots", async () => {
    const { client } = createSupabase([]);

    const result = await load({
      locals: { supabase: client },
      url: new URL("https://test.local/purchases?month=2026-02"),
    } as never);
    if (!result) throw new Error("La carga de compras no devolvió datos");

    expect(result.referenceMonth).toBe("2026-02");
    expect(result.requirements).toEqual([]);
  });
});
