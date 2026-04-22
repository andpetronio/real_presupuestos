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
    sortBy: 'wholesaler' | 'placed_at' | 'status' | 'total_units' | 'total_ars';
    sortDir: 'asc' | 'desc';
    buildSortHref: (
      field: 'wholesaler' | 'placed_at' | 'status' | 'total_units' | 'total_ars',
    ) => string;
  };
  let { orders, sortBy, sortDir, buildSortHref }: Props = $props();

  const badgeColor = (status: string) => status === 'pending' ? 'yellow' : status === 'delivered' ? 'blue' : 'green';
  const formatDate = (value: string) => new Date(value).toLocaleString('es-AR');

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

<Table hoverable striped aria-label="Tabla de pedidos mayoristas">
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
        label="Fecha"
        href={buildSortHref('placed_at')}
        active={sortBy === 'placed_at'}
        dir={sortDir}
      />
    </TableHeadCell>
    <TableHeadCell>
      <SortableHeader
        label="Estado"
        href={buildSortHref('status')}
        active={sortBy === 'status'}
        dir={sortDir}
      />
    </TableHeadCell>
    <TableHeadCell>
      <SortableHeader
        label="Unidades"
        href={buildSortHref('total_units')}
        active={sortBy === 'total_units'}
        dir={sortDir}
      />
    </TableHeadCell>
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
        <TableBodyCell><Badge color={badgeColor(order.status)}>{order.statusLabel}</Badge></TableBodyCell>
        <TableBodyCell>{order.total_units}</TableBodyCell>
        <TableBodyCell>{formatArs(Number(order.total_ars ?? 0))}</TableBodyCell>
        <TableBodyCell>
          <div class="flex flex-wrap gap-2">
            <Button href={route('/mayorista-orders/', order.id)} size="xs" color="light">Ver detalle</Button>
            {#if order.status === 'pending'}
              <form method="POST" action="?/markDelivered" use:enhance={enhanceStatusAction({
                title: 'Marcar pedido como entregado',
                text: 'Esta accion registrara la fecha de entrega del pedido.',
                confirmButtonText: 'Si, marcar entregado'
              })}>
                <input type="hidden" name="orderId" value={order.id} />
                <Button type="submit" size="xs">Marcar entregado</Button>
              </form>
            {/if}
            {#if order.status === 'delivered'}
              <form method="POST" action="?/markPaid" use:enhance={enhanceStatusAction({
                title: 'Marcar pedido como cobrado',
                text: 'Esta accion registrara la fecha de cobro del pedido.',
                confirmButtonText: 'Si, marcar cobrado'
              })}>
                <input type="hidden" name="orderId" value={order.id} />
                <Button type="submit" size="xs" color="green">Marcar cobrado</Button>
              </form>
            {/if}
          </div>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
