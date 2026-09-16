<script lang="ts">
  import { Button, Card, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
  import DataTable from '$lib/components/admin/DataTable.svelte';
  import { exportPurchasesXlsx } from '$lib/shared/purchases-export';

  type PurchaseRequirement = {
    rawMaterialId: string;
    rawMaterialName: string;
    baseUnit: string;
    netQuantity: number;
    wastagePercentage: number;
    yieldFactor: number;
    purchaseQuantity: number | null;
  };

  type PageData = {
    requirements: ReadonlyArray<PurchaseRequirement>;
    referenceMonth: string;
    pageState: 'success' | 'error';
    pageMessage: string | null;
  };

  let { data }: { data: PageData } = $props();
  let isExporting = $state(false);
  let exportError = $state<string | null>(null);

  const monthFormatter = new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric'
  });
  const quantityFormatter = new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 6
  });
  const purchaseQuantityFormatter = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const formatMonth = (value: string): string =>
    monthFormatter.format(new Date(`${value}-01T12:00:00`));

  const formatQuantity = (value: number | null): string =>
    value === null ? 'No calculable' : quantityFormatter.format(value);

  const formatPurchaseQuantity = (value: number | null): string =>
    value === null ? 'No calculable' : purchaseQuantityFormatter.format(value);

  const formatWastage = (value: number): string =>
    Number.isNaN(value) ? 'Variable' : `${formatQuantity(value)}%`;

  const formatYield = (value: number): string =>
    Number.isNaN(value) ? 'Variable' : `${formatQuantity(value)}×`;

  const handleExport = async (): Promise<void> => {
    exportError = null;
    isExporting = true;

    try {
      await exportPurchasesXlsx({
        monthLabel: `Consolidado de compras — ${formatMonth(data.referenceMonth)}`,
        monthValue: data.referenceMonth,
        requirements: data.requirements
      });
    } catch {
      exportError = 'No pudimos generar el archivo XLSX.';
    } finally {
      isExporting = false;
    }
  };
</script>

<div class="space-y-4">
  <div class="flex flex-wrap items-end justify-between gap-4">
    <div>
      <!-- <h1 class="text-2xl font-semibold text-gray-900">Compras</h1> -->
      <p class="mt-1 text-sm text-gray-600">
        Consolidado histórico de insumos para {formatMonth(data.referenceMonth)}.
      </p>
    </div>
    <div class="flex flex-wrap items-end gap-2">
      <form method="GET">
        <label class="block text-sm font-medium text-gray-700" for="purchase-month">Mes</label>
        <input
          id="purchase-month"
          name="month"
          type="month"
          value={data.referenceMonth}
          class="mt-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        />
        <Button class="mt-1" size="sm" type="submit" color="light">Ver mes</Button>
      </form>
      <Button
        color="light"
        disabled={data.pageState === 'error' || data.requirements.length === 0 || isExporting}
        onclick={handleExport}
      >
        {isExporting ? 'Exportando…' : 'Exportar XLSX'}
      </Button>
    </div>
  </div>

  {#if exportError}
    <Card class="border-red-200 bg-red-50 p-3 text-sm text-red-700">{exportError}</Card>
  {/if}

  {#if data.pageState === 'error'}
    <Card class="border-red-200 bg-red-50 p-4 text-red-700">
      {data.pageMessage ?? 'No pudimos cargar el consolidado de compras.'}
    </Card>
  {:else if data.requirements.length === 0}
    <Card class="p-6 text-sm text-gray-600">
      No hay presupuestos aceptados para el próximo mes con recetas asignadas.
    </Card>
  {:else}
    <Card size="xl" class="w-full p-0 shadow-sm">
      <div class="overflow-x-auto">
        <DataTable ariaLabel="Consolidado de compras">
          <TableHead>
            <TableHeadCell>Materia prima</TableHeadCell>
            <TableHeadCell>Unidad</TableHeadCell>
            <TableHeadCell>Cantidad neta</TableHeadCell>
            <TableHeadCell>Merma</TableHeadCell>
            <TableHeadCell>Rendimiento</TableHeadCell>
            <TableHeadCell>Cantidad a comprar</TableHeadCell>
          </TableHead>
          <TableBody>
            {#each data.requirements as requirement (requirement.rawMaterialId)}
              <TableBodyRow>
                <TableBodyCell>{requirement.rawMaterialName}</TableBodyCell>
                <TableBodyCell>{requirement.baseUnit}</TableBodyCell>
                <TableBodyCell>{formatQuantity(requirement.netQuantity)}</TableBodyCell>
                <TableBodyCell>{formatWastage(requirement.wastagePercentage)}</TableBodyCell>
                <TableBodyCell>{formatYield(requirement.yieldFactor)}</TableBodyCell>
                <TableBodyCell>{formatPurchaseQuantity(requirement.purchaseQuantity)}</TableBodyCell>
              </TableBodyRow>
            {/each}
          </TableBody>
        </DataTable>
      </div>
    </Card>
  {/if}
</div>
