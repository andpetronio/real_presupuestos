<script lang="ts">
  import { Button } from 'flowbite-svelte';
  import { buildPaginationHref } from './pagination.model';

  type TutorPaginationProps = {
    page: number;
    totalPages: number;
    total: number;
    search: string;
  };

  let {
    page,
    totalPages,
    total,
    search
  }: TutorPaginationProps = $props();

  const hasPrev = $derived(page > 1);
  const hasNext = $derived(page < totalPages);
</script>

{#if totalPages > 1}
  <nav
    class="mt-4 flex items-center justify-between"
    aria-label="Paginación de tutores"
  >
    <!-- Previous -->
    <div>
      {#if hasPrev}
        <Button
          href={buildPaginationHref('/tutors', page - 1, { search })}
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
      <span>{total} tutor{total !== 1 ? 'es' : ''}</span>
    </p>

    <!-- Next -->
    <div>
      {#if hasNext}
        <Button
          href={buildPaginationHref('/tutors', page + 1, { search })}
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