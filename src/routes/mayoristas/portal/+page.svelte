<script lang="ts">
  import { Alert, Button, Card, Label, Textarea } from "flowbite-svelte";
  import { formatArs } from "$lib/shared/currency";

  type ProductImage = {
    id: string;
    public_url: string;
    sort_order: number;
  };

  type Product = {
    id: string;
    name: string;
    presentation: string;
    description: string | null;
    price_ars: number;
    images: ProductImage[];
  };

  type PageData = {
    wholesaler: {
      id: string;
      name: string;
      min_total_units: number;
    };
    products: Product[];
  };

  type FormState = {
    operatorError?: string;
    operatorSuccess?: string;
    orderCreated?: boolean;
    orderId?: string;
    totalUnits?: number;
    totalArs?: number;
  };

  let { data, form }: { data: PageData; form: FormState | null } = $props();

  let quantities = $state<Record<string, number>>({});
  let notes = $state("");
  let isCartDrawerOpen = $state(false);

  const setQuantity = (productId: string, qty: number) => {
    const normalized = Math.max(0, Math.floor(qty));
    quantities = {
      ...quantities,
      [productId]: normalized
    };
  };

  const increment = (productId: string) => setQuantity(productId, (quantities[productId] ?? 0) + 1);
  const decrement = (productId: string) => setQuantity(productId, (quantities[productId] ?? 0) - 1);

  const cartItems = $derived(
    data.products
      .map((product) => ({
        productId: product.id,
        name: product.name,
        presentation: product.presentation,
        unitPrice: Number(product.price_ars ?? 0),
        quantity: quantities[product.id] ?? 0
      }))
      .filter((item) => item.quantity > 0)
      .map((item) => ({
        ...item,
        lineTotal: item.quantity * item.unitPrice
      }))
  );

  const totalUnits = $derived(cartItems.reduce((sum, item) => sum + item.quantity, 0));
  const subtotalArs = $derived(cartItems.reduce((sum, item) => sum + item.lineTotal, 0));
  const totalArs = $derived(subtotalArs);
  const minUnits = $derived(data.wholesaler.min_total_units);
  const minUnitsMissing = $derived(Math.max(minUnits - totalUnits, 0));
  const meetsMinimum = $derived(totalUnits >= minUnits);

  const serializedItems = $derived(
    JSON.stringify(
      cartItems.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity
      }))
    )
  );

  const firstImageUrl = (product: Product): string =>
    product.images?.slice().sort((a, b) => a.sort_order - b.sort_order)[0]?.public_url ?? "";
</script>

<svelte:head>
  <title>Tienda mayorista</title>
</svelte:head>

<main class="min-h-screen bg-gray-50 p-4 md:p-6">
    <div class="mx-auto flex max-w-7xl flex-col items-center space-y-4 pb-4 text-center">
        <img
            src="/logo.png"
            alt="Real, Amor en cada bocado"
            class="h-12 w-auto sm:h-14"
            loading="eager"
            decoding="async"
        />
        <p class="text-xs font-bold uppercase tracking-[0.14em] text-primary-700">
            Tienda mayorista
        </p>
    </div>
    <div class="mx-auto max-w-7xl space-y-4">
        <Card size="xl" class="p-4 shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="space-y-2">
                    <h1 class="text-2xl font-bold text-gray-900">Hola, {data.wholesaler.name}</h1>
                    <p class="text-sm text-gray-600">Pedido mínimo: <strong>{minUnits}</strong> unidades</p>
                </div>
                <form method="POST" action="/mayoristas/logout">
                    <Button type="submit" class="bg-secondary hover:bg-secondary-700 text-white cursor-pointer">Cerrar sesión</Button>
                </form>
            </div>
        </Card>

    {#if form?.operatorSuccess}
      <Alert color="green">
        <strong>{form.operatorSuccess}</strong>
        {#if form.orderId}
          <p>Pedido #{form.orderId.slice(0, 8)} · {form.totalUnits ?? 0} unidades · {formatArs(Number(form.totalArs ?? 0))}</p>
        {/if}
      </Alert>
    {/if}

    {#if form?.operatorError}
      <Alert color="red">{form.operatorError}</Alert>
    {/if}

    <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section class="grid grid-cols-1 gap-4">
        {#each data.products as product (product.id)}
            <Card size="xl" class="overflow-hidden p-0 shadow-sm">
              <div class="grid grid-cols-[140px_1fr] gap-0 sm:grid-cols-[180px_1fr] items-stretch">
                <div class="h-full bg-gray-100">
                  {#if firstImageUrl(product)}
                    <img
                      src={firstImageUrl(product)}
                      alt={product.name}
                      class="h-full w-full object-cover"
                      loading="lazy"
                    />
                  {:else}
                    <div class="flex h-full min-h-[180px] w-full items-center justify-center bg-gray-100">
                      <span class="text-gray-400">Sin imagen</span>
                    </div>
                  {/if}
                </div>
                <div class="flex h-full min-h-[180px] flex-col gap-2 p-4">
                  <div class="space-y-1">
                    <p class="text-base font-semibold text-gray-900 lg:text-xl">{product.name}</p>
                    <p class="text-sm text-gray-600 lg:text-lg">{product.presentation}</p>
                    {#if product.description}
                      <p class="mt-1 text-xs text-gray-500 line-clamp-3 lg:text-sm">{product.description}</p>
                    {/if}
                    <p class="mt-2 text-lg font-bold text-primary-700 lg:text-2xl">{formatArs(Number(product.price_ars ?? 0))}</p>
                  </div>
                  <div class="mt-auto flex items-center gap-2 pt-2">
                    <Button color="light" class="h-10 w-10 shrink-0 text-lg font-bold lg:h-11 lg:w-11 lg:text-lg" onclick={() => decrement(product.id)}>-</Button>
                    <div class="min-w-12 text-center text-2xl font-bold text-gray-900 lg:text-3xl">{quantities[product.id] ?? 0}</div>
                    <Button color="light" class="h-10 w-10 shrink-0 text-lg font-bold lg:h-11 lg:w-11 lg:text-lg" onclick={() => increment(product.id)}>+</Button>
                  </div>
                </div>
              </div>
            </Card>
          {/each}
        </section>

        <aside class="hidden self-start lg:block">
          <Card size="xl" class="sticky top-4 h-fit max-h-[calc(100vh-2rem)] overflow-y-auto p-4 shadow-sm">
            <h2 class="text-lg font-semibold text-gray-900">Carrito</h2>

            {#if cartItems.length === 0}
              <p class="mt-2 text-sm text-gray-600">Todavía no agregaste productos.</p>
            {:else}
              <ul class="mt-3 space-y-2">
                {#each cartItems as item (`${item.productId}`)}
                  <li class="rounded-lg border border-gray-200 p-2 text-sm">
                    <p class="font-medium text-gray-900">{item.name}</p>
                    <p class="text-gray-600">{item.quantity} × {formatArs(item.unitPrice)}</p>
                    <p class="font-semibold text-primary-700">{formatArs(item.lineTotal)}</p>
                  </li>
                {/each}
              </ul>
            {/if}

            <div class="mt-4 space-y-1 text-sm">
              <p class="flex items-center justify-between"><span>Unidades</span><strong>{totalUnits}</strong></p>
              <p class="flex items-center justify-between"><span>Total</span><strong>{formatArs(totalArs)}</strong></p>
            </div>

            {#if !meetsMinimum}
              <Alert color="yellow" class="mt-3 border border-amber-500 bg-amber-200 text-black-custom font-semibold leading-snug">
                Te faltan <strong>{minUnitsMissing}</strong> unidades para alcanzar el mínimo.
              </Alert>
            {/if}

            <form method="POST" action="?/placeOrder" class="mt-4 space-y-3">
              <input type="hidden" name="items" value={serializedItems} />
              <div class="w-full">
                <Label for="portal-notes-desktop">Notas (opcional)</Label>
                <Textarea id="portal-notes-desktop" name="notes" rows={3} bind:value={notes} class="w-full !max-w-none" />
              </div>
              <Button type="submit" class="w-full" disabled={!meetsMinimum || cartItems.length === 0}>Enviar pedido</Button>
            </form>
          </Card>
        </aside>
      </div>
  </div>
</main>

<div class="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white p-3 lg:hidden">
  <div class="mx-auto flex max-w-7xl items-center justify-between gap-3">
    <div>
      <p class="text-xs text-gray-500">Carrito</p>
      <p class="text-sm font-semibold">{totalUnits} un · {formatArs(totalArs)}</p>
    </div>
    <Button onclick={() => (isCartDrawerOpen = true)}>Ver carrito</Button>
  </div>
</div>

{#if isCartDrawerOpen}
  <button
    type="button"
    class="fixed inset-0 z-50 bg-black/40 lg:hidden"
    aria-label="Cerrar carrito"
    onclick={() => (isCartDrawerOpen = false)}
  ></button>
  <div class="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-4 lg:hidden">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-lg font-semibold">Tu carrito</h2>
      <Button color="light" size="sm" onclick={() => (isCartDrawerOpen = false)}>Cerrar</Button>
    </div>

    {#if cartItems.length === 0}
      <p class="text-sm text-gray-600">Todavía no agregaste productos.</p>
    {:else}
      <ul class="space-y-2">
        {#each cartItems as item (`mobile-${item.productId}`)}
          <li class="rounded-lg border border-gray-200 p-2 text-sm">
            <p class="font-medium text-gray-900">{item.name}</p>
            <p class="text-gray-600">{item.quantity} × {formatArs(item.unitPrice)}</p>
            <p class="font-semibold text-primary-700">{formatArs(item.lineTotal)}</p>
          </li>
        {/each}
      </ul>
    {/if}

    <div class="mt-4 space-y-1 text-sm">
      <p class="flex items-center justify-between"><span>Unidades</span><strong>{totalUnits}</strong></p>
      <p class="flex items-center justify-between"><span>Total</span><strong>{formatArs(totalArs)}</strong></p>
    </div>

    {#if !meetsMinimum}
      <Alert color="yellow" class="mt-3 border border-amber-300 bg-amber-100 text-base font-semibold leading-snug text-amber-900">
        Te faltan <strong>{minUnitsMissing}</strong> unidades para alcanzar el mínimo.
      </Alert>
    {/if}

    <form method="POST" action="?/placeOrder" class="mt-4 space-y-3">
      <input type="hidden" name="items" value={serializedItems} />
      <div class="w-full">
        <Label for="portal-notes-mobile">Notas (opcional)</Label>
        <Textarea id="portal-notes-mobile" name="notes" rows={3} bind:value={notes} class="w-full !max-w-none" />
      </div>
      <Button type="submit" class="w-full" disabled={!meetsMinimum || cartItems.length === 0}>Enviar pedido</Button>
    </form>
  </div>
{/if}
