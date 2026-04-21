<script lang='ts'>
  import GenericFilterBar from '$lib/components/admin/GenericFilterBar.svelte';

  type Props = {
    currentSearch: string;
    currentStatus: string;
  };

  let { currentSearch, currentStatus }: Props = $props();

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
/>
