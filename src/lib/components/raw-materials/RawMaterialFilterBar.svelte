<script lang="ts">
  import { Button, Search, Select, Label } from 'flowbite-svelte';

  type RawMaterialFilterBarProps = {
    currentSearch: string;
    currentStatus: string;
  };

  let { currentSearch, currentStatus }: RawMaterialFilterBarProps = $props();

  let searchValue = $state('');
  let filterForm: HTMLFormElement | undefined;

  const submitFilters = () => {
    filterForm?.requestSubmit();
  };

  // Sync when parent URL params change (e.g., back navigation)
  $effect(() => {
    searchValue = currentSearch;
  });

  const statusOptions = [
    { value: 'all', label: 'Todas' },
    { value: 'active', label: 'Activas' },
    { value: 'inactive', label: 'Inactivas' }
  ];

  const hasActiveFilters = $derived(currentSearch !== '' || currentStatus !== 'active');
</script>

<form method="GET" class="mb-4 flex flex-wrap items-end gap-3" bind:this={filterForm} novalidate>
  <!-- Search -->
  <div class="min-w-48 flex-1">
    <Label for="raw-material-search" class="mb-1">Buscar materia prima</Label>
    <Search
      id="raw-material-search"
      name="q"
      placeholder="Nombre de la materia prima…"
      required={false}
      bind:value={searchValue}
    />
  </div>

  <!-- Status filter -->
  <div class="w-40">
    <Label for="raw-material-status" class="mb-1">Estado</Label>
    <Select
      id="raw-material-status"
      name="status"
      value={currentStatus}
      onchange={submitFilters}
    >
      {#each statusOptions as opt (opt.value)}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </Select>
  </div>

  <!-- Actions -->
  <div class="flex gap-2">
    <Button type="submit" size="sm">Filtrar</Button>
    {#if hasActiveFilters}
      <Button
        href="?page=1"
        size="sm"
        color="light"
        aria-label="Limpiar filtros"
      >
        Limpiar
      </Button>
    {/if}
  </div>

  <!-- Preserve page on filter submit -->
  <input type="hidden" name="page" value="1" />
</form>
