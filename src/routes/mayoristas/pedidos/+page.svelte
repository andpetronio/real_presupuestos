<script lang="ts">
  import { Button, Card, Label, Select } from 'flowbite-svelte';
  import { formatArs } from '$lib/shared/currency';

  type OrderItem = {
    id: string;
    quantity: number;
    unit_price_ars_snapshot: number;
    line_total_ars_snapshot: number;
    product_name_snapshot: string;
    presentation_snapshot: string;
  };

  type Order = {
    id: string;
    status: 'received' | 'in_preparation' | 'ready' | 'delivered' | 'paid';
    total_units: number;
    total_ars: number;
    notes: string | null;
    placed_at: string;
    expected_delivery_at: string;
    ready_at: string | null;
    delivered_at: string | null;
    paid_at: string | null;
    payment_method: 'cash' | 'transfer' | 'mercadopago' | 'other' | null;
    items: OrderItem[];
  };

  type PageData = {
    wholesaler: { id: string; name: string };
    currentStatus: string;
    orders: Order[];
  };

  let { data }: { data: PageData } = $props();

  let selectedOrder = $state<Order | null>(null);

  const statusLabels: Record<string, string> = {
    received: 'Recibido',
    in_preparation: 'En preparación',
    ready: 'Listo',
    delivered: 'Entregado',
    paid: 'Cobrado'
  };

  const statusClasses: Record<string, string> = {
    received: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    in_preparation: 'bg-blue-100 text-blue-800 border-blue-300',
    ready: 'bg-purple-100 text-purple-800 border-purple-300',
    delivered: 'bg-teal-100 text-teal-800 border-teal-300',
    paid: 'bg-green-100 text-green-800 border-green-300'
  };

  const paymentMethodLabels: Record<string, string> = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    mercadopago: 'MercadoPago',
    other: 'Otro'
  };

  const timingLabel = (order: Order): string => {
    const expected = new Date(order.expected_delivery_at);
    if (Number.isNaN(expected.getTime())) return 'Sin fecha estimada';
    const now = new Date();
    const diffDays = Math.ceil((expected.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isFinal = order.status === 'delivered' || order.status === 'paid';
    if (!isFinal && diffDays < 0) return `Demorado ${Math.abs(diffDays)} día(s)`;
    return `Faltan ${Math.max(diffDays, 0)} día(s)`;
  };

  const formatDate = (value: string | null): string =>
    value ? new Date(value).toLocaleDateString('es-AR') : '—';
</script>

<svelte:head>
  <title>Mis pedidos mayoristas</title>
</svelte:head>

<main class="min-h-screen bg-gray-50 p-4 md:p-6">
  <div class="mx-auto max-w-7xl space-y-4">
    <Card size="xl" class="p-4 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.14em] text-primary-700">Mis pedidos</p>
          <h1 class="text-2xl font-bold text-gray-900">{data.wholesaler.name}</h1>
        </div>
        <div class="flex gap-2">
          <Button href="/mayoristas/portal" class="bg-primary-600 text-white hover:bg-primary-700">Volver a la tienda</Button>
          <form method="POST" action="/mayoristas/logout">
            <Button type="submit" class="bg-secondary hover:bg-secondary-700 text-white">Cerrar sesión</Button>
          </form>
        </div>
      </div>
    </Card>

    <Card size="xl" class="p-4 shadow-sm">
      <form method="GET" class="flex flex-wrap items-end gap-3">
        <div>
          <Label for="status">Estado</Label>
          <Select id="status" name="status" value={data.currentStatus}>
            <option value="all">Todos</option>
            <option value="received">Recibidos</option>
            <option value="in_preparation">En preparación</option>
            <option value="ready">Listos</option>
            <option value="delivered">Entregados</option>
            <option value="paid">Cobrados</option>
          </Select>
        </div>
        <Button type="submit" color="light">Filtrar</Button>
      </form>

      {#if data.orders.length === 0}
        <p class="mt-4 text-sm text-gray-600">No hay pedidos para el estado seleccionado.</p>
      {:else}
        <div class="mt-4 space-y-2">
          {#each data.orders as order (order.id)}
            <div class="rounded-lg border border-gray-200 p-3">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-semibold text-gray-900">Pedido #{order.id.slice(0, 8)}</p>
                    <span class={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClasses[order.status] ?? 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                      {statusLabels[order.status] ?? order.status}
                    </span>
                  </div>
                  <p class="text-xs text-gray-600">Pedido: {formatDate(order.placed_at)}</p>
                  <p class="text-xs text-gray-600">
                    Entrega estimada: {formatDate(order.expected_delivery_at)}
                    <span class={`ml-1 font-semibold ${timingLabel(order).startsWith('Demorado') ? 'text-red-600' : 'text-gray-700'}`}>
                      · {timingLabel(order)}
                    </span>
                  </p>
                  <p class="text-xs text-gray-700">{order.total_units} unidades · {formatArs(Number(order.total_ars ?? 0))}</p>
                </div>
                <Button type="button" size="xs" color="light" onclick={() => (selectedOrder = order)}>Ver detalle</Button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </Card>
  </div>
</main>

{#if selectedOrder}
  <button
    type="button"
    class="fixed inset-0 z-50 bg-black/50"
    aria-label="Cerrar detalle"
    onclick={() => (selectedOrder = null)}
  ></button>

  <div class="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white p-4 md:inset-10 md:rounded-2xl">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900">Pedido #{selectedOrder.id.slice(0, 8)}</h2>
      <Button size="xs" color="light" onclick={() => (selectedOrder = null)}>Cerrar</Button>
    </div>

    <div class="grid gap-3 md:grid-cols-2">
      <div class="rounded border border-gray-200 p-3 text-sm">
        <p>
          <strong>Estado:</strong>
          <span class={`ml-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClasses[selectedOrder.status] ?? 'bg-gray-100 text-gray-700 border-gray-300'}`}>
            {statusLabels[selectedOrder.status] ?? selectedOrder.status}
          </span>
        </p>
        <p><strong>Fecha pedido:</strong> {formatDate(selectedOrder.placed_at)}</p>
        <p><strong>Entrega estimada:</strong> {formatDate(selectedOrder.expected_delivery_at)}</p>
        <p><strong>Listo:</strong> {formatDate(selectedOrder.ready_at)}</p>
        <p><strong>Entregado:</strong> {formatDate(selectedOrder.delivered_at)}</p>
        <p><strong>Cobrado:</strong> {formatDate(selectedOrder.paid_at)}</p>
        <p><strong>Total:</strong> {selectedOrder.total_units} unidades · {formatArs(Number(selectedOrder.total_ars ?? 0))}</p>
        <p><strong>Método pago:</strong> {selectedOrder.payment_method ? (paymentMethodLabels[selectedOrder.payment_method] ?? selectedOrder.payment_method) : '—'}</p>
      </div>
      <div class="rounded border border-gray-200 p-3 text-sm">
        <p class="text-xs uppercase tracking-wide text-gray-500">Notas</p>
        <p class="mt-1 text-gray-700">{selectedOrder.notes || 'Sin notas.'}</p>
      </div>
    </div>

    <div class="mt-4 space-y-2">
      <p class="text-sm font-semibold text-gray-900">Ítems</p>
      {#each selectedOrder.items as item (item.id)}
        <div class="rounded border border-gray-200 p-3 text-sm">
          <p class="font-medium text-gray-900">{item.product_name_snapshot}</p>
          <p class="text-xs text-gray-500">{item.presentation_snapshot}</p>
          <p class="text-xs text-gray-700">{item.quantity} × {formatArs(Number(item.unit_price_ars_snapshot ?? 0))} = {formatArs(Number(item.line_total_ars_snapshot ?? 0))}</p>
        </div>
      {/each}
    </div>
  </div>
{/if}
