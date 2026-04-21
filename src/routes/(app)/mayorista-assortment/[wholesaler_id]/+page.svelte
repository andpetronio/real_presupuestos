<script lang="ts">
  import { Button, Card } from 'flowbite-svelte';
  import FeedbackBanner from '$lib/components/FeedbackBanner.svelte';
  import AssortmentFilterBar from '$lib/components/wholesale-assortment/AssortmentFilterBar.svelte';
  import AssortmentProductTable from '$lib/components/wholesale-assortment/AssortmentProductTable.svelte';
  import type { AssortmentProductRow } from '$lib/types/view-models/wholesale-assortment';

  type PageData = {
    wholesaler: {
      id: string;
      name: string;
      unique_random_code: string;
      min_total_units: number;
      is_active: boolean;
    };
    products: ReadonlyArray<AssortmentProductRow>;
    filters: { search: string; status: string; availability: string };
    tableState: 'success' | 'empty' | 'error';
    tableMessage: { title: string; detail: string } | null;
  };

  type FormState = {
    operatorError?: string;
    operatorSuccess?: string;
  };

  let { data, form }: { data: PageData; form: FormState | null } = $props();
</script>

<div class="space-y-4">
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div>
      <h1 class="text-2xl font-semibold text-gray-900">Gestionar surtido</h1>
      <p class="text-sm text-gray-600">
        Definí qué productos puede ver y comprar {data.wholesaler.name} en el portal.
      </p>
    </div>
    <Button href="/mayorista-assortment" color="light">Volver al listado</Button>
  </div>

  {#if form?.operatorSuccess}
    <FeedbackBanner message={form.operatorSuccess} color="green" />
  {/if}
  {#if form?.operatorError}
    <FeedbackBanner message={form.operatorError} color="red" />
  {/if}

  <Card size="xl" class="w-full p-4 shadow-sm">
    <div class="grid gap-3 md:grid-cols-4">
      <div>
        <p class="text-xs uppercase tracking-wide text-gray-500">Mayorista</p>
        <p class="font-semibold text-gray-900">{data.wholesaler.name}</p>
      </div>
      <div>
        <p class="text-xs uppercase tracking-wide text-gray-500">Código</p>
        <p class="font-mono text-sm text-gray-900">{data.wholesaler.unique_random_code}</p>
      </div>
      <div>
        <p class="text-xs uppercase tracking-wide text-gray-500">Mínimo</p>
        <p class="font-medium text-gray-900">{data.wholesaler.min_total_units} unidades</p>
      </div>
      <div>
        <p class="text-xs uppercase tracking-wide text-gray-500">Estado</p>
        <p class="font-medium {data.wholesaler.is_active ? 'text-green-700' : 'text-gray-600'}">
          {data.wholesaler.is_active ? 'Activo' : 'Inactivo'}
        </p>
      </div>
    </div>
  </Card>

  <Card size="xl" class="w-full p-0 shadow-sm">
    <div class="p-4">
      <AssortmentFilterBar
        currentSearch={data.filters.search}
        currentStatus={data.filters.status}
        currentAvailability={data.filters.availability}
      />
    </div>

    {#if data.tableState === 'error'}
      <div class="px-4 pb-4">
        <FeedbackBanner
          message={data.tableMessage?.detail ?? 'No pudimos cargar los productos del surtido.'}
          color="red"
        />
      </div>
    {:else if data.tableState === 'empty'}
      <div class="px-4 pb-4">
        <FeedbackBanner
          message={data.tableMessage?.detail ?? 'No encontramos productos para este surtido.'}
          color="blue"
        />
      </div>
    {:else}
      <div class="space-y-3 px-4 pb-4 md:hidden">
        {#each data.products as product (product.id)}
          <Card class="p-4 shadow-none" role="listitem">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-semibold text-gray-900">{product.name}</p>
                <p class="text-sm text-gray-500">{product.presentation}</p>
              </div>
              <span
                class={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${product.is_enabled ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
              >
                {product.is_enabled ? 'Habilitado' : 'No habilitado'}
              </span>
            </div>

            <div class="mt-3 flex items-center gap-2 text-sm">
              <span
                class={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
              >
                {product.is_active ? 'Producto activo' : 'Producto inactivo'}
              </span>
            </div>

            <div class="mt-3">
              <form method="POST" action="?/toggleProduct">
                <input type="hidden" name="wholesalerId" value={data.wholesaler.id} />
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="enabled" value={product.is_enabled ? 'false' : 'true'} />
                <Button type="submit" size="sm" color={product.is_enabled ? 'red' : 'green'}>
                  {product.is_enabled ? 'Deshabilitar' : 'Habilitar'}
                </Button>
              </form>
            </div>
          </Card>
        {/each}
      </div>

      <div class="hidden md:block">
        <AssortmentProductTable wholesalerId={data.wholesaler.id} products={data.products} />
      </div>
    {/if}
  </Card>
</div>
