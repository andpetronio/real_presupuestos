<script lang="ts">
  import GenericFilterBar from '$lib/components/admin/GenericFilterBar.svelte';

  type TutorFilterBarProps = {
    currentSearch: string;
    currentStatus: string;
    currentSortBy: 'full_name' | 'whatsapp_number' | 'is_active';
    currentSortDir: 'asc' | 'desc';
  };

  let { currentSearch, currentStatus, currentSortBy, currentSortDir }: TutorFilterBarProps = $props();

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
  currentSortBy={currentSortBy}
  currentSortDir={currentSortDir}
/>
