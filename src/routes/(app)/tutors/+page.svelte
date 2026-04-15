<script lang="ts">
  import { Button, Card } from 'flowbite-svelte';
  import FeedbackBanner from '$lib/components/FeedbackBanner.svelte';
  import TutorFilterBar from '$lib/components/tutors/TutorFilterBar.svelte';
  import TutorTable from '$lib/components/tutors/TutorTable.svelte';
  import TutorPagination from '$lib/components/tutors/TutorPagination.svelte';
  import TutorMobileCards from '$lib/components/tutors/TutorMobileCards.svelte';

  type TutorRow = {
    id: string;
    full_name: string;
    whatsapp_number: string;
    notes: string | null;
    created_at: string;
  };

  type PageData = {
    tutors: ReadonlyArray<TutorRow>;
    tableState: 'idle' | 'success' | 'error' | 'empty';
    tableMessage: { title: string; detail: string } | null;
    pagination: { page: number; totalPages: number; total: number };
    filters: {
      search: string;
    };
  };

  let { data }: { data: PageData } = $props();

  const newTutorPath = '/tutors/new';
</script>

<div class="mb-4 flex justify-end">
  <Button href={newTutorPath} color="blue">Nuevo tutor</Button>
</div>

{#if data.tableState === 'error'}
  <FeedbackBanner message={data.tableMessage?.detail ?? 'No pudimos cargar tutores.'} color="red" />
{:else if data.tableState === 'empty'}
  <FeedbackBanner message={data.tableMessage?.detail ?? 'Todavía no hay tutores.'} color="blue" />
{:else}
  <Card size="xl" class="w-full shadow-sm p-0">
    <!-- Filter bar -->
    <div class="p-4">
      <TutorFilterBar
        currentSearch={data.filters.search}
      />
    </div>

    <!-- Mobile cards (hidden on md+) -->
    <div class="px-4 pb-4">
      <TutorMobileCards tutors={data.tutors} />
    </div>

    <!-- Desktop table (hidden on < md) -->
    <div class="hidden md:block">
      <TutorTable tutors={data.tutors} />
    </div>

    <!-- Pagination -->
    <div class="px-4 pb-4">
      <TutorPagination
        page={data.pagination.page}
        totalPages={data.pagination.totalPages}
        total={data.pagination.total}
        search={data.filters.search}
      />
    </div>
  </Card>
{/if}