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

  const feedbackMessage = $derived(form?.operatorError ?? form?.operatorSuccess ?? '');
  const feedbackColor = $derived(form?.operatorError ? 'red' : 'green');
</script>

<div class="mb-4 flex justify-end">
  <Button href={newBudgetPath} color="secondary">Nuevo presupuesto</Button>
</div>

{#if feedbackMessage}
  <FeedbackBanner message={feedbackMessage} color={feedbackColor} />
{/if}

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
      />
    </div>
  </Card>
{/if}
