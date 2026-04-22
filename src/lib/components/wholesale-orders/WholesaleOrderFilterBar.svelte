<script lang="ts">
  import GenericFilterBar from '$lib/components/admin/GenericFilterBar.svelte';

  type Props = {
    currentSearch: string;
    currentStatus: string;
    currentSortBy: 'wholesaler' | 'placed_at' | 'status' | 'total_units' | 'total_ars';
    currentSortDir: 'asc' | 'desc';
  };
  let { currentSearch, currentStatus, currentSortBy, currentSortDir }: Props = $props();

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'delivered', label: 'Entregados' },
    { value: 'paid', label: 'Cobrados' },
  ];
</script>

<GenericFilterBar
  searchPlaceholder="Buscar por mayorista o nota..."
  currentSearch={currentSearch}
  filterLabel="Estado"
  filterName="status"
  filterOptions={statusOptions}
  currentFilter={currentStatus}
  showSubmitButton={true}
  currentSortBy={currentSortBy}
  currentSortDir={currentSortDir}
/>
