<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Badge, Button, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
  import { closeBlockingLoader, confirmAlert, presentActionFeedback, showBlockingLoader } from '$lib/shared/alerts';
  import type { AssortmentProductRow } from '$lib/types/view-models/wholesale-assortment';

  type Props = {
    wholesalerId: string;
    products: ReadonlyArray<AssortmentProductRow>;
  };

  let { wholesalerId, products }: Props = $props();

  const enhanceToggle = (enabled: boolean) => {
    return async ({ cancel }: { cancel: () => void }) => {
      const confirmed = await confirmAlert({
        title: enabled ? 'Deshabilitar producto' : 'Habilitar producto',
        text: enabled ? 'El producto dejara de estar disponible para este mayorista.' : 'El producto quedara habilitado para este mayorista.',
        confirmButtonText: enabled ? 'Si, deshabilitar' : 'Si, habilitar',
      });
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

<Table hoverable striped aria-label="Tabla de productos del surtido">
  <TableHead>
    <TableHeadCell>Producto</TableHeadCell>
    <TableHeadCell>Presentación</TableHeadCell>
    <TableHeadCell>Estado producto</TableHeadCell>
    <TableHeadCell>Disponibilidad</TableHeadCell>
    <TableHeadCell>Acción</TableHeadCell>
  </TableHead>
  <TableBody>
    {#each products as product (product.id)}
      <TableBodyRow>
        <TableBodyCell class="font-medium">{product.name}</TableBodyCell>
        <TableBodyCell>{product.presentation}</TableBodyCell>
        <TableBodyCell><Badge color={product.is_active ? 'green' : 'gray'}>{product.is_active ? 'Activo' : 'Inactivo'}</Badge></TableBodyCell>
        <TableBodyCell><Badge color={product.is_enabled ? 'green' : 'yellow'}>{product.is_enabled ? 'Habilitado' : 'No habilitado'}</Badge></TableBodyCell>
        <TableBodyCell>
          <form method="POST" action="?/toggleProduct" use:enhance={enhanceToggle(product.is_enabled)}>
            <input type="hidden" name="wholesalerId" value={wholesalerId} />
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="enabled" value={product.is_enabled ? 'false' : 'true'} />
            <Button type="submit" size="xs" color={product.is_enabled ? 'red' : 'green'}>
              {product.is_enabled ? 'Deshabilitar' : 'Habilitar'}
            </Button>
          </form>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
