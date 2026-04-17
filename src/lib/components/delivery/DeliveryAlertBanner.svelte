<script lang="ts">
  import { Button } from 'flowbite-svelte';
  import { CalendarBlank } from '$lib/icons/phosphor';

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

  type Props = {
    alerts: DeliveryAlert[];
    showLink?: boolean;
  };

  let { alerts, showLink = true }: Props = $props();
</script>

{#if alerts.length > 0}
  <div class="mb-4 w-fit rounded-lg border-l-4 border-l-accent-500 bg-white p-4 shadow-sm">
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <CalendarBlank size={18} class="text-accent-600" />
          <p class="text-sm font-semibold text-gray-900">Entregas próximas</p>
        </div>
        <ul class="mt-2 space-y-1">
          {#each alerts as alert (alert.budgetDogRecipeId + '-' + alert.dayOfMonth)}
            {@const urgency = alert.daysUntil <= 1 ? 'text-red-600 font-medium' : alert.daysUntil <= 3 ? 'text-orange-600' : 'text-gray-600'}
            {@const whenLabel = alert.daysUntil === 0 ? 'hoy' : alert.daysUntil === 1 ? 'mañana' : `en ${alert.daysUntil} días`}

            <li class="text-sm {urgency}">
              <span class="font-semibold text-gray-900">{alert.dogName}</span>
              {#if alert.tutorName !== 'Sin tutor'}
                <span class="text-gray-500"> de {alert.tutorName}</span>
              {/if}
              — {alert.recipeName}: <strong>{alert.remainingMeals}</strong> comidas restantes
              (día {alert.dayOfMonth}, {whenLabel})
            </li>
          {/each}
        </ul>
      </div>
      {#if showLink}
        <Button href="/seguimiento" color="light" size="xs" class="flex-shrink-0">Ver seguimiento</Button>
      {/if}
    </div>
  </div>
{/if}
