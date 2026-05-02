<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Badge, Button, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
  import SortableHeader from '$lib/components/admin/SortableHeader.svelte';
  import { formatArs } from '$lib/shared/currency';
  import { route } from '$lib/shared/navigation';
  import { closeBlockingLoader, confirmAlert, presentActionFeedback, showBlockingLoader } from '$lib/shared/alerts';
  import type { WholesaleOrderListRow } from '$lib/types/view-models/wholesale-orders';

  type Props = {
    orders: ReadonlyArray<WholesaleOrderListRow>;
    sortBy: 'wholesaler' | 'placed_at' | 'expected_delivery_at' | 'status' | 'total_units' | 'total_ars';
    sortDir: 'asc' | 'desc';
    buildSortHref: (
      field: 'wholesaler' | 'placed_at' | 'expected_delivery_at' | 'status' | 'total_units' | 'total_ars',
    ) => string;
  };
  let { orders, sortBy, sortDir, buildSortHref }: Props = $props();

  const badgeColor = (status: string) =>
    status === 'received' ? 'yellow' : status === 'in_preparation' ? 'blue' : status === 'ready' ? 'purple' : status === 'delivered' ? 'teal' : 'green';
  const formatDate = (value: string) => new Date(value).toLocaleDateString('es-AR');

  const enhanceStatusAction = (params: { title: string; text: string; confirmButtonText: string }) => {
    return async ({ cancel }: { cancel: () => void }) => {
      const confirmed = await confirmAlert(params);
      if (!confirmed) {
        cancel();
        return;
      }
      void showBlockingLoader();
      return async ({ result }: { result: import('@sveltejs/kit').ActionResult }) => {
        await closeBlockingLoader();
        await applyAction(result);
        await presentActionFeedback(result);
        if (result.type === 'success') {
          await invalidateAll();
        }
      };
    };
  };
</script>

<Table hoverable striped aria-label="Tabla de pedidos mayoristas" class="text-center">
  <TableHead>
    <TableHeadCell>Pedido</TableHeadCell>
    <TableHeadCell>
      <SortableHeader
        label="Mayorista"
        href={buildSortHref('wholesaler')}
        active={sortBy === 'wholesaler'}
        dir={sortDir}
      />
    </TableHeadCell>
    <TableHeadCell>
      <SortableHeader
        label="Fecha del pedido"
        href={buildSortHref('placed_at')}
        active={sortBy === 'placed_at'}
        dir={sortDir}
      />
    </TableHeadCell>
    <TableHeadCell>
      <SortableHeader
        label="Fecha de entrega"
        href={buildSortHref('expected_delivery_at')}
        active={sortBy === 'expected_delivery_at'}
        dir={sortDir}
      />
    </TableHeadCell>
    <TableHeadCell>Entrega en</TableHeadCell>
    <TableHeadCell>
      <SortableHeader
        label="Estado"
        href={buildSortHref('status')}
        active={sortBy === 'status'}
        dir={sortDir}
      />
    </TableHeadCell>
    <TableHeadCell>Unidades</TableHeadCell>
    <TableHeadCell>
      <SortableHeader
        label="Total"
        href={buildSortHref('total_ars')}
        active={sortBy === 'total_ars'}
        dir={sortDir}
      />
    </TableHeadCell>
    <TableHeadCell>Acciones</TableHeadCell>
  </TableHead>
  <TableBody>
    {#each orders as order (order.id)}
      <TableBodyRow>
        <TableBodyCell class="font-mono text-xs">#{order.id.slice(0, 8)}</TableBodyCell>
        <TableBodyCell>{order.wholesalerName}</TableBodyCell>
        <TableBodyCell>{formatDate(order.placed_at)}</TableBodyCell>
        <TableBodyCell>{formatDate(order.expected_delivery_at)}</TableBodyCell>
        <TableBodyCell>
            {#if order.isOverdue}
              <Badge color="red">Demorado · {Math.abs(order.daysToDelivery)} día(s)</Badge>
            {:else}
              <span class="text-xs text-gray-600">{Math.max(order.daysToDelivery, 0)} día(s)</span>
            {/if}
        </TableBodyCell>
        <TableBodyCell><Badge color={badgeColor(order.status)}>{order.statusLabel}</Badge></TableBodyCell>
        <TableBodyCell>{order.total_units}</TableBodyCell>
        <TableBodyCell>{formatArs(Number(order.total_ars ?? 0))}</TableBodyCell>
        <TableBodyCell>
          <div class="flex flex-wrap gap-2">
            <Button href={route('/mayorista-orders/', order.id)} size="xs" color="light">Ver detalle</Button>
            {#if order.status === 'received'}
              <form method="POST" action="?/markInPreparation" use:enhance={enhanceStatusAction({
                title: 'Pasar pedido a preparación',
                text: 'Esta accion movera el pedido al estado en preparación.',
                confirmButtonText: 'Si, pasar'
              })}>
                <input type="hidden" name="orderId" value={order.id} />
                <Button type="submit" size="xs">En preparación</Button>
              </form>
            {/if}
            {#if order.status === 'received' || order.status === 'in_preparation'}
              <form method="POST" action="?/markReady" use:enhance={enhanceStatusAction({
                title: 'Marcar pedido como listo',
                text: 'Esta accion marcara el pedido como listo.',
                confirmButtonText: 'Si, marcar listo'
              })}>
                <input type="hidden" name="orderId" value={order.id} />
                <Button type="submit" size="xs" color="purple">Marcar listo</Button>
              </form>
            {/if}
            {#if order.status === 'ready'}
              <form method="POST" action="?/markDelivered" use:enhance={enhanceStatusAction({
                title: 'Marcar pedido como entregado',
                text: 'Esta accion registrara la fecha de entrega del pedido.',
                confirmButtonText: 'Si, marcar entregado'
              })}>
                <input type="hidden" name="orderId" value={order.id} />
                <Button type="submit" size="xs" color="teal">Marcar entregado</Button>
              </form>
            {/if}
            {#if !order.paid_at}
              <form method="POST" action="?/markPaid" use:enhance={enhanceStatusAction({
                title: 'Registrar cobro del pedido',
                text: 'Esta accion registrara la fecha y método de cobro.',
                confirmButtonText: 'Si, registrar cobro'
              })}>
                <input type="hidden" name="orderId" value={order.id} />
                <select name="paymentMethod" class="rounded border border-gray-300 px-2 py-1 text-xs">
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="mercadopago">MercadoPago</option>
                  <option value="other">Otro</option>
                </select>
                <Button type="submit" size="xs" color="green">Registrar cobro</Button>
              </form>
            {/if}
          </div>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
