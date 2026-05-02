<script lang="ts">
  import { Card } from 'flowbite-svelte';
  import FeedbackBanner from '$lib/components/FeedbackBanner.svelte';
  import WholesaleOrderFilterBar from '$lib/components/wholesale-orders/WholesaleOrderFilterBar.svelte';
  import WholesaleOrderMobileCards from '$lib/components/wholesale-orders/WholesaleOrderMobileCards.svelte';
  import WholesaleOrderPagination from '$lib/components/wholesale-orders/WholesaleOrderPagination.svelte';
  import WholesaleOrderTable from '$lib/components/wholesale-orders/WholesaleOrderTable.svelte';
  import { buildSortHref } from '$lib/shared/sort-links';
  import type {
    WholesaleOrderListRow,
    WholesaleOrdersPageDataViewModel,
  } from '$lib/types/view-models/wholesale-orders';

  type FormState = {
    operatorError?: string;
    operatorSuccess?: string;
  };

  type PageData = WholesaleOrdersPageDataViewModel & {
    orders: ReadonlyArray<WholesaleOrderListRow>;
  };

  let { data, form }: { data: PageData; form: FormState | null } = $props();

  const buildOrderSortHref = (
    field: 'wholesaler' | 'placed_at' | 'expected_delivery_at' | 'status' | 'total_units' | 'total_ars',
  ): string =>
    buildSortHref({
      basePath: '/mayorista-orders',
      currentSortBy: data.sort.sortBy,
      currentSortDir: data.sort.sortDir,
      clickedField: field,
      filters: {
        q: data.filters.search,
        status: data.filters.status
      }
    });
</script>

<div class="space-y-4">
  <div>
    <p class="text-sm text-gray-600">
      Seguimiento operativo de pedidos, entregas y cobros del marketplace.
    </p>
  </div>

  {#if form?.operatorSuccess}
    <FeedbackBanner message={form.operatorSuccess} color="green" />
  {/if}
  {#if form?.operatorError}
    <FeedbackBanner message={form.operatorError} color="red" />
  {/if}

  {#if data.tableState === 'error'}
    <FeedbackBanner
      message={data.tableMessage?.detail ?? 'No pudimos cargar pedidos mayoristas.'}
      color="red"
    />
  {:else if data.tableState === 'empty'}
    <FeedbackBanner
      message={data.tableMessage?.detail ?? 'Todavía no hay pedidos mayoristas.'}
      color="blue"
    />
  {/if}

  <Card size="xl" class="w-full p-0 shadow-sm">
    <div class="p-4">
      <WholesaleOrderFilterBar
        currentSearch={data.filters.search}
        currentStatus={data.filters.status}
        currentSortBy={data.sort.sortBy}
        currentSortDir={data.sort.sortDir}
      />
    </div>

    {#if data.tableState === 'success'}
      <div class="px-4 pb-4">
        <WholesaleOrderMobileCards orders={data.orders} />
      </div>

      <div class="hidden md:block">
        <WholesaleOrderTable
          orders={data.orders}
          sortBy={data.sort.sortBy}
          sortDir={data.sort.sortDir}
          buildSortHref={buildOrderSortHref}
        />
      </div>

      <div class="px-4 pb-4">
        <WholesaleOrderPagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          total={data.pagination.total}
          search={data.filters.search}
          status={data.filters.status}
          sortBy={data.sort.sortBy}
          sortDir={data.sort.sortDir}
        />
      </div>
    {/if}
  </Card>
</div>
