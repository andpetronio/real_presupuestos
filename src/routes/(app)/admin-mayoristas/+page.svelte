<script lang="ts">
  import { Button, Card } from 'flowbite-svelte';
  import FeedbackBanner from '$lib/components/FeedbackBanner.svelte';
  import WholesalerFilterBar from '$lib/components/wholesalers/WholesalerFilterBar.svelte';
  import WholesalerTable from '$lib/components/wholesalers/WholesalerTable.svelte';
  import WholesalerMobileCards from '$lib/components/wholesalers/WholesalerMobileCards.svelte';
  import WholesalerPagination from '$lib/components/wholesalers/WholesalerPagination.svelte';
  import type { WholesalerFormState, WholesalersPageDataViewModel } from '$lib/types/view-models/wholesalers';

  let { data, form }: { data: WholesalersPageDataViewModel; form: WholesalerFormState | null } = $props();

  const newWholesalerPath = '/admin-mayoristas/new';
  const feedbackMessage = $derived(form?.operatorError ?? form?.operatorSuccess ?? '');
  const feedbackColor = $derived(form?.operatorError ? 'red' : 'green');
</script>

<div class="mb-4 flex justify-end">
  <Button href={newWholesalerPath} color="blue">Nuevo mayorista</Button>
</div>

{#if feedbackMessage}
  <FeedbackBanner message={feedbackMessage} color={feedbackColor} />
{/if}

{#if data.tableState === 'error'}
  <FeedbackBanner message={data.tableMessage?.detail ?? 'No pudimos cargar mayoristas.'} color="red" />
{:else if data.tableState === 'empty'}
  <FeedbackBanner message={data.tableMessage?.detail ?? 'Todavía no hay mayoristas.'} color="blue" />
{:else}
  <Card size="xl" class="w-full shadow-sm p-0">
    <div class="p-4">
      <WholesalerFilterBar currentSearch={data.filters.search} currentStatus={data.filters.status} />
    </div>

    <div class="px-4 pb-4">
      <WholesalerMobileCards wholesalers={data.wholesalers} />
    </div>

    <div class="hidden md:block">
      <WholesalerTable wholesalers={data.wholesalers} />
    </div>

    <div class="px-4 pb-4">
      <WholesalerPagination
        page={data.pagination.page}
        totalPages={data.pagination.totalPages}
        total={data.pagination.total}
        search={data.filters.search}
        status={data.filters.status}
      />
    </div>
  </Card>
{/if}
