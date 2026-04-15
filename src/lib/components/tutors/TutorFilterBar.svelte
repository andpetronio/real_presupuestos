<script lang="ts">
  import { Button, Search, Label } from 'flowbite-svelte';

  type TutorFilterBarProps = {
    currentSearch: string;
  };

  let { currentSearch }: TutorFilterBarProps = $props();

  let searchValue = $state('');

  // Sync when parent URL params change (e.g., back navigation)
  $effect(() => {
    searchValue = currentSearch;
  });

  const hasActiveFilters = $derived(currentSearch !== '');
</script>

<form method="GET" class="mb-4 flex flex-wrap items-end gap-3">
  <!-- Search -->
  <div class="min-w-48 flex-1">
    <Label for="tutor-search" class="mb-1">Buscar tutor</Label>
    <Search
      id="tutor-search"
      name="q"
      placeholder="Nombre del tutor…"
      bind:value={searchValue}
    />
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