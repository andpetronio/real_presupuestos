<script lang="ts">
  import GenericFilterBar from '$lib/components/admin/GenericFilterBar.svelte';

  type RawMaterialFilterBarProps = {
    currentSearch: string;
    currentStatus: string;
    currentSortBy: 'name' | 'base_unit' | 'cost_with_wastage' | 'is_active';
    currentSortDir: 'asc' | 'desc';
  };

  let { currentSearch, currentStatus, currentSortBy, currentSortDir }: RawMaterialFilterBarProps = $props();

  const statusOptions = [
    { value: 'all', label: 'Todas' },
    { value: 'active', label: 'Activas' },
    { value: 'inactive', label: 'Inactivas' }
  ];
</script>

<GenericFilterBar
  searchPlaceholder="Nombre de la materia prima…"
  currentSearch={currentSearch}
  filterLabel="Estado"
  filterName="status"
  filterOptions={statusOptions}
  currentFilter={currentStatus}
  showSubmitButton={true}
  currentSortBy={currentSortBy}
  currentSortDir={currentSortDir}
/>
