/**
 * Pure model functions for MetricCard and HighlightCard.
 * Tested in metric-card.model.test.ts.
 */

export type TrendDirection = 'up' | 'down' | 'neutral';

export type TrendInput = {
  delta: number | null;
  positiveIsGood?: boolean;
};

/**
 * Resolves trend direction based on delta sign and whether positive values are "good".
 * For most metrics (sent, accepted), positive delta is good (→ 'up').
 * For rejection rate, positive is bad (→ 'down').
 */
export const resolveTrendDirection = (
  delta: number | null,
  positiveIsGood = true
): TrendDirection => {
  if (delta === null) return 'neutral';
  if (delta > 0) return positiveIsGood ? 'up' : 'down';
  if (delta < 0) return positiveIsGood ? 'down' : 'up';
  return 'neutral';
};

/**
 * Formats a delta value for display in a trend badge.
 * Returns empty string for null delta.
 */
export const formatDeltaBadge = (delta: number | null): string => {
  if (delta === null) return '';
  const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '';
  return `${arrow} ${Math.abs(delta).toFixed(1)}%`;
};

/**
 * Resolves CSS color class for delta badge.
 */
export const resolveDeltaColorClass = (
  delta: number | null,
  direction: TrendDirection
): string => {
  if (delta === null) return 'text-gray-500';
  if (direction === 'up') return 'text-green-600';
  if (direction === 'down') return 'text-red-600';
  return 'text-gray-500';
};

/**
 * Resolves CSS color class for the metric value based on variant.
 */
export const resolveValueColorClass = (
  colorVariant: 'default' | 'primary' | 'accent' | 'secondary'
): string => {
  switch (colorVariant) {
    case 'accent':
      return 'text-accent-600';
    case 'secondary':
      return 'text-secondary-700';
    case 'primary':
      return 'text-primary-700';
    default:
      return 'text-gray-900';
  }
};
