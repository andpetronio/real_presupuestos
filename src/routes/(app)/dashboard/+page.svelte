<script lang="ts">
  import { Alert, Button, Card, Label, Select } from 'flowbite-svelte';
  import { CurrencyDollar, PaperPlaneTilt, CheckCircle, XCircle, Clock } from '$lib/icons/phosphor';
  import { formatArs } from '$lib/shared/currency';
  import DualBarChart from '$lib/components/admin/charts/DualBarChart.svelte';
  import LineChart from '$lib/components/admin/charts/LineChart.svelte';
  import AmountChart from '$lib/components/admin/charts/AmountChart.svelte';
  import MetricCard from '$lib/components/admin/MetricCard.svelte';
  import HighlightCard from '$lib/components/admin/HighlightCard.svelte';
  import { formatBucketLabel } from '$lib/components/admin/charts/chart.model';

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
    pendingAcceptedCount: number;
  };

  let { data }: { data: DashboardData } = $props();

  const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

  const formatDelta = (value: number | null, asRate = false) => {
    if (value === null) return 'N/A';
    const rounded = asRate ? value * 100 : value;
    const sign = rounded > 0 ? '+' : '';
    return `${sign}${rounded.toFixed(1)}%`;
  };
</script>

<section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
  {#if data.pendingAcceptedCount > 0}
    <Card size="xl" class="h-full border-l-4 border-l-yellow-400 p-5 shadow-sm md:col-span-2 xl:col-span-12">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-gray-900">Tenés novedades para gestionar</p>
          <p class="text-sm text-gray-600">
            Hay {data.pendingAcceptedCount} presupuesto{data.pendingAcceptedCount === 1 ? '' : 's'} aceptado{data.pendingAcceptedCount === 1 ? '' : 's'} sin revisar.
          </p>
        </div>
        <Button href="/seguimiento" color="light">Ir a seguimiento</Button>
      </div>
    </Card>
  {/if}

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
      <MetricCard
        label="Enviados"
        value={data.metrics.sent}
        delta={data.comparison.sentDeltaPct}
        trendDirection={data.comparison.sentDeltaPct != null && data.comparison.sentDeltaPct >= 0 ? 'up' : 'down'}
        colorVariant="default"
      >
        {#snippet iconSnippet()}
          <PaperPlaneTilt size={20} class="text-gray-400" aria-hidden="true" />
        {/snippet}
      </MetricCard>

      <MetricCard
        label="Aceptados"
        value={data.metrics.accepted}
        delta={data.comparison.sentDeltaPct}
        trendDirection={data.comparison.sentDeltaPct != null && data.comparison.sentDeltaPct >= 0 ? 'up' : 'down'}
        colorVariant="accent"
      >
        {#snippet iconSnippet()}
          <CheckCircle size={20} class="text-accent-500" aria-hidden="true" />
        {/snippet}
      </MetricCard>

      <MetricCard
        label="Rechazados"
        value={data.metrics.rejected}
        colorVariant="secondary"
      >
        {#snippet iconSnippet()}
          <XCircle size={20} class="text-secondary-500" aria-hidden="true" />
        {/snippet}
      </MetricCard>

      <MetricCard
        label="Pendientes"
        value={data.metrics.pending}
        colorVariant="primary"
      >
        {#snippet iconSnippet()}
          <Clock size={20} class="text-primary-500" aria-hidden="true" />
        {/snippet}
      </MetricCard>
    </div>
  </Card>

  <Card size="xl" class="h-full p-6 shadow-sm xl:col-span-4">
    <HighlightCard
      label="Total aceptado"
      value={formatArs(data.metrics.acceptedTotal)}
      delta={data.comparison.acceptedTotalDeltaPct}
      deltaLabel="vs período anterior"
      subValue={{
        label: 'Ticket promedio aceptado',
        value: formatArs(data.metrics.avgAcceptedTicket)
      }}
    >
      {#snippet iconSnippet()}
        <CurrencyDollar size={20} aria-hidden="true" />
      {/snippet}
    </HighlightCard>
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
        <span class="inline-flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-primary-400"></span>Enviados</span>
        <span class="inline-flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-accent-500"></span>Respondidos</span>
      </div>
    </div>

    {#if data.timeseries.length === 0}
      <p class="mt-6 text-sm text-gray-500">No hay datos de serie para este período.</p>
    {:else}
      <div class="mt-4">
        <DualBarChart
          data={data.timeseries.map((t) => ({
            bucket: formatBucketLabel(t.bucket),
            sent: t.sent,
            responded: t.responded
          }))}
          height={220}
        />
      </div>
    {/if}
  </Card>

  <Card size="xl" class="h-full p-6 shadow-sm xl:col-span-4">
    <p class="text-sm font-semibold text-gray-900">Tendencia de aceptación (móvil)</p>

    {#if data.timeseries.length === 0}
      <p class="mt-6 text-sm text-gray-500">No hay datos de tendencia para este período.</p>
    {:else}
      <div class="mt-4">
        <LineChart
          data={data.timeseries.map((t) => ({
            bucket: formatBucketLabel(t.bucket),
            acceptanceRate: t.acceptanceRate
          }))}
          height={180}
          showArea={true}
        />
      </div>
      <p class="mt-2 text-xs text-gray-500">Promedio móvil simple de 3 buckets.</p>
    {/if}
  </Card>

  <Card size="xl" class="h-full p-6 shadow-sm md:col-span-2 xl:col-span-12">
    <p class="text-sm font-semibold text-gray-900">Evolución económica del período</p>

    {#if data.timeseries.length === 0}
      <p class="mt-6 text-sm text-gray-500">No hay datos económicos para este período.</p>
    {:else}
      <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <p class="mb-2 text-xs uppercase tracking-wide text-gray-500">Monto aceptado</p>
          <AmountChart
            data={data.timeseries.map((t) => ({
              bucket: formatBucketLabel(t.bucket),
              value: t.acceptedAmount
            }))}
            label="Monto aceptado"
            color="#01646d"
            height={200}
          />
        </div>

        <div>
          <p class="mb-2 text-xs uppercase tracking-wide text-gray-500">Ticket promedio aceptado</p>
          <AmountChart
            data={data.timeseries.map((t) => ({
              bucket: formatBucketLabel(t.bucket),
              value: t.avgTicket ?? 0
            }))}
            label="Ticket promedio"
            color="#ffa45d"
            height={200}
          />
        </div>
      </div>
    {/if}
  </Card>
</section>
