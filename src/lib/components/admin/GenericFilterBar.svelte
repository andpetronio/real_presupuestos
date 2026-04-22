<script lang="ts">
  import { Button, Search, Select, Label } from 'flowbite-svelte';

  type FilterOption = { value: string; label: string };

  type GenericFilterBarProps = {
    searchPlaceholder?: string;
    searchName?: string;
    currentSearch?: string;
    filterLabel?: string;
    filterName?: string;
    filterOptions?: ReadonlyArray<FilterOption>;
    currentFilter?: string;
    showSubmitButton?: boolean;
    currentSortBy?: string;
    currentSortDir?: 'asc' | 'desc';
  };

  let {
    searchPlaceholder = 'Buscar...',
    searchName = 'q',
    currentSearch = '',
    filterLabel = 'Filtro',
    filterName = 'status',
    filterOptions = [],
    currentFilter = 'all',
    showSubmitButton = false,
    currentSortBy = '',
    currentSortDir = 'asc'
  }: GenericFilterBarProps = $props();

  let searchValue = $state('');
  let filterForm: HTMLFormElement | undefined;

  const submitFilters = () => {
    filterForm?.requestSubmit();
  };

  // Sync when parent URL params change (e.g., back navigation)
  $effect(() => {
    searchValue = currentSearch;
  });

  const hasActiveFilters = $derived(
    currentSearch !== '' || (currentFilter !== 'all' && currentFilter !== '')
  );

  const clearHref = $derived.by(() => {
    const parts: string[] = [];
    if (currentSortBy) {
      parts.push(`sortBy=${encodeURIComponent(currentSortBy)}`);
      parts.push(`sortDir=${encodeURIComponent(currentSortDir)}`);
    }
    parts.push('page=1');
    return `?${parts.join('&')}`;
  });
</script>

<form method="GET" class="mb-4 flex flex-wrap items-end gap-3" bind:this={filterForm} novalidate>
  <!-- Search -->
  <div class="min-w-48 flex-1">
    <Label for="filter-search" class="mb-1">Buscar</Label>
    <Search
      id="filter-search"
      name={searchName}
      placeholder={searchPlaceholder}
      required={false}
      bind:value={searchValue}
    />
  </div>

  <!-- Filter dropdown (optional) -->
  {#if filterOptions.length > 0}
    <div class="w-40">
      <Label for="filter-select" class="mb-1">{filterLabel}</Label>
      <Select id="filter-select" name={filterName} value={currentFilter} onchange={submitFilters}>
        {#each filterOptions as option (option.value)}
          <option value={option.value}>{option.label}</option>
        {/each}
      </Select>
    </div>
  {/if}

  <!-- Actions -->
  <div class="flex gap-2">
    {#if showSubmitButton}
      <Button type="submit" size="sm">Filtrar</Button>
    {/if}
    {#if hasActiveFilters}
      <Button type="button" color="alternative" size="sm" href={clearHref}>
        Limpiar
      </Button>
    {/if}
  </div>

  <!-- Preserve page on filter submit -->
  <input type="hidden" name="page" value="1" />
  {#if currentSortBy}
    <input type="hidden" name="sortBy" value={currentSortBy} />
    <input type="hidden" name="sortDir" value={currentSortDir} />
  {/if}
</form>
