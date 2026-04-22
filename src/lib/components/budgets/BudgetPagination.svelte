<script lang="ts">
  import { Button } from 'flowbite-svelte';
  import { buildPaginationHref } from './budget-pagination.model';

  type BudgetPaginationProps = {
    page: number;
    totalPages: number;
    total: number;
    status: string;
    search: string;
    tutorId: string | null;
    sortBy: 'tutor' | 'status' | 'total_cost' | 'final_sale_price' | 'expires_at';
    sortDir: 'asc' | 'desc';
  };

  let {
    page,
    totalPages,
    total,
    status,
    search,
    tutorId,
    sortBy,
    sortDir
  }: BudgetPaginationProps = $props();

  const hasPrev = $derived(page > 1);
  const hasNext = $derived(page < totalPages);
</script>

{#if totalPages > 1}
  <nav
    class="mt-4 flex items-center justify-between"
    aria-label="Paginación de presupuestos"
  >
    <!-- Previous -->
    <div>
      {#if hasPrev}
        <Button
          href={buildPaginationHref('/budgets', page - 1, { status, search, tutorId, sortBy, sortDir })}
          size="sm"
          color="light"
          aria-label="Página anterior"
        >
          Anterior
        </Button>
      {:else}
        <Button size="sm" color="light" disabled aria-disabled="true">
          Anterior
        </Button>
      {/if}
    </div>

    <!-- Page info -->
    <p class="text-sm text-gray-600" aria-live="polite">
      Página <strong>{page}</strong> de <strong>{totalPages}</strong>
      &nbsp;·&nbsp;
      <span>{total} presupuesto{total !== 1 ? 's' : ''}</span>
    </p>

    <!-- Next -->
    <div>
      {#if hasNext}
        <Button
          href={buildPaginationHref('/budgets', page + 1, { status, search, tutorId, sortBy, sortDir })}
          size="sm"
          color="light"
          aria-label="Página siguiente"
        >
          Siguiente
        </Button>
      {:else}
        <Button size="sm" color="light" disabled aria-disabled="true">
          Siguiente
        </Button>
      {/if}
    </div>
  </nav>
{/if}
