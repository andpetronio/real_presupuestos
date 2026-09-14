<script lang="ts">
  import { Button } from 'flowbite-svelte';
  import { CalendarBlank } from '$lib/icons/phosphor';

  type DeliveryAlert = {
    kind: 'due_soon' | 'overdue';
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
    missingMeals: number;
    remainingMeals: number;
    daysOffset: number;
    daysUntil: number;
  };

  type Props = {
    alerts: DeliveryAlert[];
    showLink?: boolean;
  };

  let { alerts, showLink = true }: Props = $props();

  const overdueAlerts = $derived(alerts.filter((alert) => alert.kind === 'overdue'));
  const dueSoonAlerts = $derived(alerts.filter((alert) => alert.kind === 'due_soon'));
</script>

{#if alerts.length > 0}
  <section class="mb-5 rounded-lg border border-gray-200 bg-white" aria-labelledby="delivery-alerts-title">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
      <div class="flex items-center gap-2">
          <CalendarBlank size={18} class="text-accent-600" />
          <h2 id="delivery-alerts-title" class="text-sm font-semibold text-gray-900">Alertas de entrega</h2>
      </div>
      {#if showLink}
        <Button href="/seguimiento" color="light" size="xs">Ver seguimiento</Button>
      {/if}
    </div>
    <div class="grid gap-3 p-3 lg:grid-cols-2">
        {#if overdueAlerts.length > 0}
          <div class="rounded-md border border-red-200 bg-red-50 p-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-red-700">Entregas con demora</p>
            <ul class="mt-2 space-y-1.5">
              {#each overdueAlerts as alert (alert.budgetDogRecipeId + '-' + alert.dayOfMonth)}
                {@const lateLabel = alert.daysOffset === 1 ? 'hace 1 día' : `hace ${alert.daysOffset} días`}
                <li class="rounded border border-red-100 bg-white/70 px-2.5 py-2 text-sm text-gray-800">
                  <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span class="font-semibold text-gray-900">{alert.dogName}<span class="font-normal text-gray-600">{alert.tutorName !== 'Sin tutor' ? ` · ${alert.tutorName}` : ''}</span></span>
                    <span class="text-xs font-semibold text-red-700">{lateLabel}</span>
                  </div>
                  <p class="mt-0.5 text-xs text-gray-600">{alert.recipeName} · <strong class="font-semibold text-gray-800">{alert.missingMeals} comidas pendientes</strong> · día {alert.dayOfMonth}</p>
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        {#if dueSoonAlerts.length > 0}
          <div class="rounded-md border border-amber-200 bg-amber-50 p-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-amber-800">Entregas próximas</p>
            <ul class="mt-2 space-y-1.5">
              {#each dueSoonAlerts as alert (alert.budgetDogRecipeId + '-' + alert.dayOfMonth)}
                {@const urgency = alert.daysOffset <= 1 ? 'font-medium text-amber-900' : 'text-gray-800'}
                {@const whenLabel = alert.daysOffset === 0 ? 'hoy' : alert.daysOffset === 1 ? 'mañana' : `en ${alert.daysOffset} días`}

                <li class="rounded border border-amber-100 bg-white/70 px-2.5 py-2 text-sm {urgency}">
                  <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span class="font-semibold text-gray-900">{alert.dogName}<span class="font-normal text-gray-600">{alert.tutorName !== 'Sin tutor' ? ` · ${alert.tutorName}` : ''}</span></span>
                    <span class="text-xs font-semibold text-amber-800">{whenLabel}</span>
                  </div>
                  <p class="mt-0.5 text-xs text-gray-600">{alert.recipeName} · <strong class="font-semibold text-gray-800">{alert.missingMeals} comidas pendientes</strong> · día {alert.dayOfMonth}</p>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
    </div>
  </section>
{/if}
