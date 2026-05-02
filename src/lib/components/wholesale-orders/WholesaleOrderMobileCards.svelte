<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Badge, Button, Card } from 'flowbite-svelte';
  import { formatArs } from '$lib/shared/currency';
  import { route } from '$lib/shared/navigation';
  import { closeBlockingLoader, confirmAlert, presentActionFeedback, showBlockingLoader } from '$lib/shared/alerts';
  import type { WholesaleOrderListRow } from '$lib/types/view-models/wholesale-orders';

  type Props = { orders: ReadonlyArray<WholesaleOrderListRow> };
  let { orders }: Props = $props();
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

<div class="space-y-3 md:hidden" aria-label="Lista de pedidos mayoristas">
  {#each orders as order (order.id)}
    <Card class="p-4" role="listitem">
      <div class="mb-3 flex items-start justify-between gap-2">
        <div>
          <p class="font-semibold text-gray-900">{order.wholesalerName}</p>
          <p class="text-xs text-gray-500">Pedido #{order.id.slice(0, 8)} · {formatDate(order.placed_at)}</p>
        </div>
        <Badge color={badgeColor(order.status)}>{order.statusLabel}</Badge>
      </div>
      <div class="mb-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p class="text-xs text-gray-500">Unidades</p>
          <p class="font-medium">{order.total_units}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Entrega estimada</p>
          <p class="font-medium">{formatDate(order.expected_delivery_at)}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Timing</p>
          <p class="font-medium">{order.isOverdue ? `${Math.abs(order.daysToDelivery)} día(s) demora` : `${Math.max(order.daysToDelivery, 0)} día(s) restantes`}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Total</p>
          <p class="font-medium">{formatArs(Number(order.total_ars ?? 0))}</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button href={route('/mayorista-orders/', order.id)} size="xs" color="light">Ver detalle</Button>
        {#if order.status === 'received'}
          <form method="POST" action="?/markInPreparation" use:enhance={enhanceStatusAction({ title: 'Pasar pedido a preparación', text: 'Esta accion movera el pedido al estado en preparación.', confirmButtonText: 'Si, pasar' })}>
            <input type="hidden" name="orderId" value={order.id} />
            <Button type="submit" size="xs">En preparación</Button>
          </form>
        {/if}
        {#if order.status === 'received' || order.status === 'in_preparation'}
          <form method="POST" action="?/markReady" use:enhance={enhanceStatusAction({ title: 'Marcar pedido como listo', text: 'Esta accion marcara el pedido como listo.', confirmButtonText: 'Si, marcar listo' })}>
            <input type="hidden" name="orderId" value={order.id} />
            <Button type="submit" size="xs" color="purple">Marcar listo</Button>
          </form>
        {/if}
        {#if order.status === 'ready'}
          <form method="POST" action="?/markDelivered" use:enhance={enhanceStatusAction({ title: 'Marcar pedido como entregado', text: 'Esta accion registrara la fecha de entrega del pedido.', confirmButtonText: 'Si, marcar entregado' })}>
            <input type="hidden" name="orderId" value={order.id} />
            <Button type="submit" size="xs" color="teal">Marcar entregado</Button>
          </form>
        {/if}
        {#if !order.paid_at}
          <form method="POST" action="?/markPaid" use:enhance={enhanceStatusAction({ title: 'Registrar cobro del pedido', text: 'Esta accion registrara la fecha y método de cobro del pedido.', confirmButtonText: 'Si, registrar cobro' })}>
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
    </Card>
  {/each}
</div>
