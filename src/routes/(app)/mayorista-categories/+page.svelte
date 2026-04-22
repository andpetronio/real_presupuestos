<script lang='ts'>
  import { Button, Card } from 'flowbite-svelte';
  import FeedbackBanner from '$lib/components/FeedbackBanner.svelte';
  import WholesalerCategoryFilterBar from '$lib/components/wholesaler-categories/WholesalerCategoryFilterBar.svelte';
  import WholesalerCategoryMobileCards from '$lib/components/wholesaler-categories/WholesalerCategoryMobileCards.svelte';
  import WholesalerCategoryPagination from '$lib/components/wholesaler-categories/WholesalerCategoryPagination.svelte';
  import WholesalerCategoryTable from '$lib/components/wholesaler-categories/WholesalerCategoryTable.svelte';
  import { buildSortHref } from '$lib/shared/sort-links';
  import type {
    WholesalerCategoriesPageDataViewModel,
    WholesalerCategoryFormState,
  } from '$lib/types/view-models/wholesaler-categories';

  let { data, form }: { data: WholesalerCategoriesPageDataViewModel; form: WholesalerCategoryFormState | null } = $props();

  const feedbackMessage = $derived(form?.operatorError ?? form?.operatorSuccess ?? '');
  const feedbackColor = $derived(form?.operatorError ? 'red' : 'green');

  const buildCategorySortHref = (field: 'name' | 'is_active' | 'created_at'): string =>
    buildSortHref({
      basePath: '/mayorista-categories',
      currentSortBy: data.sort.sortBy,
      currentSortDir: data.sort.sortDir,
      clickedField: field,
      filters: {
        q: data.filters.search,
        status: data.filters.status
      }
    });
</script>

<div class='mb-4 flex justify-end'>
  <Button href='/mayorista-categories/new' color='blue'>Nueva categoría</Button>
</div>

{#if feedbackMessage}
  <FeedbackBanner message={feedbackMessage} color={feedbackColor} />
{/if}

{#if data.tableState === 'error'}
  <FeedbackBanner message={data.tableMessage?.detail ?? 'No pudimos cargar categorías mayoristas.'} color='red' />
{:else if data.tableState === 'empty'}
  <FeedbackBanner message={data.tableMessage?.detail ?? 'Todavía no hay categorías mayoristas.'} color='blue' />
{:else}
  <Card size='xl' class='w-full p-0 shadow-sm'>
    <div class='p-4'>
      <WholesalerCategoryFilterBar
        currentSearch={data.filters.search}
        currentStatus={data.filters.status}
        currentSortBy={data.sort.sortBy}
        currentSortDir={data.sort.sortDir}
      />
    </div>

    <div class='px-4 pb-4'>
      <WholesalerCategoryMobileCards categories={data.categories} />
    </div>

    <div class='hidden md:block'>
      <WholesalerCategoryTable
        categories={data.categories}
        sortBy={data.sort.sortBy}
        sortDir={data.sort.sortDir}
        buildSortHref={buildCategorySortHref}
      />
    </div>

    <div class='px-4 pb-4'>
      <WholesalerCategoryPagination
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
