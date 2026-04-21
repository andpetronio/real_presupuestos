<script lang="ts">
  import { Button, Card, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
  import MetricCard from '$lib/components/admin/MetricCard.svelte';
  import { formatArs } from '$lib/shared/currency';

  type PageData = {
    metrics: {
      pendingCount: number;
      deliveredUnpaidCount: number;
      paidCount: number;
      totalArs: number;
      totalUnits: number;
    };
    topWholesalers: Array<{ wholesaler_name: string; total_ars: number; total_units: number }>;
    topProducts: Array<{ product_name: string; total_ars: number; total_units: number }>;
  };

  let { data }: { data: PageData } = $props();
</script>

<div class="space-y-4">
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div>
      <p class="text-sm text-gray-600">
        Vista ejecutiva del marketplace mayorista con foco en operación y facturación.
      </p>
    </div>
    <div class="flex flex-wrap gap-2">
      <Button href="/mayorista-orders" color="light">Ver pedidos</Button>
      <Button href="/admin-mayoristas" color="light">Ver mayoristas</Button>
      <Button href="/mayorista-products" color="light">Ver productos</Button>
    </div>
  </div>

  <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
    <MetricCard label="Pendientes" value={data.metrics.pendingCount} colorVariant="default" />
    <MetricCard
      label="Entregados sin cobrar"
      value={data.metrics.deliveredUnpaidCount}
      colorVariant="secondary"
    />
    <MetricCard label="Cobrados" value={data.metrics.paidCount} colorVariant="accent" />
    <MetricCard label="Total unidades" value={data.metrics.totalUnits} colorVariant="default" />
    <MetricCard
      label="Total ARS"
      value={formatArs(Number(data.metrics.totalArs ?? 0))}
      colorVariant="primary"
    />
  </section>

  <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
    <Card size="xl" class="w-full p-4 shadow-sm">
      <div class="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Top mayoristas</h2>
          <p class="text-sm text-gray-600">Ranking por facturación acumulada.</p>
        </div>
        <Button href="/admin-mayoristas" color="light" size="sm">Administrar</Button>
      </div>

      <div class="overflow-x-auto">
        <Table>
          <TableHead>
            <TableHeadCell>Mayorista</TableHeadCell>
            <TableHeadCell>Unidades</TableHeadCell>
            <TableHeadCell>Total ARS</TableHeadCell>
          </TableHead>
          <TableBody>
            {#each data.topWholesalers as row (`w-${row.wholesaler_name}`)}
              <TableBodyRow>
                <TableBodyCell>{row.wholesaler_name}</TableBodyCell>
                <TableBodyCell>{row.total_units}</TableBodyCell>
                <TableBodyCell>{formatArs(Number(row.total_ars ?? 0))}</TableBodyCell>
              </TableBodyRow>
            {/each}
          </TableBody>
        </Table>
      </div>
    </Card>

    <Card size="xl" class="w-full p-4 shadow-sm">
      <div class="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Top productos</h2>
          <p class="text-sm text-gray-600">Qué productos mueven más volumen y facturación.</p>
        </div>
        <Button href="/mayorista-products" color="light" size="sm">Administrar</Button>
      </div>

      <div class="overflow-x-auto">
        <Table>
          <TableHead>
            <TableHeadCell>Producto</TableHeadCell>
            <TableHeadCell>Unidades</TableHeadCell>
            <TableHeadCell>Total ARS</TableHeadCell>
          </TableHead>
          <TableBody>
            {#each data.topProducts as row (`p-${row.product_name}`)}
              <TableBodyRow>
                <TableBodyCell>{row.product_name}</TableBodyCell>
                <TableBodyCell>{row.total_units}</TableBodyCell>
                <TableBodyCell>{formatArs(Number(row.total_ars ?? 0))}</TableBodyCell>
              </TableBodyRow>
            {/each}
          </TableBody>
        </Table>
      </div>
    </Card>
  </div>
</div>
