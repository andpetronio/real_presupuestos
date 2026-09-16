export type PurchaseExportRow = {
  rawMaterialName: string;
  baseUnit: string;
  netQuantity: number;
  wastagePercentage: number;
  yieldFactor: number;
  purchaseQuantity: number | null;
};

const roundPurchaseQuantity = (value: number): number =>
  Number(value.toFixed(2));

export const buildPurchaseExportRows = (
  requirements: ReadonlyArray<PurchaseExportRow>,
): Array<Array<string | number>> => [
  [
    "Materia prima",
    "Unidad",
    "Cantidad neta",
    "Merma (%)",
    "Rendimiento",
    "Cantidad a comprar",
  ],
  ...requirements.map((requirement) => [
    requirement.rawMaterialName,
    requirement.baseUnit,
    requirement.netQuantity,
    Number.isNaN(requirement.wastagePercentage)
      ? "Variable"
      : requirement.wastagePercentage,
    Number.isNaN(requirement.yieldFactor) ? "Variable" : requirement.yieldFactor,
    requirement.purchaseQuantity === null
      ? "No calculable"
      : roundPurchaseQuantity(requirement.purchaseQuantity),
  ]),
];

export const exportPurchasesXlsx = async (params: {
  monthLabel: string;
  monthValue: string;
  requirements: ReadonlyArray<PurchaseExportRow>;
}): Promise<void> => {
  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.aoa_to_sheet([
    ["Consolidado de compras"],
    [params.monthLabel],
    [],
    ...buildPurchaseExportRows(params.requirements),
  ]);
  worksheet["!cols"] = [
    { wch: 30 },
    { wch: 12 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 22 },
  ];
  for (let row = 5; row <= params.requirements.length + 4; row += 1) {
    const purchaseCell = worksheet[`F${row}`];
    if (purchaseCell?.t === "n") purchaseCell.z = "0.00";
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Compras");
  XLSX.writeFile(workbook, `compras-${params.monthValue}.xlsx`, {
    compression: true,
  });
};
