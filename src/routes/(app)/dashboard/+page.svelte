<script lang="ts">
  import { Card, Button, Label, Select } from 'flowbite-svelte';
  import { formatArs } from '$lib/shared/currency';
  import DualBarChart from '$lib/components/admin/charts/DualBarChart.svelte';
  import AmountChart from '$lib/components/admin/charts/AmountChart.svelte';
  import MetricCard from '$lib/components/admin/MetricCard.svelte';
  import HighlightCard from '$lib/components/admin/HighlightCard.svelte';
  import { formatBucketLabel } from '$lib/components/admin/charts/chart.model';
  import { route } from '$lib/shared/navigation';
  import { CalendarBlank, CurrencyDollar, PaperPlaneTilt } from '$lib/icons/phosphor';

  type PeriodKey = '7d' | '30d' | '90d' | 'mtd';

  type DeliveryAlert = {
    budgetId: string;
    budgetReferenceMonth: string;
    dogId: string;
    dogName: string;
    tutorName: string;
    recipeId: string;
    recipeName: string;
    budgetDogRecipeId: string;
    assignedDays: number;
    dayOfMonth: number;
    pct: number;
    totalMealsForPortion: number;
    deliveredMeals: number;
    remainingMeals: number;
    daysUntil: number;
  };

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
      paymentsDeltaPct: number | null;
    };
    payments: {
      collected: number;
      count: number;
      avgAmount: number;
    };
    pendingAcceptedCount: number;
    deliveryAlerts: DeliveryAlert[];
  };

  let { data }: { data: DashboardData } = $props();

  const sentTrend = $derived(
    data.comparison.sentDeltaPct != null && data.comparison.sentDeltaPct >= 0 ? 'up' : 'down'
  );

  const acceptedPct = $derived(
    data.metrics.sent > 0 ? Math.round((data.metrics.accepted / data.metrics.sent) * 100) : 0
  );

  const rejectedPct = $derived(
    data.metrics.sent > 0 ? Math.round((data.metrics.rejected / data.metrics.sent) * 100) : 0
  );
</script>

{#if data.pendingAcceptedCount > 0}
  <Card class="mb-4 border-l-4 border-l-yellow-400 p-4 shadow-sm">
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

{#if data.deliveryAlerts.length > 0}
  <Card class="mb-4 border-l-4 border-l-accent-500 p-4 shadow-sm xl:col-span-12">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <CalendarBlank size={18} class="text-accent-600" />
          <p class="text-sm font-semibold text-gray-900">Entregas próximas</p>
        </div>
        <ul class="mt-2 space-y-1">
          {#each data.deliveryAlerts as alert (alert.budgetDogRecipeId + '-' + alert.dayOfMonth)}
            {@const urgency = alert.daysUntil <= 1 ? 'text-red-600 font-medium' : alert.daysUntil <= 3 ? 'text-orange-600' : 'text-gray-600'}
            {@const whenLabel = alert.daysUntil === 0 ? 'hoy' : alert.daysUntil === 1 ? 'mañana' : `en ${alert.daysUntil} días`}

            <li class="text-sm {urgency}">
              <span class="font-semibold text-gray-900">{alert.dogName}</span>
              {#if alert.tutorName !== 'Sin tutor'}
                <span class="text-gray-500">de {alert.tutorName}</span>
              {/if}
              — {alert.recipeName}: <strong>{alert.remainingMeals}</strong> comidas restantes
              (día {alert.dayOfMonth}, {whenLabel})
            </li>
          {/each}
        </ul>
      </div>
      <Button href="/seguimiento" color="light" size="xs">Ver seguimiento</Button>
    </div>
  </Card>
{/if}

<div class="mb-4 flex items-center gap-2">
  <form method="GET" class="flex items-center gap-2">
    <Select name="period" value={data.period}>
      {#each data.periodOptions as option}
        <option value={option.key}>{option.label}</option>
      {/each}
    </Select>
    <Button type="submit">Aplicar</Button>
  </form>
</div>

<section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
  <!-- Fila 1: Cobranzas + Aceptado -->
  <div class="flex h-full flex-col xl:col-span-6">
    <HighlightCard
      label="Cobranzas del período"
      value={formatArs(data.payments.collected)}
      delta={data.comparison.paymentsDeltaPct}
      deltaLabel="vs período anterior"
    >
      {#snippet iconSnippet()}
        <CurrencyDollar size={20} aria-hidden="true" />
      {/snippet}
    </HighlightCard>
  </div>

  <div class="flex h-full flex-col xl:col-span-6">
    <HighlightCard
      label="Total aceptado"
      value={formatArs(data.metrics.acceptedTotal)}
      delta={data.comparison.acceptedTotalDeltaPct}
      deltaLabel="vs período anterior"
    >
      {#snippet iconSnippet()}
        <CurrencyDollar size={20} aria-hidden="true" />
      {/snippet}
    </HighlightCard>
  </div>

  <!-- Fila 2: Enviados + Rechazados + Aceptados -->
  <div class="flex h-full flex-col xl:col-span-4">
    <MetricCard
      label="Enviados"
      value={data.metrics.sent}
      delta={data.comparison.sentDeltaPct}
      trendDirection={sentTrend}
      colorVariant="default"
    >
      {#snippet iconSnippet()}
        <PaperPlaneTilt size={20} class="text-gray-400" aria-hidden="true" />
      {/snippet}
    </MetricCard>
  </div>

  <div class="flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm xl:col-span-4">
    <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Rechazados</p>
    <div class="flex items-end justify-between">
      <span class="text-3xl font-bold text-secondary-600">{data.metrics.rejected}</span>
      <span class="text-lg font-semibold text-secondary-500">({rejectedPct}%)</span>
    </div>
    <p class="text-xs text-gray-400">sobre enviados</p>
  </div>

  <div class="flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm xl:col-span-4">
    <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Aceptados</p>
    <div class="flex items-end justify-between">
      <span class="text-3xl font-bold text-accent-600">{data.metrics.accepted}</span>
      <span class="text-lg font-semibold text-accent-500">({acceptedPct}%)</span>
    </div>
    <p class="text-xs text-gray-400">sobre enviados</p>
  </div>

  <!-- Fila 3: Charts -->
  <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm xl:col-span-6">
    <p class="mb-3 text-sm font-semibold text-gray-900">Evolución económica del período</p>
    {#if data.timeseries.length === 0}
      <p class="text-sm text-gray-500">No hay datos para este período.</p>
    {:else}
      <div class="grid grid-cols-2 gap-3">
        <AmountChart
          data={data.timeseries.map((t) => ({
            bucket: formatBucketLabel(t.bucket),
            value: t.acceptedAmount
          }))}
          label="Monto aceptado"
          color="#01646d"
          height={180}
        />
        <AmountChart
          data={data.timeseries.map((t) => ({
            bucket: formatBucketLabel(t.bucket),
            value: t.avgTicket ?? 0
          }))}
          label="Ticket promedio"
          color="#ffa45d"
          height={180}
        />
      </div>
    {/if}
  </div>

  <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm xl:col-span-6">
    <div class="mb-3 flex items-center justify-between gap-2">
      <p class="text-sm font-semibold text-gray-900">Enviados vs Respondidos</p>
      <div class="flex items-center gap-3 text-xs text-gray-500">
        <span class="inline-flex items-center gap-1">
          <span class="h-2 w-2 rounded-full bg-primary-400"></span>Enviados
        </span>
        <span class="inline-flex items-center gap-1">
          <span class="h-2 w-2 rounded-full bg-accent-500"></span>Respondidos
        </span>
      </div>
    </div>
    {#if data.timeseries.length === 0}
      <p class="text-sm text-gray-500">No hay datos para este período.</p>
    {:else}
      <DualBarChart
        data={data.timeseries.map((t) => ({
          bucket: formatBucketLabel(t.bucket),
          sent: t.sent,
          responded: t.responded
        }))}
        height={180}
      />
    {/if}
  </div>
</section>
