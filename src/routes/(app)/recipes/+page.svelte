<script lang="ts">
  import { Button, Card } from 'flowbite-svelte';
  import FeedbackBanner from '$lib/components/FeedbackBanner.svelte';
  import RecipeFilterBar from '$lib/components/recipes/RecipeFilterBar.svelte';
  import RecipeTable from '$lib/components/recipes/RecipeTable.svelte';
  import RecipePagination from '$lib/components/recipes/RecipePagination.svelte';
  import RecipeMobileCards from '$lib/components/recipes/RecipeMobileCards.svelte';
  import { buildSortHref } from '$lib/shared/sort-links';

  type RecipeRow = {
    id: string;
    dog_id: string;
    name: string;
    notes: string | null;
    is_active: boolean;
    dog: { name: string } | null;
  };

  type PageData = {
    recipes: ReadonlyArray<RecipeRow>;
    tableState: 'idle' | 'success' | 'error' | 'empty';
    tableMessage: { title: string; detail: string } | null;
    pagination: { page: number; totalPages: number; total: number };
    filters: {
      search: string;
      status: string;
    };
    sort: {
      sortBy: 'name' | 'is_active';
      sortDir: 'asc' | 'desc';
    };
  };

  let { data }: { data: PageData } = $props();

  const newRecipePath = '/recipes/new';

  const buildRecipeSortHref = (field: 'name' | 'is_active'): string =>
    buildSortHref({
      basePath: '/recipes',
      currentSortBy: data.sort.sortBy,
      currentSortDir: data.sort.sortDir,
      clickedField: field,
      filters: {
        q: data.filters.search,
        status: data.filters.status
      }
    });
</script>

<div class="mb-4 flex justify-end">
  <Button href={newRecipePath} class="bg-secondary hover:bg-secondary-600 text-white">
    Nueva receta
  </Button>
</div>

{#if data.tableState === 'error'}
  <FeedbackBanner message={data.tableMessage?.detail ?? 'No pudimos cargar recetas.'} color="red" />
{:else if data.tableState === 'empty'}
  <FeedbackBanner message={data.tableMessage?.detail ?? 'Todavía no hay recetas.'} color="blue" />
{:else}
  <Card size="xl" class="w-full shadow-sm p-0">
    <!-- Filter bar -->
    <div class="p-4">
      <RecipeFilterBar
        currentSearch={data.filters.search}
        currentStatus={data.filters.status}
        currentSortBy={data.sort.sortBy}
        currentSortDir={data.sort.sortDir}
      />
    </div>

    <!-- Mobile cards (hidden on md+) -->
    <div class="px-4 pb-4">
      <RecipeMobileCards recipes={data.recipes} />
    </div>

    <!-- Desktop table (hidden on < md) -->
    <div class="hidden md:block">
      <RecipeTable
        recipes={data.recipes}
        sortBy={data.sort.sortBy}
        sortDir={data.sort.sortDir}
        buildSortHref={buildRecipeSortHref}
      />
    </div>

    <!-- Pagination -->
    <div class="px-4 pb-4">
      <RecipePagination
        page={data.pagination.page}
        totalPages={data.pagination.totalPages}
        total={data.pagination.total}
        search={data.filters.search}
        status={data.filters.status}
        sortBy={data.sort.sortBy}
        sortDir={data.sort.sortDir}
      />
    </div>
  </Card>
{/if}
