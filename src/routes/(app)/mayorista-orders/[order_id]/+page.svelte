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

  <Card size="xl" class="w-full p-4 shadow-sm">
    <div class="flex flex-wrap gap-2">
      {#if data.order.status === 'pending'}
        <form method="POST" action="?/markDelivered">
          <Button type="submit">Marcar entregado</Button>
        </form>
      {/if}
      {#if data.order.status === 'delivered'}
        <form method="POST" action="?/markPaid">
          <Button type="submit" color="green">Marcar cobrado</Button>
        </form>
      {/if}
    </div>
  </Card>

  <WholesaleOrderDetailCard order={data.order} />
</div>
