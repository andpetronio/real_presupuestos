<script lang="ts">
  import { Button, Search, Select, Label } from 'flowbite-svelte';
  import type { BudgetStatus } from '$lib/types/budget';

  type TutorOption = { id: string; full_name: string };

  // "pending" is a virtual filter value handled server-side
  type FilterStatus = BudgetStatus | 'pending' | 'all';

  type BudgetFilterBarProps = {
    currentStatus: FilterStatus;
    currentSearch: string;
    tutors: ReadonlyArray<TutorOption>;
    currentTutorId: string | null;
  };

  let {
    currentStatus,
    currentSearch,
    tutors,
    currentTutorId
  }: BudgetFilterBarProps = $props();

  // "pending" is a virtual filter value (maps to draft + ready_to_send server-side)
  type FilterValue = BudgetStatus | 'pending' | 'all';

  type StatusOption = { value: FilterValue; label: string };

  const statusOptions: StatusOption[] = [
    { value: 'all', label: 'Todos' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'draft', label: 'Borradores' },
    { value: 'ready_to_send', label: 'Listos para enviar' },
    { value: 'sent', label: 'Enviados' },
    { value: 'accepted', label: 'Aceptados' },
    { value: 'rejected', label: 'Rechazados' },
    { value: 'expired', label: 'Expirados' },
    { value: 'discarded', label: 'Descartados' }
  ];

  let searchValue = $state('');
  let filterForm: HTMLFormElement | undefined;

  const submitFilters = () => {
    filterForm?.requestSubmit();
  };

  // Sync when parent URL params change (e.g., back navigation)
  $effect(() => {
    searchValue = currentSearch;
  });

  // Debounce search — sync to hidden input for form submission
  let debounceTimer: ReturnType<typeof setTimeout>;

  const handleSearchInput = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      // The actual submission happens via the form button
    }, 300);
  };

  const hasActiveFilters = $derived(
    currentStatus !== 'all' || currentSearch !== '' || currentTutorId !== null
  );
</script>

<form method="GET" class="mb-4 flex flex-wrap items-end gap-3" bind:this={filterForm} novalidate>
  <!-- Search -->
  <div class="min-w-48 flex-1">
    <Label for="budget-search" class="mb-1">Buscar tutor</Label>
    <Search
      id="budget-search"
      name="q"
      placeholder="Nombre del tutor…"
      required={false}
      bind:value={searchValue}
      oninput={handleSearchInput}
    />
  </div>

  <!-- Status filter -->
  <div class="w-44">
    <Label for="budget-status" class="mb-1">Estado</Label>
    <Select
      id="budget-status"
      name="status"
      value={currentStatus}
      onchange={submitFilters}
    >
      {#each statusOptions as opt (opt.value)}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </Select>
  </div>

  <!-- Tutor filter -->
  {#if tutors.length > 0}
    <div class="w-44">
      <Label for="budget-tutor" class="mb-1">Tutor</Label>
      <Select
        id="budget-tutor"
        name="tutor"
        value={currentTutorId ?? ''}
        onchange={submitFilters}
      >
        <option value="">Todos los tutores</option>
        {#each tutors as tutor (tutor.id)}
          <option value={tutor.id}>{tutor.full_name}</option>
        {/each}
      </Select>
    </div>
  {/if}

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
