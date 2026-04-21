/**
 * Finance helpers shared by budget UI/server.
 */

const roundMoney = (value: number): number => Number(value.toFixed(2));

/**
 * Calculates profit from total cost and margin-over-sale.
 *
 * Formula:
 * - salePrice = totalCost / (1 - margin)
 * - profit = salePrice - totalCost
 * - equivalent: totalCost * (margin / (1 - margin))
 */
export const calculateProfitFromCostAndMargin = (
  totalCost: number,
  margin: number,
): number => {
  if (!Number.isFinite(totalCost) || totalCost <= 0) return 0;
  if (!Number.isFinite(margin) || margin <= 0 || margin >= 1) return 0;

  const rawProfit = totalCost * (margin / (1 - margin));
  return roundMoney(rawProfit);
};
