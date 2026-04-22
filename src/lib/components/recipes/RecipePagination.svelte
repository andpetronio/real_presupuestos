<script lang="ts">
  import { Button } from 'flowbite-svelte';
  import { buildPaginationHref } from './pagination.model';

  type RecipePaginationProps = {
    page: number;
    totalPages: number;
    total: number;
    search: string;
    status: string;
    sortBy: 'name' | 'is_active';
    sortDir: 'asc' | 'desc';
  };

  let {
    page,
    totalPages,
    total,
    search,
    status,
    sortBy,
    sortDir
  }: RecipePaginationProps = $props();

  const hasPrev = $derived(page > 1);
  const hasNext = $derived(page < totalPages);
</script>

{#if totalPages > 1}
  <nav
    class="mt-4 flex items-center justify-between"
    aria-label="Paginación de recetas"
  >
    <!-- Previous -->
    <div>
      {#if hasPrev}
        <Button
          href={buildPaginationHref('/recipes', page - 1, { search, status, sortBy, sortDir })}
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
      <span>{total} receta{total !== 1 ? 's' : ''}</span>
    </p>

    <!-- Next -->
    <div>
      {#if hasNext}
        <Button
          href={buildPaginationHref('/recipes', page + 1, { search, status, sortBy, sortDir })}
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
