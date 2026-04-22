<script lang="ts">
  import { Button, Card } from 'flowbite-svelte';
  import FeedbackBanner from '$lib/components/FeedbackBanner.svelte';
  import WholesaleProductFilterBar from '$lib/components/wholesale-products/WholesaleProductFilterBar.svelte';
  import WholesaleProductTable from '$lib/components/wholesale-products/WholesaleProductTable.svelte';
  import WholesaleProductMobileCards from '$lib/components/wholesale-products/WholesaleProductMobileCards.svelte';
  import WholesaleProductPagination from '$lib/components/wholesale-products/WholesaleProductPagination.svelte';
  import { buildSortHref } from '$lib/shared/sort-links';
  import type { WholesaleProductFormState, WholesaleProductsPageDataViewModel } from '$lib/types/view-models/wholesale-products';

  let { data, form }: { data: WholesaleProductsPageDataViewModel; form: WholesaleProductFormState | null } = $props();
  const newProductPath = '/mayorista-products/new';
  const feedbackMessage = $derived(form?.operatorError ?? form?.operatorSuccess ?? '');
  const feedbackColor = $derived(form?.operatorError ? 'red' : 'green');

  const buildProductSortHref = (
    field: 'name' | 'presentation' | 'price_ars' | 'is_active' | 'created_at',
  ): string =>
    buildSortHref({
      basePath: '/mayorista-products',
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
  <Button href={newProductPath} color="blue">Nuevo producto</Button>
</div>

{#if feedbackMessage}
  <FeedbackBanner message={feedbackMessage} color={feedbackColor} />
{/if}

{#if data.tableState === 'error'}
  <FeedbackBanner message={data.tableMessage?.detail ?? 'No pudimos cargar productos mayoristas.'} color="red" />
{:else if data.tableState === 'empty'}
  <FeedbackBanner message={data.tableMessage?.detail ?? 'Todavía no hay productos mayoristas.'} color="blue" />
{:else}
  <Card size="xl" class="w-full shadow-sm p-0">
    <div class="p-4">
      <WholesaleProductFilterBar
        currentSearch={data.filters.search}
        currentStatus={data.filters.status}
        currentSortBy={data.sort.sortBy}
        currentSortDir={data.sort.sortDir}
      />
    </div>

    <div class="px-4 pb-4">
      <WholesaleProductMobileCards products={data.products} />
    </div>

    <div class="hidden md:block">
      <WholesaleProductTable
        products={data.products}
        sortBy={data.sort.sortBy}
        sortDir={data.sort.sortDir}
        buildSortHref={buildProductSortHref}
      />
    </div>

    <div class="px-4 pb-4">
      <WholesaleProductPagination
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
