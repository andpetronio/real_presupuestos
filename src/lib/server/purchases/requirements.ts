export type PurchaseInput = {
  rawMaterial: {
    id: string;
    name: string;
    baseUnit: string;
    wastagePercentage: number;
    yieldFactor: number;
  };
  dailyQuantity: number;
  assignedDays: number;
};

export type PurchaseRequirement = {
  rawMaterialId: string;
  rawMaterialName: string;
  baseUnit: string;
  netQuantity: number;
  wastagePercentage: number;
  yieldFactor: number;
  purchaseQuantity: number | null;
};

export type PurchaseRequirementSnapshotInput = {
  rawMaterialId: string;
  rawMaterialName: string;
  baseUnit: string;
  wastagePercentage: number;
  yieldFactor: number;
  netQuantity: number;
  purchaseQuantity: number | null;
};

const toFiniteNumber = (value: number): number =>
  Number.isFinite(value) ? value : 0;

/**
 * Consolidates the current recipe composition assigned to accepted budgets.
 * A 100% wastage cannot produce a finite purchase quantity, so it is exposed
 * as null for the UI to flag instead of returning Infinity.
 */
export const buildPurchaseRequirements = (
  inputs: ReadonlyArray<PurchaseInput>,
): PurchaseRequirement[] => {
  const requirementsByMaterialId = new Map<string, PurchaseRequirement>();

  for (const input of inputs) {
    const netQuantity =
      toFiniteNumber(input.dailyQuantity) * toFiniteNumber(input.assignedDays);
    const existing = requirementsByMaterialId.get(input.rawMaterial.id);

    if (existing) {
      existing.netQuantity += netQuantity;
      continue;
    }

    requirementsByMaterialId.set(input.rawMaterial.id, {
      rawMaterialId: input.rawMaterial.id,
      rawMaterialName: input.rawMaterial.name,
      baseUnit: input.rawMaterial.baseUnit,
      netQuantity,
      wastagePercentage: toFiniteNumber(input.rawMaterial.wastagePercentage),
      yieldFactor: toFiniteNumber(input.rawMaterial.yieldFactor),
      purchaseQuantity: null,
    });
  }

  return Array.from(requirementsByMaterialId.values())
    .map((requirement) => {
      const yieldRatio = 1 - requirement.wastagePercentage / 100;

      return {
        ...requirement,
        purchaseQuantity:
          yieldRatio > 0
            ? requirement.netQuantity / yieldRatio / requirement.yieldFactor
            : null,
      };
    })
    .sort((a, b) =>
      a.rawMaterialName.localeCompare(b.rawMaterialName, "es", {
        sensitivity: "base",
      }),
    );
};

export const getNextReferenceMonthRange = (now: Date): {
  start: string;
  end: string;
} => {
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const followingMonth = new Date(now.getFullYear(), now.getMonth() + 2, 1);
  const toDateOnly = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  return { start: toDateOnly(nextMonth), end: toDateOnly(followingMonth) };
};

const formatMonth = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export const getDefaultPurchaseMonth = (now: Date): string =>
  formatMonth(new Date(now.getFullYear(), now.getMonth() + 1, 1));

export const resolvePurchaseMonth = (value: string | null, now: Date): string => {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    return getDefaultPurchaseMonth(now);
  }

  return value;
};

export const getPurchaseMonthRange = (month: string): {
  start: string;
  end: string;
} => {
  const [year, monthNumber] = month.split("-").map(Number);
  const startDate = new Date(year, monthNumber - 1, 1);
  const endDate = new Date(year, monthNumber, 1);
  const toDateOnly = (date: Date): string =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  return { start: toDateOnly(startDate), end: toDateOnly(endDate) };
};

export const aggregatePurchaseRequirementSnapshots = (
  snapshots: ReadonlyArray<PurchaseRequirementSnapshotInput>,
): PurchaseRequirement[] => {
  const requirementsByMaterialId = new Map<string, PurchaseRequirement>();

  for (const snapshot of snapshots) {
    const existing = requirementsByMaterialId.get(snapshot.rawMaterialId);
    if (!existing) {
      requirementsByMaterialId.set(snapshot.rawMaterialId, {
        rawMaterialId: snapshot.rawMaterialId,
        rawMaterialName: snapshot.rawMaterialName,
        baseUnit: snapshot.baseUnit,
        netQuantity: toFiniteNumber(snapshot.netQuantity),
        wastagePercentage: toFiniteNumber(snapshot.wastagePercentage),
        yieldFactor: toFiniteNumber(snapshot.yieldFactor),
        purchaseQuantity:
          snapshot.purchaseQuantity === null
            ? null
            : toFiniteNumber(snapshot.purchaseQuantity),
      });
      continue;
    }

    existing.netQuantity += toFiniteNumber(snapshot.netQuantity);
    existing.purchaseQuantity =
      existing.purchaseQuantity === null || snapshot.purchaseQuantity === null
        ? null
        : existing.purchaseQuantity + toFiniteNumber(snapshot.purchaseQuantity);
    if (existing.wastagePercentage !== toFiniteNumber(snapshot.wastagePercentage)) {
      existing.wastagePercentage = Number.NaN;
    }
    if (existing.yieldFactor !== toFiniteNumber(snapshot.yieldFactor)) {
      existing.yieldFactor = Number.NaN;
    }
  }

  return Array.from(requirementsByMaterialId.values()).sort((a, b) =>
    a.rawMaterialName.localeCompare(b.rawMaterialName, "es", {
      sensitivity: "base",
    }),
  );
};
