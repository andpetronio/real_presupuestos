<script lang="ts">
  import { ArrowsDownUpIcon, CaretDownIcon, CaretUpIcon } from 'phosphor-svelte';
  type SortDir = 'asc' | 'desc';

  type SortableHeaderProps = {
    label: string;
    href: string;
    active: boolean;
    dir: SortDir;
  };

  let { label, href, active, dir }: SortableHeaderProps = $props();

  const ariaSort = $derived(
    active ? (dir === 'asc' ? 'ascendente' : 'descendente') : 'sin orden activo',
  );
</script>

<a
  {href}
  class="inline-flex items-center gap-1 transition-colors hover:text-primary-700"
>
  <span>{label}</span>
  {#if active}
    {#if dir === 'asc'}
      <CaretUpIcon size={14} weight="bold" aria-hidden="true" class="text-primary-700" />
    {:else}
      <CaretDownIcon size={14} weight="bold" aria-hidden="true" class="text-primary-700" />
    {/if}
  {:else}
    <ArrowsDownUpIcon size={14} aria-hidden="true" class="text-gray-400" />
  {/if}
  <span class="sr-only">Orden: {ariaSort}</span>
</a>
