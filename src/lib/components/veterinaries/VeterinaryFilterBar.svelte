<script lang="ts">
  import GenericFilterBar from '$lib/components/admin/GenericFilterBar.svelte';

  type VeterinaryFilterBarProps = {
    currentSearch: string;
    currentSortBy: 'name';
    currentSortDir: 'asc' | 'desc';
  };

  let { currentSearch, currentSortBy, currentSortDir }: VeterinaryFilterBarProps = $props();
</script>

<GenericFilterBar
  searchPlaceholder="Nombre de la veterinaria…"
  currentSearch={currentSearch}
  currentSortBy={currentSortBy}
  currentSortDir={currentSortDir}
/>
