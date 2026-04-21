<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Button, Card } from 'flowbite-svelte';
  import ActiveStatusBadge from '$lib/components/admin/ActiveStatusBadge.svelte';
  import { formatArs } from '$lib/shared/currency';
  import { route } from '$lib/shared/navigation';
  import { closeBlockingLoader, confirmAlert, presentActionFeedback, showBlockingLoader } from '$lib/shared/alerts';
  import type { WholesaleProductListRow } from '$lib/types/view-models/wholesale-products';

  type Props = {
    products: ReadonlyArray<WholesaleProductListRow>;
  };

  let { products }: Props = $props();
  const firstImage = (product: WholesaleProductListRow) => product.images[0]?.public_url ?? '';

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

<div class="space-y-3 md:hidden" aria-label="Lista de productos mayoristas">
  {#each products as product (product.id)}
    <Card class="p-4" role="listitem">
      <div class="mb-3 flex items-start justify-between gap-2">
        <div class="flex items-center gap-3">
          {#if firstImage(product)}
            <img src={firstImage(product)} alt={product.name} class="h-12 w-12 rounded object-cover" />
          {/if}
          <div>
            <p class="font-semibold text-gray-900">{product.name}</p>
            <p class="text-sm text-gray-500">{product.presentation}</p>
          </div>
        </div>
        <ActiveStatusBadge isActive={product.is_active} />
      </div>

      <div class="mb-3 text-sm">
        <p class="text-xs text-gray-500">Precio</p>
        <p class="font-medium">{formatArs(Number(product.price_ars ?? 0))}</p>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button href={route('/mayorista-products/', product.id, '/update')} size="xs" color="light">Editar</Button>
        <form method="POST" action="?/toggleActive" use:enhance={enhanceStatusAction({
          title: product.is_active ? 'Desactivar producto' : 'Restaurar producto',
          text: product.is_active ? 'El producto dejara de estar disponible para operadores y surtidos.' : 'El producto volvera a quedar activo para surtidos y ventas.',
          confirmButtonText: product.is_active ? 'Si, desactivar' : 'Si, restaurar'
        })}>
          <input type="hidden" name="id" value={product.id} />
          <input type="hidden" name="activate" value={product.is_active ? 'false' : 'true'} />
          <Button type="submit" size="xs" color={product.is_active ? 'red' : 'blue'}>
            {product.is_active ? 'Desactivar' : 'Restaurar'}
          </Button>
        </form>
      </div>
    </Card>
  {/each}
</div>
