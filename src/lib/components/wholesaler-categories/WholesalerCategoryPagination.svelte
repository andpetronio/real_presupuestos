<script lang='ts'>
  import { Button } from 'flowbite-svelte';
  import { buildPaginationHref } from './pagination.model';

  type Props = {
    page: number;
    totalPages: number;
    total: number;
    search: string;
    status: string;
  };

  let { page, totalPages, total, search, status }: Props = $props();

  const hasPrev = $derived(page > 1);
  const hasNext = $derived(page < totalPages);
</script>

{#if totalPages > 1}
  <nav class='mt-4 flex items-center justify-between' aria-label='Paginación de categorías mayoristas'>
    <div>
      {#if hasPrev}
        <Button href={buildPaginationHref('/mayorista-categories', page - 1, { search, status })} size='sm' color='light'>Anterior</Button>
      {:else}
        <Button size='sm' color='light' disabled>Anterior</Button>
      {/if}
    </div>

    <p class='text-sm text-gray-600' aria-live='polite'>
      Página <strong>{page}</strong> de <strong>{totalPages}</strong>
      &nbsp;·&nbsp;
      <span>{total} categoría{total !== 1 ? 's' : ''}</span>
    </p>

    <div>
      {#if hasNext}
        <Button href={buildPaginationHref('/mayorista-categories', page + 1, { search, status })} size='sm' color='light'>Siguiente</Button>
      {:else}
        <Button size='sm' color='light' disabled>Siguiente</Button>
      {/if}
    </div>
  </nav>
{/if}
