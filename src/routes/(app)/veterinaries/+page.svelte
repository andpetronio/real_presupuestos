<script lang="ts">
  import { Button, Card } from 'flowbite-svelte';
  import FeedbackBanner from '$lib/components/FeedbackBanner.svelte';
  import VeterinaryFilterBar from '$lib/components/veterinaries/VeterinaryFilterBar.svelte';
  import VeterinaryTable from '$lib/components/veterinaries/VeterinaryTable.svelte';
  import VeterinaryPagination from '$lib/components/veterinaries/VeterinaryPagination.svelte';
  import VeterinaryMobileCards from '$lib/components/veterinaries/VeterinaryMobileCards.svelte';
  import { buildSortHref } from '$lib/shared/sort-links';

  type VeterinaryRow = {
    id: string;
    name: string;
    created_at: string;
  };

  type PageData = {
    veterinaries: ReadonlyArray<VeterinaryRow>;
    tableState: 'idle' | 'success' | 'error' | 'empty';
    tableMessage: { title: string; detail: string } | null;
    pagination: { page: number; totalPages: number; total: number };
    filters: {
      search: string;
    };
    sort: {
      sortBy: 'name';
      sortDir: 'asc' | 'desc';
    };
  };

  let { data }: { data: PageData } = $props();

  const newVeterinaryPath = '/veterinaries/new';

  const buildVeterinarySortHref = (field: 'name'): string =>
    buildSortHref({
      basePath: '/veterinaries',
      currentSortBy: data.sort.sortBy,
      currentSortDir: data.sort.sortDir,
      clickedField: field,
      filters: {
        q: data.filters.search
      }
    });
</script>

<div class="mb-4 flex justify-end">
  <Button href={newVeterinaryPath} class="bg-secondary hover:bg-secondary-600 text-white">
    Nueva veterinaria
  </Button>
</div>

{#if data.tableState === 'error'}
  <FeedbackBanner message={data.tableMessage?.detail ?? 'No pudimos cargar veterinarias.'} color="red" />
{:else if data.tableState === 'empty'}
  <FeedbackBanner message={data.tableMessage?.detail ?? 'Todavía no hay veterinarias.'} color="blue" />
{:else}
  <Card size="xl" class="w-full shadow-sm p-0">
    <!-- Filter bar -->
    <div class="p-4">
      <VeterinaryFilterBar
        currentSearch={data.filters.search}
        currentSortBy={data.sort.sortBy}
        currentSortDir={data.sort.sortDir}
      />
    </div>

    <!-- Mobile cards (hidden on md+) -->
    <div class="px-4 pb-4">
      <VeterinaryMobileCards veterinaries={data.veterinaries} />
    </div>

    <!-- Desktop table (hidden on < md) -->
    <div class="hidden md:block">
      <VeterinaryTable
        veterinaries={data.veterinaries}
        sortBy={data.sort.sortBy}
        sortDir={data.sort.sortDir}
        buildSortHref={buildVeterinarySortHref}
      />
    </div>

    <!-- Pagination -->
    <div class="px-4 pb-4">
      <VeterinaryPagination
        page={data.pagination.page}
        totalPages={data.pagination.totalPages}
        total={data.pagination.total}
        search={data.filters.search}
        sortBy={data.sort.sortBy}
        sortDir={data.sort.sortDir}
      />
    </div>
  </Card>
{/if}
