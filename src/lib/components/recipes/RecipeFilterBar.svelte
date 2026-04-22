<script lang="ts">
  import GenericFilterBar from '$lib/components/admin/GenericFilterBar.svelte';

  type RecipeFilterBarProps = {
    currentSearch: string;
    currentStatus: string;
    currentSortBy: 'name' | 'is_active';
    currentSortDir: 'asc' | 'desc';
  };

  let { currentSearch, currentStatus, currentSortBy, currentSortDir }: RecipeFilterBarProps = $props();

  const statusOptions = [
    { value: 'all', label: 'Todas' },
    { value: 'active', label: 'Activas' },
    { value: 'inactive', label: 'Inactivas' }
  ];
</script>

<GenericFilterBar
  searchPlaceholder="Nombre de la receta…"
  currentSearch={currentSearch}
  filterLabel="Estado"
  filterName="status"
  filterOptions={statusOptions}
  currentFilter={currentStatus}
  showSubmitButton={true}
  currentSortBy={currentSortBy}
  currentSortDir={currentSortDir}
/>
