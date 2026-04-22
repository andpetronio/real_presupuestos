<script lang="ts">
  import {
    Button,
    Card
  } from 'flowbite-svelte';
  import FeedbackBanner from '$lib/components/FeedbackBanner.svelte';
  import BudgetFilterBar from '$lib/components/budgets/BudgetFilterBar.svelte';
  import BudgetTable from '$lib/components/budgets/BudgetTable.svelte';
  import BudgetPagination from '$lib/components/budgets/BudgetPagination.svelte';
  import BudgetMobileCards from '$lib/components/budgets/BudgetMobileCards.svelte';
  import { buildSortHref } from '$lib/shared/sort-links';
  import type {
    BudgetsActionDataViewModel as ActionData,
    BudgetsPageDataViewModel as PageData
  } from '$lib/types/view-models/budgets';

  let { data, form }: { data: PageData; form: ActionData | null } = $props();

  const newBudgetPath = '/budgets/new';

  const formatDate = (value: string | null): string => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-AR');
  };

  const buildBudgetSortHref = (
    field: 'tutor' | 'status' | 'total_cost' | 'final_sale_price' | 'expires_at',
  ): string =>
    buildSortHref({
      basePath: '/budgets',
      currentSortBy: data.sort.sortBy,
      currentSortDir: data.sort.sortDir,
      clickedField: field,
      filters: {
        status: data.filters.status,
        q: data.filters.search,
        tutor: data.filters.tutorId
      }
    });

</script>

<div class="mb-4 flex justify-end">
  <Button href={newBudgetPath} color="secondary">Nuevo presupuesto</Button>
</div>

{#if data.tableState === 'error'}
  <FeedbackBanner message={data.tableMessage?.detail ?? 'No pudimos cargar presupuestos.'} color="red" />
{:else if data.tableState === 'empty'}
  <FeedbackBanner message={data.tableMessage?.detail ?? 'Todavía no hay presupuestos.'} color="blue" />
{:else}
  <Card size="xl" class="w-full shadow-sm p-0">
    <!-- Filter bar -->
    <div class="p-4">
      <BudgetFilterBar
        currentStatus={data.filters.status}
        currentSearch={data.filters.search}
        tutors={data.tutors}
        currentTutorId={data.filters.tutorId}
        currentSortBy={data.sort.sortBy}
        currentSortDir={data.sort.sortDir}
      />
    </div>

    <!-- Mobile cards (hidden on md+) -->
    <div class="px-4 pb-4">
      <BudgetMobileCards
        budgets={data.budgets}
        {formatDate}
      />
    </div>

    <!-- Desktop table (hidden on < md) -->
    <div class="hidden md:block">
      <BudgetTable
        budgets={data.budgets}
        {formatDate}
        sortBy={data.sort.sortBy}
        sortDir={data.sort.sortDir}
        buildSortHref={buildBudgetSortHref}
      />
    </div>

    <!-- Pagination -->
    <div class="px-4 pb-4">
      <BudgetPagination
        page={data.pagination.page}
        totalPages={data.pagination.totalPages}
        total={data.pagination.total}
        status={data.filters.status}
        search={data.filters.search}
        tutorId={data.filters.tutorId}
        sortBy={data.sort.sortBy}
        sortDir={data.sort.sortDir}
      />
    </div>
  </Card>
{/if}
