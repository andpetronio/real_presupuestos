<script lang="ts">
  import { SvelteURLSearchParams } from 'svelte/reactivity';
  import { Button, Card } from 'flowbite-svelte';
  import FeedbackBanner from '$lib/components/FeedbackBanner.svelte';
  import GenericFilterBar from '$lib/components/admin/GenericFilterBar.svelte';
  import ActiveStatusBadge from '$lib/components/admin/ActiveStatusBadge.svelte';
  import AssortmentWholesalerTable from '$lib/components/wholesale-assortment/AssortmentWholesalerTable.svelte';
  import type { AssortmentWholesalerRow } from '$lib/types/view-models/wholesale-assortment';

  type PageData = {
    wholesalers: ReadonlyArray<AssortmentWholesalerRow>;
    tableState: 'success' | 'empty' | 'error';
    tableMessage: { title: string; detail: string } | null;
    pagination: { page: number; totalPages: number; total: number };
    filters: { search: string; status: string };
  };

  let { data }: { data: PageData } = $props();

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
  ];

  const buildPaginationHref = (page: number) => {
    const params = new SvelteURLSearchParams();
    if (data.filters.search) params.set('q', data.filters.search);
    if (data.filters.status && data.filters.status !== 'all') {
      params.set('status', data.filters.status);
    }
    params.set('page', String(page));
    return `/mayorista-assortment?${params.toString()}`;
  };
</script>

<div class="space-y-4">
  <div class="flex items-start justify-between gap-3">
    <div>
      <p class="text-sm text-gray-600">
        Elegí un mayorista y gestioná qué productos puede comprar en el portal.
      </p>
    </div>
    <Button href="/admin-mayoristas" color="light">Ver mayoristas</Button>
  </div>

  {#if data.tableState === 'error'}
    <FeedbackBanner
      message={data.tableMessage?.detail ?? 'No pudimos cargar el surtido mayorista.'}
      color="red"
    />
  {:else if data.tableState === 'empty'}
    <FeedbackBanner
      message={data.tableMessage?.detail ?? 'Todavía no hay mayoristas para gestionar.'}
      color="blue"
    />
  {/if}

  <Card size="xl" class="w-full p-0 shadow-sm">
    <div class="p-4">
      <GenericFilterBar
        searchPlaceholder="Buscar mayorista o código..."
        currentSearch={data.filters.search}
        filterLabel="Estado"
        filterName="status"
        filterOptions={statusOptions}
        currentFilter={data.filters.status}
        showSubmitButton={true}
      />
    </div>

    {#if data.tableState === 'success'}
      <div class="space-y-3 px-4 pb-4 md:hidden">
        {#each data.wholesalers as wholesaler (wholesaler.id)}
          <Card class="p-4 shadow-none" role="listitem">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-semibold text-gray-900">{wholesaler.name}</p>
                <p class="font-mono text-xs text-gray-500">{wholesaler.unique_random_code}</p>
              </div>
              <ActiveStatusBadge isActive={wholesaler.is_active} />
            </div>

            <div class="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p class="text-xs text-gray-500">Mínimo</p>
                <p class="font-medium">{wholesaler.min_total_units} unidades</p>
              </div>
              <div>
                <p class="text-xs text-gray-500">Productos habilitados</p>
                <p class="font-medium">{wholesaler.enabledProductsCount}</p>
              </div>
            </div>

            <div class="mt-3">
              <Button href={`/mayorista-assortment/${wholesaler.id}`} size="sm" color="light">
                Gestionar productos
              </Button>
            </div>
          </Card>
        {/each}
      </div>

      <div class="hidden md:block">
        <AssortmentWholesalerTable wholesalers={data.wholesalers} />
      </div>

      {#if data.pagination.totalPages > 1}
        <div class="flex items-center justify-between px-4 pb-4 pt-2">
          <Button
            href={data.pagination.page > 1 ? buildPaginationHref(data.pagination.page - 1) : undefined}
            size="sm"
            color="light"
            disabled={data.pagination.page <= 1}
          >
            Anterior
          </Button>

          <p class="text-sm text-gray-600">
            Página <strong>{data.pagination.page}</strong> de
            <strong>{data.pagination.totalPages}</strong>
            · {data.pagination.total} mayorista{data.pagination.total === 1 ? '' : 's'}
          </p>

          <Button
            href={
              data.pagination.page < data.pagination.totalPages
                ? buildPaginationHref(data.pagination.page + 1)
                : undefined
            }
            size="sm"
            color="light"
            disabled={data.pagination.page >= data.pagination.totalPages}
          >
            Siguiente
          </Button>
        </div>
      {/if}
    {/if}
  </Card>
</div>
