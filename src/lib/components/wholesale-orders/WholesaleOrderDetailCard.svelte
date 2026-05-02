<script lang="ts">
  import { Badge, Button, Card, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
  import { formatArs } from '$lib/shared/currency';
  import type { WholesaleOrderDetailView } from '$lib/types/view-models/wholesale-orders';

  type Props = {
    order: WholesaleOrderDetailView;
  };

  let { order }: Props = $props();

  const badgeColor = (status: string) =>
    status === 'received' ? 'yellow' : status === 'in_preparation' ? 'blue' : status === 'ready' ? 'purple' : status === 'delivered' ? 'teal' : 'green';
  const paymentMethodLabels: Record<string, string> = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    mercadopago: 'MercadoPago',
    other: 'Otro'
  };
  const formatDateTime = (value: string | null | undefined) => value ? new Date(value).toLocaleDateString('es-AR') : '—';
</script>

<Card size="xl" class="w-full shadow-sm p-4">
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div>
      <p class="text-xs uppercase tracking-wide text-gray-500">Pedido</p>
      <h2 class="text-xl font-semibold text-gray-900">#{order.id.slice(0, 8)} · {order.wholesalerName}</h2>
      <p class="text-sm text-gray-600">Creado el {formatDateTime(order.placed_at)}</p>
    </div>
    <div class="space-y-2 text-right">
      <Badge color={badgeColor(order.status)}>{order.statusLabel}</Badge>
      <p class="text-sm text-gray-600">{order.total_units} unidades</p>
      <p class="text-lg font-bold text-primary-700">{formatArs(Number(order.total_ars ?? 0))}</p>
    </div>
  </div>

  <div class="mt-4 grid gap-3 md:grid-cols-5">
    <div class="rounded-lg border border-gray-200 p-3">
      <p class="text-xs text-gray-500">Pedido generado</p>
      <p class="font-medium">{formatDateTime(order.placed_at)}</p>
    </div>
    <div class="rounded-lg border border-gray-200 p-3">
      <p class="text-xs text-gray-500">Entrega estimada</p>
      <p class="font-medium">{formatDateTime(order.expected_delivery_at)}</p>
    </div>
    <div class="rounded-lg border border-gray-200 p-3">
      <p class="text-xs text-gray-500">Listo</p>
      <p class="font-medium">{formatDateTime(order.ready_at)}</p>
    </div>
    <div class="rounded-lg border border-gray-200 p-3">
      <p class="text-xs text-gray-500">Entregado</p>
      <p class="font-medium">{formatDateTime(order.delivered_at)}</p>
    </div>
    <div class="rounded-lg border border-gray-200 p-3">
      <p class="text-xs text-gray-500">Cobrado</p>
      <p class="font-medium">{formatDateTime(order.paid_at)}</p>
    </div>
  </div>

  <div class="mt-3 rounded-lg border border-gray-200 p-3">
    <p class="text-xs text-gray-500">Estado de entrega</p>
    <p class="font-medium">{order.isOverdue ? `Demorado ${Math.abs(order.daysToDelivery)} día(s)` : `Restan ${Math.max(order.daysToDelivery, 0)} día(s)`}</p>
  </div>

  {#if order.payment_method}
    <div class="mt-3 rounded-lg border border-gray-200 p-3">
      <p class="text-xs text-gray-500">Método de pago</p>
      <p class="font-medium">{paymentMethodLabels[order.payment_method] ?? order.payment_method}</p>
    </div>
  {/if}

  {#if order.notes}
    <div class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p class="text-xs uppercase tracking-wide text-gray-500">Notas</p>
      <p class="mt-1 text-sm text-gray-700">{order.notes}</p>
    </div>
  {/if}

  <div class="mt-4 overflow-x-auto">
    <Table>
      <TableHead>
        <TableHeadCell>Producto</TableHeadCell>
        <TableHeadCell>Cantidad</TableHeadCell>
        <TableHeadCell>Preparado</TableHeadCell>
        <TableHeadCell>Unitario</TableHeadCell>
        <TableHeadCell>Subtotal</TableHeadCell>
      </TableHead>
      <TableBody>
        {#each order.items as item (item.id)}
          <TableBodyRow>
            <TableBodyCell>
              <p class="font-medium">{item.product_name_snapshot}</p>
              <p class="text-xs text-gray-500">{item.presentation_snapshot}</p>
            </TableBodyCell>
            <TableBodyCell>{item.quantity}</TableBodyCell>
            <TableBodyCell>{item.prepared_quantity}</TableBodyCell>
            <TableBodyCell>{formatArs(Number(item.unit_price_ars_snapshot ?? 0))}</TableBodyCell>
            <TableBodyCell>{formatArs(Number(item.line_total_ars_snapshot ?? 0))}</TableBodyCell>
          </TableBodyRow>
        {/each}
      </TableBody>
    </Table>
  </div>
</Card>
