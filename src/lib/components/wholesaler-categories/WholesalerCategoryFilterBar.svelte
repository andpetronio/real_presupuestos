<script lang='ts'>
  import GenericFilterBar from '$lib/components/admin/GenericFilterBar.svelte';

  type Props = {
    currentSearch: string;
    currentStatus: string;
    currentSortBy: 'name' | 'is_active' | 'created_at';
    currentSortDir: 'asc' | 'desc';
  };

  let { currentSearch, currentStatus, currentSortBy, currentSortDir }: Props = $props();

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activas' },
    { value: 'inactive', label: 'Inactivas' },
  ];
</script>

<GenericFilterBar
  searchPlaceholder='Buscar categoría...'
  currentSearch={currentSearch}
  filterLabel='Estado'
  filterName='status'
  filterOptions={statusOptions}
  currentFilter={currentStatus}
  showSubmitButton={true}
  currentSortBy={currentSortBy}
  currentSortDir={currentSortDir}
/>
