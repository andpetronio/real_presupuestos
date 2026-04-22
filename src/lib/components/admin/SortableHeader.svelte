<script lang="ts">
  type SortDir = 'asc' | 'desc';

  type SortableHeaderProps = {
    label: string;
    href: string;
    active: boolean;
    dir: SortDir;
  };

  let { label, href, active, dir }: SortableHeaderProps = $props();

  const indicator = $derived(active ? (dir === 'asc' ? '↑' : '↓') : '↕');
  const ariaSort = $derived(
    active ? (dir === 'asc' ? 'ascendente' : 'descendente') : 'sin orden activo',
  );
</script>

<a
  {href}
  class="inline-flex items-center gap-1 transition-colors hover:text-primary-700"
>
  <span>{label}</span>
  <span aria-hidden="true" class="text-xs text-gray-500">{indicator}</span>
  <span class="sr-only">Orden: {ariaSort}</span>
</a>
