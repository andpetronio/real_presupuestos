<script lang="ts">
  import { Button, Card } from 'flowbite-svelte';
  import FeedbackBanner from '$lib/components/FeedbackBanner.svelte';
  import WholesaleOrderDetailCard from '$lib/components/wholesale-orders/WholesaleOrderDetailCard.svelte';
  import type { WholesaleOrderDetailView } from '$lib/types/view-models/wholesale-orders';

  type PageData = {
    order: WholesaleOrderDetailView;
  };

  type FormState = {
    operatorError?: string;
    operatorSuccess?: string;
  };

  let { data, form }: { data: PageData; form: FormState | null } = $props();
  const hasStatusActions = $derived(
    data.order.status === 'received' ||
      data.order.status === 'in_preparation' ||
      data.order.status === 'ready' ||
      data.order.status === 'delivered' ||
      !data.order.paid_at
  );
</script>

<div class="space-y-4">
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div>
      <h1 class="text-2xl font-semibold text-gray-900">Detalle del pedido</h1>
      <p class="text-sm text-gray-600">
        Revisá el contenido del pedido y ejecutá las transiciones operativas válidas.
      </p>
    </div>
    <Button href="/mayorista-orders" color="light">Volver a pedidos</Button>
  </div>

  {#if form?.operatorSuccess}
    <FeedbackBanner message={form.operatorSuccess} color="green" />
  {/if}
  {#if form?.operatorError}
    <FeedbackBanner message={form.operatorError} color="red" />
  {/if}

  {#if hasStatusActions}
    <Card size="xl" class="w-full p-4 shadow-sm">
      <div class="flex flex-wrap gap-2">
        {#if data.order.status === 'received'}
          <form method="POST" action="?/markInPreparation">
            <Button type="submit">Pasar a preparación</Button>
          </form>
        {/if}
        {#if data.order.status === 'received' || data.order.status === 'in_preparation'}
          <form method="POST" action="?/markReady">
            <Button type="submit" color="purple">Marcar listo</Button>
          </form>
        {/if}
        {#if data.order.status === 'ready'}
          <form method="POST" action="?/markDelivered">
            <Button type="submit" color="teal">Marcar entregado</Button>
          </form>
        {/if}
      {#if !data.order.paid_at}
        <form method="POST" action="?/markPaid">
          <select name="paymentMethod" class="rounded border border-gray-300 px-2 py-1 text-sm">
            <option value="cash">Efectivo</option>
            <option value="transfer">Transferencia</option>
            <option value="mercadopago">MercadoPago</option>
            <option value="other">Otro</option>
          </select>
          <Button type="submit" color="green">Registrar cobro</Button>
        </form>
      {/if}
      </div>
    </Card>
  {/if}

  <Card size="xl" class="w-full p-4 shadow-sm">
    <h3 class="text-base font-semibold text-gray-900">Preparación parcial por producto</h3>
    <div class="mt-3 space-y-2">
      {#each data.order.items as item (item.id)}
        <form method="POST" action="?/updatePreparedQuantity" class="flex flex-wrap items-end gap-2">
          <input type="hidden" name="itemId" value={item.id} />
          <div class="min-w-[240px] flex-1">
            <p class="text-sm font-medium text-gray-900">{item.product_name_snapshot}</p>
            <p class="text-xs text-gray-500">Pedido: {item.quantity}</p>
          </div>
          <input
            name="preparedQuantity"
            type="number"
            min="0"
            class="w-28 rounded border border-gray-300 px-2 py-1 text-sm"
            value={item.prepared_quantity}
          />
          <Button type="submit" size="xs" color="light">Guardar</Button>
        </form>
      {/each}
    </div>
  </Card>

  <WholesaleOrderDetailCard order={data.order} />
</div>
