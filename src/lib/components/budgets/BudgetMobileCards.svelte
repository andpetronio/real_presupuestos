<script lang="ts">
  import { Card, Button } from 'flowbite-svelte';
  import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
  import type { BudgetStatus } from '$lib/types/budget';
  import { formatArs } from '$lib/shared/currency';
  import { route } from '$lib/shared/navigation';
  import BudgetActionsMenu from './BudgetActionsMenu.svelte';

  type BudgetRow = {
    id: string;
    status: BudgetStatus;
    tutor: { full_name: string } | null;
    ingredient_total_global: number;
    operational_total_global: number;
    total_cost: number;
    final_sale_price: number;
    expires_at: string | null;
  };

  type BudgetMobileCardsProps = {
    budgets: ReadonlyArray<BudgetRow>;
    formatDate: (date: string | null) => string;
  };

  let { budgets, formatDate }: BudgetMobileCardsProps = $props();
</script>

<div class="space-y-3 md:hidden" aria-label="Lista de presupuestos">
  {#each budgets as budget (budget.id)}
    <Card class="p-4" role="listitem">
      <div class="mb-3 flex items-start justify-between gap-2">
        <div>
          <p class="font-semibold text-gray-900">
            {budget.tutor?.full_name ?? 'Sin tutor'}
          </p>
          <p class="mt-0.5 text-xs text-gray-500">
            Creado {formatDate(budget.expires_at)}
          </p>
        </div>
        <StatusBadge status={budget.status} />
      </div>

      <div class="mb-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p class="text-xs text-gray-500">Ingredientes</p>
          <p class="font-medium">{formatArs(budget.ingredient_total_global)}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Operativos</p>
          <p class="font-medium">{formatArs(budget.operational_total_global)}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Costo total</p>
          <p class="font-medium">{formatArs(budget.total_cost)}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Precio venta</p>
          <p class="font-semibold text-gray-900">{formatArs(budget.final_sale_price)}</p>
        </div>
      </div>

      {#if budget.expires_at}
        <p class="mb-3 text-xs text-gray-500">
          Vence: {formatDate(budget.expires_at)}
        </p>
      {/if}

      <div class="flex items-center justify-end">
        <BudgetActionsMenu {budget} />
      </div>
    </Card>
  {/each}
</div>
