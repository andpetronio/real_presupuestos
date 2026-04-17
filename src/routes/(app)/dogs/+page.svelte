<script lang="ts">
  import { Button, Card } from 'flowbite-svelte';
  import FeedbackBanner from '$lib/components/FeedbackBanner.svelte';
  import DogFilterBar from '$lib/components/dogs/DogFilterBar.svelte';
  import DogTable from '$lib/components/dogs/DogTable.svelte';
  import DogPagination from '$lib/components/dogs/DogPagination.svelte';
  import DogMobileCards from '$lib/components/dogs/DogMobileCards.svelte';

  type DogRow = {
    id: string;
    name: string;
    diet_type: 'mixta' | 'cocida' | 'barf';
    meals_per_day: number;
    is_active: boolean;
    tutor: { full_name: string } | null;
    veterinary: { name: string } | null;
  };

  type PageData = {
    dogs: ReadonlyArray<DogRow>;
    tableState: 'idle' | 'success' | 'error' | 'empty';
    tableMessage: { title: string; detail: string } | null;
    pagination: { page: number; totalPages: number; total: number };
    filters: {
      search: string;
      status: string;
    };
  };

  type ActionData = {
    actionType?: 'delete';
    operatorError?: string;
    operatorSuccess?: string;
  };

  let { data, form }: { data: PageData; form: ActionData | null } = $props();

  const newDogPath = '/dogs/new';
  const feedbackMessage = $derived(form?.operatorError ?? form?.operatorSuccess ?? '');
  const feedbackColor = $derived(form?.operatorError ? 'red' : 'green');
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
      />
    </div>

    <!-- Mobile cards (hidden on md+) -->
    <div class="px-4 pb-4">
      <DogMobileCards dogs={data.dogs} />
    </div>

    <!-- Desktop table (hidden on < md) -->
    <div class="hidden md:block">
      <DogTable dogs={data.dogs} />
    </div>

    <!-- Pagination -->
    <div class="px-4 pb-4">
      <DogPagination
        page={data.pagination.page}
        totalPages={data.pagination.totalPages}
        total={data.pagination.total}
        search={data.filters.search}
        status={data.filters.status}
      />
    </div>
  </Card>
{/if}
