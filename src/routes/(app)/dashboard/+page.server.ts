import type { PageServerLoad } from './$types';
import type { OperatorMessage } from '$lib/server/shared/ui-state';
import type { BudgetStatus } from '$lib/types/budget';
import { getUnviewedAcceptedBudgetCount } from '$lib/server/budgets/tracking';

type PeriodKey = '7d' | '30d' | '90d' | 'mtd';
type BucketGranularity = 'day' | 'week';

type BudgetMetricRow = {
  status: BudgetStatus;
  sent_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  final_sale_price: number;
};

type AggregateMetrics = {
  sent: number;
  accepted: number;
  rejected: number;
  responded: number;
  acceptanceRate: number;
  rejectionRate: number;
  acceptedTotal: number;
  pending: number;
  avgAcceptedTicket: number;
};

type SeriesPoint = {
  bucket: string;
  sent: number;
  responded: number;
  accepted: number;
  rejected: number;
  acceptedAmount: number;
  avgTicket: number | null;
  acceptanceRate: number;
};

const PERIOD_OPTIONS: ReadonlyArray<{ key: PeriodKey; label: string }> = [
  { key: '7d', label: 'Ultimos 7 dias' },
  { key: '30d', label: 'Ultimos 30 dias' },
  { key: '90d', label: 'Ultimos 90 dias' },
  { key: 'mtd', label: 'Mes actual' }
];

const fallbackErrorMessage: OperatorMessage = {
  kind: 'error',
  title: 'No pudimos cargar el dashboard',
  detail: 'Reintenta en unos segundos o revisa la autenticacion del operador.',
  actionLabel: 'Reintentar'
};

const isPeriodKey = (value: string | null): value is PeriodKey =>
  value === '7d' || value === '30d' || value === '90d' || value === 'mtd';

const getBucketGranularity = (period: PeriodKey): BucketGranularity =>
  period === '90d' || period === 'mtd' ? 'week' : 'day';

const startOfDay = (value: Date): Date => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const startOfWeek = (value: Date): Date => {
  const date = startOfDay(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
};

const addDays = (value: Date, amount: number): Date => {
  const date = new Date(value);
  date.setDate(date.getDate() + amount);
  return date;
};

const addWeeks = (value: Date, amount: number): Date => addDays(value, amount * 7);

const formatBucketKey = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeToBucketStart = (value: Date, granularity: BucketGranularity): Date =>
  granularity === 'day' ? startOfDay(value) : startOfWeek(value);

const getStartDateForPeriod = (period: PeriodKey): Date => {
  const now = new Date();
  const start = new Date(now);

  if (period === 'mtd') {
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }

  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return start;
};

const inPeriod = (value: string | null, start: Date, end: Date): boolean => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date >= start && date <= end;
};

const createBucketKeys = (start: Date, end: Date, granularity: BucketGranularity): string[] => {
  const keys: string[] = [];
  const current = normalizeToBucketStart(start, granularity);
  const limit = end.getTime();

  while (current.getTime() <= limit) {
    keys.push(formatBucketKey(current));
    const next = granularity === 'day' ? addDays(current, 1) : addWeeks(current, 1);
    current.setTime(next.getTime());
  }

  return keys;
};

const sentFunnelStatuses = new Set<BudgetStatus>(['sent', 'accepted', 'rejected', 'expired']);

const isSentTracked = (row: BudgetMetricRow): boolean => sentFunnelStatuses.has(row.status);

const isAcceptedTracked = (row: BudgetMetricRow): boolean => row.status === 'accepted';

const isRejectedTracked = (row: BudgetMetricRow): boolean => row.status === 'rejected';

const aggregateMetrics = (rows: ReadonlyArray<BudgetMetricRow>, start: Date, end: Date): AggregateMetrics => {
  const sent = rows.filter((row) => isSentTracked(row) && inPeriod(row.sent_at, start, end)).length;
  const acceptedRows = rows.filter((row) => isAcceptedTracked(row) && inPeriod(row.accepted_at, start, end));
  const rejectedRows = rows.filter((row) => isRejectedTracked(row) && inPeriod(row.rejected_at, start, end));

  const accepted = acceptedRows.length;
  const rejected = rejectedRows.length;
  const responded = accepted + rejected;
  const pending = Math.max(sent - responded, 0);

  const acceptedTotal = acceptedRows.reduce((sum, row) => sum + Number(row.final_sale_price ?? 0), 0);

  return {
    sent,
    accepted,
    rejected,
    responded,
    acceptanceRate: responded > 0 ? accepted / responded : 0,
    rejectionRate: responded > 0 ? rejected / responded : 0,
    acceptedTotal,
    pending,
    avgAcceptedTicket: accepted > 0 ? acceptedTotal / accepted : 0
  };
};

const getDeltaPercentage = (current: number, previous: number): number | null => {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }

  return ((current - previous) / previous) * 100;
};

const buildTimeSeries = (
  rows: ReadonlyArray<BudgetMetricRow>,
  start: Date,
  end: Date,
  granularity: BucketGranularity
): SeriesPoint[] => {
  const bucketKeys = createBucketKeys(start, end, granularity);
  const baseEntries = bucketKeys.map((key) => [
    key,
    {
      bucket: key,
      sent: 0,
      responded: 0,
      accepted: 0,
      rejected: 0,
      acceptedAmount: 0,
      avgTicket: null,
      acceptanceRate: 0
    }
  ] as const);

  const byBucket = new Map<string, SeriesPoint>(baseEntries);

  for (const row of rows) {
    if (isSentTracked(row) && row.sent_at && inPeriod(row.sent_at, start, end)) {
      const key = formatBucketKey(normalizeToBucketStart(new Date(row.sent_at), granularity));
      const bucket = byBucket.get(key);
      if (bucket) bucket.sent += 1;
    }

    if (isAcceptedTracked(row) && row.accepted_at && inPeriod(row.accepted_at, start, end)) {
      const key = formatBucketKey(normalizeToBucketStart(new Date(row.accepted_at), granularity));
      const bucket = byBucket.get(key);
      if (bucket) {
        bucket.accepted += 1;
        bucket.responded += 1;
        bucket.acceptedAmount += Number(row.final_sale_price ?? 0);
      }
    }

    if (isRejectedTracked(row) && row.rejected_at && inPeriod(row.rejected_at, start, end)) {
      const key = formatBucketKey(normalizeToBucketStart(new Date(row.rejected_at), granularity));
      const bucket = byBucket.get(key);
      if (bucket) {
        bucket.rejected += 1;
        bucket.responded += 1;
      }
    }
  }

  for (const point of byBucket.values()) {
    point.acceptanceRate = point.responded > 0 ? point.accepted / point.responded : 0;
    point.avgTicket = point.accepted > 0 ? point.acceptedAmount / point.accepted : null;
  }

  return bucketKeys.map((key) => byBucket.get(key) as SeriesPoint);
};

export const load: PageServerLoad = async ({ parent, locals, url }) => {
  const { actorId } = await parent();

  const queryPeriod = url.searchParams.get('period');
  const selectedPeriod: PeriodKey = isPeriodKey(queryPeriod) ? queryPeriod : '30d';

  try {
    if (!actorId?.trim()) {
      throw new Error('Actor no autenticado para dashboard.');
    }

    const now = new Date();
    const periodStart = getStartDateForPeriod(selectedPeriod);
    const durationMs = now.getTime() - periodStart.getTime();
    const previousPeriodEnd = new Date(periodStart.getTime() - 1);
    const previousPeriodStart = new Date(previousPeriodEnd.getTime() - durationMs);
    const granularity = getBucketGranularity(selectedPeriod);

    const [{ data, error }, paymentsResult] = await Promise.all([
      locals.supabase
        .from('budgets')
        .select('status, sent_at, accepted_at, rejected_at, final_sale_price'),
      locals.supabase
        .from('budget_payments')
        .select('amount, paid_at')
        .gte('paid_at', periodStart.toISOString())
        .lte('paid_at', now.toISOString())
    ]);

    if (error) throw error;

    const rows = (data ?? []) as BudgetMetricRow[];
    const pendingAcceptedCount = await getUnviewedAcceptedBudgetCount(locals.supabase);
    const current = aggregateMetrics(rows, periodStart, now);
    const previous = aggregateMetrics(rows, previousPeriodStart, previousPeriodEnd);
    const timeseries = buildTimeSeries(rows, periodStart, now, granularity);

    const payments = (paymentsResult.data ?? []) as Array<{ amount: number; paid_at: string }>;
    const paymentsCollected = payments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
    const paymentsCount = payments.length;
    const paymentsAvgAmount = paymentsCount > 0 ? paymentsCollected / paymentsCount : 0;

    const previousPeriodPaymentsResult = await locals.supabase
      .from('budget_payments')
      .select('amount')
      .gte('paid_at', previousPeriodStart.toISOString())
      .lte('paid_at', previousPeriodEnd.toISOString());
    const prevPayments = (previousPeriodPaymentsResult.data ?? []) as Array<{ amount: number }>;
    const prevCollected = prevPayments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
    const paymentsDelta = getDeltaPercentage(paymentsCollected, prevCollected);

    return {
      state: 'success' as const,
      message: null,
      period: selectedPeriod,
      periodOptions: PERIOD_OPTIONS,
      metrics: {
        sent: current.sent,
        accepted: current.accepted,
        rejected: current.rejected,
        responded: current.responded,
        pending: current.pending,
        acceptanceRate: current.acceptanceRate,
        rejectionRate: current.rejectionRate,
        acceptedTotal: current.acceptedTotal,
        avgAcceptedTicket: current.avgAcceptedTicket
      },
      timeseries,
      comparison: {
        sentDeltaPct: getDeltaPercentage(current.sent, previous.sent),
        respondedDeltaPct: getDeltaPercentage(current.responded, previous.responded),
        acceptanceRateDeltaPct: getDeltaPercentage(current.acceptanceRate, previous.acceptanceRate),
        acceptedTotalDeltaPct: getDeltaPercentage(current.acceptedTotal, previous.acceptedTotal),
        avgAcceptedTicketDeltaPct: getDeltaPercentage(current.avgAcceptedTicket, previous.avgAcceptedTicket),
        paymentsDeltaPct: paymentsDelta
      },
      payments: {
        collected: paymentsCollected,
        count: paymentsCount,
        avgAmount: paymentsAvgAmount
      },
      pendingAcceptedCount
    };
  } catch {
    return {
      state: 'error' as const,
      message: fallbackErrorMessage,
      period: selectedPeriod,
      periodOptions: PERIOD_OPTIONS,
      metrics: {
        sent: 0,
        accepted: 0,
        rejected: 0,
        responded: 0,
        pending: 0,
        acceptanceRate: 0,
        rejectionRate: 0,
        acceptedTotal: 0,
        avgAcceptedTicket: 0
      },
      timeseries: [],
      comparison: {
        sentDeltaPct: 0,
        respondedDeltaPct: 0,
        acceptanceRateDeltaPct: 0,
        acceptedTotalDeltaPct: 0,
        avgAcceptedTicketDeltaPct: 0,
        paymentsDeltaPct: 0
      },
      payments: {
        collected: 0,
        count: 0,
        avgAmount: 0
      },
      pendingAcceptedCount: 0
    };
  }
};
