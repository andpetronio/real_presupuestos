<script lang="ts">
  import GenericFilterBar from '$lib/components/admin/GenericFilterBar.svelte';

  type Props = {
    currentSearch: string;
    currentStatus: string;
    currentSortBy: 'name' | 'presentation' | 'price_ars' | 'is_active' | 'created_at';
    currentSortDir: 'asc' | 'desc';
  };
  let { currentSearch, currentStatus, currentSortBy, currentSortDir }: Props = $props();

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
  ];
</script>

<GenericFilterBar
  searchPlaceholder="Buscar producto o presentación..."
  currentSearch={currentSearch}
  filterLabel="Estado"
  filterName="status"
  filterOptions={statusOptions}
  currentFilter={currentStatus}
  showSubmitButton={true}
  currentSortBy={currentSortBy}
  currentSortDir={currentSortDir}
/>
