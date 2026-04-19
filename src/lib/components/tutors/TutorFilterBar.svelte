<script lang="ts">
  import GenericFilterBar from '$lib/components/admin/GenericFilterBar.svelte';

  type TutorFilterBarProps = {
    currentSearch: string;
    currentStatus: string;
  };

  let { currentSearch, currentStatus }: TutorFilterBarProps = $props();

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' }
  ] as const;
</script>

<GenericFilterBar
  searchPlaceholder="Nombre del tutor…"
  currentSearch={currentSearch}
  filterLabel="Estado"
  filterName="status"
  filterOptions={statusOptions}
  currentFilter={currentStatus}
  showSubmitButton={true}
/>
