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
          <p class="text-xs text-gray-500">Total</p>
          <p class="font-medium">{formatArs(Number(order.total_ars ?? 0))}</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button href={route('/mayorista-orders/', order.id)} size="xs" color="light">Ver detalle</Button>
        {#if order.status === 'pending'}
          <form method="POST" action="?/markDelivered" use:enhance={enhanceStatusAction({ title: 'Marcar pedido como entregado', text: 'Esta accion registrara la fecha de entrega del pedido.', confirmButtonText: 'Si, marcar entregado' })}>
            <input type="hidden" name="orderId" value={order.id} />
            <Button type="submit" size="xs">Marcar entregado</Button>
          </form>
        {/if}
        {#if order.status === 'delivered'}
          <form method="POST" action="?/markPaid" use:enhance={enhanceStatusAction({ title: 'Marcar pedido como cobrado', text: 'Esta accion registrara la fecha de cobro del pedido.', confirmButtonText: 'Si, marcar cobrado' })}>
            <input type="hidden" name="orderId" value={order.id} />
            <Button type="submit" size="xs" color="green">Marcar cobrado</Button>
          </form>
        {/if}
      </div>
    </Card>
  {/each}
</div>
