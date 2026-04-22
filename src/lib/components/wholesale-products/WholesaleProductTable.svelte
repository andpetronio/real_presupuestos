<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Button, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
  import ActiveStatusBadge from '$lib/components/admin/ActiveStatusBadge.svelte';
  import SortableHeader from '$lib/components/admin/SortableHeader.svelte';
  import { formatArs } from '$lib/shared/currency';
  import { route } from '$lib/shared/navigation';
  import { closeBlockingLoader, confirmAlert, presentActionFeedback, showBlockingLoader } from '$lib/shared/alerts';
  import type { WholesaleProductListRow } from '$lib/types/view-models/wholesale-products';

  type Props = {
    products: ReadonlyArray<WholesaleProductListRow>;
    sortBy: 'name' | 'presentation' | 'price_ars' | 'is_active' | 'created_at';
    sortDir: 'asc' | 'desc';
    buildSortHref: (
      field: 'name' | 'presentation' | 'price_ars' | 'is_active' | 'created_at',
    ) => string;
  };

  let { products, sortBy, sortDir, buildSortHref }: Props = $props();
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

<Table hoverable striped aria-label="Tabla de productos mayoristas">
  <TableHead>
    <TableHeadCell>
      <SortableHeader
        label="Producto"
        href={buildSortHref('name')}
        active={sortBy === 'name'}
        dir={sortDir}
      />
    </TableHeadCell>
    <TableHeadCell>
      <SortableHeader
        label="Presentación"
        href={buildSortHref('presentation')}
        active={sortBy === 'presentation'}
        dir={sortDir}
      />
    </TableHeadCell>
    <TableHeadCell>
      <SortableHeader
        label="Precio"
        href={buildSortHref('price_ars')}
        active={sortBy === 'price_ars'}
        dir={sortDir}
      />
    </TableHeadCell>
    <TableHeadCell>
      <SortableHeader
        label="Estado"
        href={buildSortHref('is_active')}
        active={sortBy === 'is_active'}
        dir={sortDir}
      />
    </TableHeadCell>
    <TableHeadCell>
      <SortableHeader
        label="Fecha alta"
        href={buildSortHref('created_at')}
        active={sortBy === 'created_at'}
        dir={sortDir}
      />
    </TableHeadCell>
    <TableHeadCell>Acciones</TableHeadCell>
  </TableHead>
  <TableBody>
    {#each products as product (product.id)}
      <TableBodyRow>
        <TableBodyCell>
          <div class="flex items-center gap-3">
            {#if firstImage(product)}
              <img src={firstImage(product)} alt={product.name} class="h-10 w-10 rounded object-cover" />
            {/if}
            <span class="font-medium">{product.name}</span>
          </div>
        </TableBodyCell>
        <TableBodyCell>{product.presentation}</TableBodyCell>
        <TableBodyCell>{formatArs(Number(product.price_ars ?? 0))}</TableBodyCell>
        <TableBodyCell><ActiveStatusBadge isActive={product.is_active} /></TableBodyCell>
        <TableBodyCell>{product.created_at ? new Date(product.created_at).toLocaleDateString('es-AR') : '—'}</TableBodyCell>
        <TableBodyCell>
          <div class="flex items-center gap-2">
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
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
