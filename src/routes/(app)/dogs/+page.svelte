<script lang="ts">
  import { Button, Card } from 'flowbite-svelte';
  import FeedbackBanner from '$lib/components/FeedbackBanner.svelte';
  import DogFilterBar from '$lib/components/dogs/DogFilterBar.svelte';
  import DogTable from '$lib/components/dogs/DogTable.svelte';
  import DogPagination from '$lib/components/dogs/DogPagination.svelte';
  import DogMobileCards from '$lib/components/dogs/DogMobileCards.svelte';
  import { buildSortHref } from '$lib/shared/sort-links';
  import type {
    DogsActionDataViewModel as ActionData,
    DogsPageDataViewModel as PageData
  } from '$lib/types/view-models/dogs';

  let { data, form }: { data: PageData; form: ActionData | null } = $props();

  const newDogPath = '/dogs/new';
  const feedbackMessage = $derived(form?.operatorError ?? form?.operatorSuccess ?? '');
  const feedbackColor = $derived(form?.operatorError ? 'red' : 'green');

  const buildDogSortHref = (field: 'name' | 'diet_type' | 'meals_per_day' | 'is_active'): string =>
    buildSortHref({
      basePath: '/dogs',
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
  <Button href={newDogPath} color="blue">Nuevo perro</Button>
</div>

{#if feedbackMessage}
  <FeedbackBanner message={feedbackMessage} color={feedbackColor} />
{/if}

{#if data.tableState === 'error'}
  <FeedbackBanner message={data.tableMessage?.detail ?? 'No pudimos cargar perros.'} color="red" />
{:else if data.tableState === 'empty'}
  <FeedbackBanner message={data.tableMessage?.detail ?? 'Todavía no hay perros.'} color="blue" />
{:else}
  <Card size="xl" class="w-full shadow-sm p-0">
    <!-- Filter bar -->
    <div class="p-4">
      <DogFilterBar
        currentSearch={data.filters.search}
        currentStatus={data.filters.status}
        currentSortBy={data.sort.sortBy}
        currentSortDir={data.sort.sortDir}
      />
    </div>

    <!-- Mobile cards (hidden on md+) -->
    <div class="px-4 pb-4">
      <DogMobileCards dogs={data.dogs} />
    </div>

    <!-- Desktop table (hidden on < md) -->
    <div class="hidden md:block">
      <DogTable
        dogs={data.dogs}
        sortBy={data.sort.sortBy}
        sortDir={data.sort.sortDir}
        buildSortHref={buildDogSortHref}
      />
    </div>

    <!-- Pagination -->
    <div class="px-4 pb-4">
      <DogPagination
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
