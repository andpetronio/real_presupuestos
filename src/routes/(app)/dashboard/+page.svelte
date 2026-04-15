<script lang="ts">
  import { Alert, Button, Card, Label, Select } from 'flowbite-svelte';
  import { CurrencyDollar } from '$lib/icons/phosphor';
  import { formatArs } from '$lib/shared/currency';

  type PeriodKey = '7d' | '30d' | '90d' | 'mtd';

  type DashboardData = {
    state: 'success' | 'error';
    message: { kind: 'error'; title: string; detail?: string; actionLabel?: string } | null;
    period: PeriodKey;
    periodOptions: ReadonlyArray<{ key: PeriodKey; label: string }>;
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
    timeseries: ReadonlyArray<{
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
    };
  };

  let { data }: { data: DashboardData } = $props();

  const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

  const formatDelta = (value: number | null, asRate = false) => {
    if (value === null) return 'N/A';
    const rounded = asRate ? value * 100 : value;
    const sign = rounded > 0 ? '+' : '';
    return `${sign}${rounded.toFixed(1)}%`;
  };

  const getMax = (values: ReadonlyArray<number>) => {
    const max = Math.max(...values, 0);
    return max > 0 ? max : 1;
  };

  const barHeight = (value: number, max: number) => {
    if (value <= 0) return 0;
    return Math.max((value / max) * 100, 6);
  };

  const formatBucketLabel = (bucket: string) => {
    const [year, month, day] = bucket.split('-').map(Number);
    if (!year || !month || !day) return bucket;
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
  };

  const acceptanceLineChart = $derived.by(() => {
    // Moving average (window=3) inline — no separate $derived needed
    const windowSize = 3;
    const movingValues = data.timeseries.map((_, index, source) => {
      const start = Math.max(0, index - (windowSize - 1));
      const window = source.slice(start, index + 1);
      const sum = window.reduce((acc, point) => acc + point.acceptanceRate, 0);
      return window.length > 0 ? sum / window.length : 0;
    });

    if (movingValues.length === 0) return { width: 320, polyline: '' };

    const widthPerPoint = 40;
    const width = Math.max(movingValues.length * widthPerPoint, 320);
    const chartHeight = 180;
    const padding = 16;

    const points = movingValues
      .map((value, index) => {
        const x = movingValues.length === 1 ? width / 2 : padding + (index * (width - padding * 2)) / (movingValues.length - 1);
        const y = padding + (1 - value) * (chartHeight - padding * 2);
        return `${x},${y}`;
      })
      .join(' ');

    return { width, polyline: points };
  });
</script>

<section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
  <Card size="xl" class="h-full p-6 shadow-sm md:col-span-2 xl:col-span-8">
    <div class="flex flex-wrap items-end justify-between gap-3 border-b border-gray-100 pb-4">
      <div>
        <p class="text-sm font-medium text-gray-600">Indicadores comerciales</p>
        <h2 class="mt-1 text-2xl font-bold text-gray-900">Rendimiento del periodo</h2>
      </div>

      <form method="GET" class="flex w-full flex-wrap items-end gap-2 sm:w-auto">
        <div class="w-full sm:w-56">
          <Label for="period">Periodo</Label>
          <Select id="period" name="period" value={data.period}>
            {#each data.periodOptions as option (option.key)}
              <option value={option.key}>{option.label}</option>
            {/each}
          </Select>
        </div>
        <Button type="submit" class="w-full sm:w-auto">Aplicar</Button>
      </form>
    </div>

    {#if data.state === 'error' && data.message}
      <Alert color="red" class="mt-4">
        <p class="font-semibold">{data.message.title}</p>
        {#if data.message.detail}
          <p>{data.message.detail}</p>
        {/if}
      </Alert>
    {/if}

    <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-lg border border-gray-200 bg-white p-4">
        <p class="text-xs uppercase tracking-wide text-gray-500">Enviados</p>
        <p class="mt-2 text-3xl font-bold text-gray-900">{data.metrics.sent}</p>
        <p class="mt-1 text-xs text-gray-500">{formatDelta(data.comparison.sentDeltaPct)} vs período anterior</p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-4">
        <p class="text-xs uppercase tracking-wide text-gray-500">Aceptados</p>
        <p class="mt-2 text-3xl font-bold text-accent-600">{data.metrics.accepted}</p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-4">
        <p class="text-xs uppercase tracking-wide text-gray-500">Rechazados</p>
        <p class="mt-2 text-3xl font-bold text-secondary-700">{data.metrics.rejected}</p>
      </div>
      <div class="rounded-lg border border-gray-200 bg-white p-4">
        <p class="text-xs uppercase tracking-wide text-gray-500">Pendientes</p>
        <p class="mt-2 text-3xl font-bold text-primary-700">{data.metrics.pending}</p>
      </div>
    </div>
  </Card>

  <Card size="xl" class="h-full p-6 shadow-sm xl:col-span-4">
    <div class="rounded-xl border border-primary-200 bg-primary-50 p-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs uppercase tracking-wide text-primary-700">Total aceptado</p>
          <p class="mt-1 text-3xl font-bold text-primary-700">{formatArs(data.metrics.acceptedTotal)}</p>
          <p class="mt-1 text-sm text-primary-700/80">{formatDelta(data.comparison.acceptedTotalDeltaPct)} vs período anterior</p>
        </div>
        <span class="rounded-lg bg-white p-2 text-primary-700">
          <CurrencyDollar size={20} />
        </span>
      </div>

      <div class="mt-4 rounded-lg border border-primary-200 bg-white/70 p-3">
        <p class="text-xs uppercase tracking-wide text-primary-700">Ticket promedio aceptado</p>
        <p class="mt-1 text-xl font-semibold text-primary-700">{formatArs(data.metrics.avgAcceptedTicket)}</p>
        <p class="text-xs text-primary-700/80">{formatDelta(data.comparison.avgAcceptedTicketDeltaPct)} vs período anterior</p>
      </div>
    </div>
  </Card>

  <Card size="xl" class="h-full p-6 shadow-sm xl:col-span-4">
    <p class="text-sm font-semibold text-gray-900">Ratios del periodo</p>

    <div class="mt-4 space-y-4">
      <div>
        <div class="mb-1 flex items-center justify-between text-sm">
          <span class="text-gray-600">Aceptación</span>
          <strong class="text-gray-900">{formatPercent(data.metrics.acceptanceRate)}</strong>
        </div>
        <div class="h-2 rounded-full bg-gray-200">
          <div class="h-2 rounded-full bg-accent-500" style={`width: ${formatPercent(data.metrics.acceptanceRate)}`}></div>
        </div>
      </div>

      <div>
        <div class="mb-1 flex items-center justify-between text-sm">
          <span class="text-gray-600">Rechazo</span>
          <strong class="text-gray-900">{formatPercent(data.metrics.rejectionRate)}</strong>
        </div>
        <div class="h-2 rounded-full bg-gray-200">
          <div class="h-2 rounded-full bg-secondary-500" style={`width: ${formatPercent(data.metrics.rejectionRate)}`}></div>
        </div>
      </div>

      <div>
        <div class="mb-1 flex items-center justify-between text-sm">
          <span class="text-gray-600">Respondidos</span>
          <strong class="text-gray-900">{data.metrics.responded}</strong>
        </div>
        <p class="text-xs text-gray-500">{formatDelta(data.comparison.respondedDeltaPct)} vs período anterior</p>
      </div>

      <div>
        <div class="mb-1 flex items-center justify-between text-sm">
          <span class="text-gray-600">Tasa de aceptación</span>
          <strong class="text-gray-900">{formatDelta(data.comparison.acceptanceRateDeltaPct, true)}</strong>
        </div>
      </div>
    </div>
  </Card>

  <Card size="xl" class="h-full p-6 shadow-sm xl:col-span-8">
    <div class="flex items-center justify-between gap-2">
      <p class="text-sm font-semibold text-gray-900">Evolución: enviados vs respondidos</p>
      <div class="flex items-center gap-3 text-xs text-gray-500">
        <span class="inline-flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-primary-300"></span>Enviados</span>
        <span class="inline-flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-accent-500"></span>Respondidos</span>
      </div>
    </div>

    {#if data.timeseries.length === 0}
      <p class="mt-6 text-sm text-gray-500">No hay datos de serie para este período.</p>
    {:else}
      {@const maxVolume = getMax(data.timeseries.map((point) => Math.max(point.sent, point.responded)))}

      <div class="mt-4 flex h-56 items-end gap-2 overflow-x-auto pb-2">
        {#each data.timeseries as point (point.bucket)}
          <div class="flex min-w-8 flex-col items-center gap-1">
            <div class="flex h-40 items-end gap-1">
              <div
                class="w-2 rounded-t bg-primary-300"
                style={`height: ${barHeight(point.sent, maxVolume)}%`}
                title={`${formatBucketLabel(point.bucket)} · Enviados: ${point.sent}`}
              ></div>
              <div
                class="w-2 rounded-t bg-accent-500"
                style={`height: ${barHeight(point.responded, maxVolume)}%`}
                title={`${formatBucketLabel(point.bucket)} · Respondidos: ${point.responded}`}
              ></div>
            </div>
            <span class="text-[10px] text-gray-500">{formatBucketLabel(point.bucket)}</span>
          </div>
        {/each}
      </div>
    {/if}
  </Card>

  <Card size="xl" class="h-full p-6 shadow-sm xl:col-span-4">
    <p class="text-sm font-semibold text-gray-900">Tendencia de aceptación (móvil)</p>

    {#if data.timeseries.length === 0}
      <p class="mt-6 text-sm text-gray-500">No hay datos de tendencia para este período.</p>
    {:else}
      <div class="mt-4 overflow-x-auto">
        <svg width={acceptanceLineChart.width} height="180" viewBox={`0 0 ${acceptanceLineChart.width} 180`} class="min-w-full">
          <line x1="0" y1="164" x2={acceptanceLineChart.width} y2="164" class="stroke-gray-200" stroke-width="1" />
          <polyline points={acceptanceLineChart.polyline} fill="none" class="stroke-accent-500" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <p class="mt-2 text-xs text-gray-500">Promedio móvil simple de 3 buckets.</p>
    {/if}
  </Card>

  <Card size="xl" class="h-full p-6 shadow-sm md:col-span-2 xl:col-span-12">
    <p class="text-sm font-semibold text-gray-900">Evolución económica del período</p>

    {#if data.timeseries.length === 0}
      <p class="mt-6 text-sm text-gray-500">No hay datos económicos para este período.</p>
    {:else}
      {@const maxAmount = getMax(data.timeseries.map((point) => point.acceptedAmount))}
      {@const maxTicket = getMax(data.timeseries.map((point) => point.avgTicket ?? 0))}
      <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <p class="mb-2 text-xs uppercase tracking-wide text-gray-500">Monto aceptado</p>
          <div class="flex h-48 items-end gap-2 overflow-x-auto pb-2">
            {#each data.timeseries as point (point.bucket)}
              <div class="flex min-w-8 flex-col items-center gap-1">
                <div
                  class="w-3 rounded-t bg-primary-600"
                  style={`height: ${barHeight(point.acceptedAmount, maxAmount)}%`}
                  title={`${formatBucketLabel(point.bucket)} · ${formatArs(point.acceptedAmount)}`}
                ></div>
                <span class="text-[10px] text-gray-500">{formatBucketLabel(point.bucket)}</span>
              </div>
            {/each}
          </div>
        </div>

        <div>
          <p class="mb-2 text-xs uppercase tracking-wide text-gray-500">Ticket promedio aceptado</p>
          <div class="flex h-48 items-end gap-2 overflow-x-auto pb-2">
            {#each data.timeseries as point (point.bucket)}
              <div class="flex min-w-8 flex-col items-center gap-1">
                <div
                  class="w-3 rounded-t bg-highlight-500"
                  style={`height: ${barHeight(point.avgTicket ?? 0, maxTicket)}%`}
                  title={`${formatBucketLabel(point.bucket)} · ${formatArs(point.avgTicket ?? 0)}`}
                ></div>
                <span class="text-[10px] text-gray-500">{formatBucketLabel(point.bucket)}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </Card>
</section>
