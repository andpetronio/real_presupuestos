<script lang="ts">
  import { Button, Card } from 'flowbite-svelte';
  import FeedbackBanner from '$lib/components/FeedbackBanner.svelte';
  import RawMaterialFilterBar from '$lib/components/raw-materials/RawMaterialFilterBar.svelte';
  import RawMaterialTable from '$lib/components/raw-materials/RawMaterialTable.svelte';
  import RawMaterialPagination from '$lib/components/raw-materials/RawMaterialPagination.svelte';
  import RawMaterialMobileCards from '$lib/components/raw-materials/RawMaterialMobileCards.svelte';

  const formatQuantity = (value: number): string => {
    return new Intl.NumberFormat('es-AR').format(value);
  };

  type RawMaterialRow = {
    id: string;
    name: string;
    base_unit: string;
    purchase_quantity: number;
    base_cost: number;
    wastage_percentage: number;
    cost_with_wastage: number;
    is_active: boolean;
  };

  type PageData = {
    rawMaterials: ReadonlyArray<RawMaterialRow>;
    tableState: 'idle' | 'success' | 'error' | 'empty';
    tableMessage: { title: string; detail: string } | null;
    pagination: { page: number; totalPages: number; total: number };
    filters: {
      search: string;
      status: string;
    };
  };

  let { data }: { data: PageData } = $props();

  const newRawMaterialPath = '/raw-materials/new';
</script>

<div class="mb-4 flex justify-end">
  <Button href={newRawMaterialPath} color="blue">Nueva materia prima</Button>
</div>

{#if data.tableState === 'error'}
  <FeedbackBanner message={data.tableMessage?.detail ?? 'No pudimos cargar materias primas.'} color="red" />
{:else if data.tableState === 'empty'}
  <FeedbackBanner message={data.tableMessage?.detail ?? 'Todavía no hay materias primas.'} color="blue" />
{:else}
  <Card size="xl" class="w-full shadow-sm p-0">
    <!-- Filter bar -->
    <div class="p-4">
      <RawMaterialFilterBar
        currentSearch={data.filters.search}
        currentStatus={data.filters.status}
      />
    </div>

    <!-- Mobile cards (hidden on md+) -->
    <div class="px-4 pb-4">
      <RawMaterialMobileCards rawMaterials={data.rawMaterials} />
    </div>

    <!-- Desktop table (hidden on < md) -->
    <div class="hidden md:block">
      <RawMaterialTable rawMaterials={data.rawMaterials} />
    </div>

    <!-- Pagination -->
    <div class="px-4 pb-4">
      <RawMaterialPagination
        page={data.pagination.page}
        totalPages={data.pagination.totalPages}
        total={data.pagination.total}
        search={data.filters.search}
        status={data.filters.status}
      />
    </div>
  </Card>
{/if}