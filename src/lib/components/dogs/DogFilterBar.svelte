<script lang="ts">
  import { Button, Search, Select, Label } from 'flowbite-svelte';

  type DogFilterBarProps = {
    currentSearch: string;
    currentStatus: string;
  };

  let { currentSearch, currentStatus }: DogFilterBarProps = $props();

  let searchValue = $state('');

  // Sync when parent URL params change (e.g., back navigation)
  $effect(() => {
    searchValue = currentSearch;
  });

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' }
  ];

  const hasActiveFilters = $derived(currentSearch !== '' || currentStatus !== 'all');
</script>

<form method="GET" class="mb-4 flex flex-wrap items-end gap-3">
  <!-- Search -->
  <div class="min-w-48 flex-1">
    <Label for="dog-search" class="mb-1">Buscar perro</Label>
    <Search
      id="dog-search"
      name="q"
      placeholder="Nombre del perro…"
      bind:value={searchValue}
    />
  </div>

  <!-- Status filter -->
  <div class="w-40">
    <Label for="dog-status" class="mb-1">Estado</Label>
    <Select
      id="dog-status"
      name="status"
      value={currentStatus}
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