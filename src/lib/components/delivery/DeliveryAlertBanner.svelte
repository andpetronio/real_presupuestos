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
  <div class="mb-4 w-fit rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <CalendarBlank size={18} class="text-accent-600" />
          <p class="text-sm font-semibold text-gray-900">Alertas de entrega</p>
        </div>
        {#if overdueAlerts.length > 0}
          <div class="mt-2 rounded-md border border-red-200 bg-red-50 p-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-red-700">Entregas con demora</p>
            <ul class="mt-1 space-y-1">
              {#each overdueAlerts as alert (alert.budgetDogRecipeId + '-' + alert.dayOfMonth)}
                {@const lateLabel = alert.daysOffset === 1 ? 'hace 1 día' : `hace ${alert.daysOffset} días`}
                <li class="text-sm text-gray-800">
                  <span class="font-semibold text-gray-900">{alert.dogName}</span>
                  {#if alert.tutorName !== 'Sin tutor'}
                    <span class="text-gray-600"> de {alert.tutorName}</span>
                  {/if}
                  — {alert.recipeName}: debías entregar <strong>{alert.missingMeals}</strong>
                  comida{alert.missingMeals === 1 ? '' : 's'} (día {alert.dayOfMonth}, {lateLabel})
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        {#if dueSoonAlerts.length > 0}
          <div class="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-amber-800">Entregas próximas</p>
            <ul class="mt-1 space-y-1">
              {#each dueSoonAlerts as alert (alert.budgetDogRecipeId + '-' + alert.dayOfMonth)}
                {@const urgency = alert.daysOffset <= 1 ? 'font-medium text-amber-900' : 'text-gray-800'}
                {@const whenLabel = alert.daysOffset === 0 ? 'hoy' : alert.daysOffset === 1 ? 'mañana' : `en ${alert.daysOffset} días`}

                <li class="text-sm {urgency}">
                  <span class="font-semibold text-gray-900">{alert.dogName}</span>
                  {#if alert.tutorName !== 'Sin tutor'}
                    <span class="text-gray-600"> de {alert.tutorName}</span>
                  {/if}
                  — {alert.recipeName}: <strong>{alert.missingMeals}</strong> comidas pendientes
                  (día {alert.dayOfMonth}, {whenLabel})
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
      {#if showLink}
        <Button href="/seguimiento" color="light" size="xs" class="flex-shrink-0">Ver seguimiento</Button>
      {/if}
    </div>
  </div>
{/if}
