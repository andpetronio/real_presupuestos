<script lang="ts">
  import GenericFilterBar from '$lib/components/admin/GenericFilterBar.svelte';

  type Props = {
    currentSearch: string;
    currentStatus: string;
    currentAvailability: string;
  };

  let { currentSearch, currentStatus, currentAvailability }: Props = $props();

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
  ];

  const availabilityOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'enabled', label: 'Habilitados' },
    { value: 'disabled', label: 'No habilitados' },
  ];
</script>

<div class="space-y-3">
  <GenericFilterBar
    searchPlaceholder="Buscar producto..."
    currentSearch={currentSearch}
    filterLabel="Estado"
    filterName="status"
    filterOptions={statusOptions}
    currentFilter={currentStatus}
    showSubmitButton={true}
  />

  <form method="GET" class="flex flex-wrap items-end gap-3">
    <input type="hidden" name="q" value={currentSearch} />
    <input type="hidden" name="status" value={currentStatus} />
    <div class="w-48">
      <label for="availability" class="mb-1 block text-sm font-medium text-gray-900">Disponibilidad</label>
      <select id="availability" name="availability" class="block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900">
        {#each availabilityOptions as option (option.value)}
          <option value={option.value} selected={currentAvailability === option.value}>{option.label}</option>
        {/each}
      </select>
    </div>
    <button type="submit" class="inline-flex items-center rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800">Aplicar</button>
  </form>
</div>
