<script lang="ts">
  import { Button } from 'flowbite-svelte';
  import { buildPaginationHref } from './pagination.model';

  type RawMaterialPaginationProps = {
    page: number;
    totalPages: number;
    total: number;
    search: string;
    status: string;
  };

  let {
    page,
    totalPages,
    total,
    search,
    status
  }: RawMaterialPaginationProps = $props();

  const hasPrev = $derived(page > 1);
  const hasNext = $derived(page < totalPages);
</script>

{#if totalPages > 1}
  <nav
    class="mt-4 flex items-center justify-between"
    aria-label="Paginación de materias primas"
  >
    <!-- Previous -->
    <div>
      {#if hasPrev}
        <Button
          href={buildPaginationHref('/raw-materials', page - 1, { search, status })}
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
      <span>{total} materia{total !== 1 ? 's prima' : ' prima'}</span>
    </p>

    <!-- Next -->
    <div>
      {#if hasNext}
        <Button
          href={buildPaginationHref('/raw-materials', page + 1, { search, status })}
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