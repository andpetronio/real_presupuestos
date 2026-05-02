<script lang='ts'>
  import { applyAction, enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import {
    Button,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from 'flowbite-svelte';
  import ActiveStatusBadge from '$lib/components/admin/ActiveStatusBadge.svelte';
  import SortableHeader from '$lib/components/admin/SortableHeader.svelte';
  import { route } from '$lib/shared/navigation';
  import {
    closeBlockingLoader,
    confirmAlert,
    presentActionFeedback,
    showBlockingLoader,
  } from '$lib/shared/alerts';
  import type { WholesalerCategoryListRow } from '$lib/types/view-models/wholesaler-categories';

  type Props = {
    categories: ReadonlyArray<WholesalerCategoryListRow>;
    sortBy: 'name' | 'is_active' | 'created_at';
    sortDir: 'asc' | 'desc';
    buildSortHref: (field: 'name' | 'is_active' | 'created_at') => string;
  };

  let { categories, sortBy, sortDir, buildSortHref }: Props = $props();

  const enhanceStatusAction = (params: {
    title: string;
    text: string;
    confirmButtonText: string;
  }) => {
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

<Table hoverable striped aria-label='Tabla de categorías mayoristas'>
  <TableHead>
    <TableHeadCell>
      <SortableHeader
        label='Nombre'
        href={buildSortHref('name')}
        active={sortBy === 'name'}
        dir={sortDir}
      />
    </TableHeadCell>
    <TableHeadCell>
      Mayoristas
    </TableHeadCell>
    <TableHeadCell>
      <SortableHeader
        label='Estado'
        href={buildSortHref('is_active')}
        active={sortBy === 'is_active'}
        dir={sortDir}
      />
    </TableHeadCell>
    <TableHeadCell>
      <SortableHeader
        label='Fecha alta'
        href={buildSortHref('created_at')}
        active={sortBy === 'created_at'}
        dir={sortDir}
      />
    </TableHeadCell>
    <TableHeadCell>Acciones</TableHeadCell>
  </TableHead>
  <TableBody>
    {#each categories as category (category.id)}
      <TableBodyRow>
        <TableBodyCell>{category.name}</TableBodyCell>
        <TableBodyCell>{category.wholesalers_count}</TableBodyCell>
        <TableBodyCell><ActiveStatusBadge isActive={category.is_active} activeLabel='Activa' inactiveLabel='Inactiva' /></TableBodyCell>
        <TableBodyCell>{new Date(category.created_at).toLocaleDateString('es-AR')}</TableBodyCell>
        <TableBodyCell>
          <div class='flex items-center gap-2'>
            <Button href={route('/mayorista-categories/', category.id, '/update')} size='xs' color='light'>Editar</Button>
            <form
              method='POST'
              action='?/toggleActive'
              use:enhance={enhanceStatusAction({
                title: category.is_active ? 'Desactivar categoría' : 'Restaurar categoría',
                text: category.is_active ? 'La categoría dejará de estar disponible para nuevos mayoristas.' : 'La categoría volverá a estar disponible para seleccionar.',
                confirmButtonText: category.is_active ? 'Sí, desactivar' : 'Sí, restaurar'
              })}
            >
              <input type='hidden' name='id' value={category.id} />
              <input type='hidden' name='activate' value={category.is_active ? 'false' : 'true'} />
              <Button type='submit' size='xs' color={category.is_active ? 'red' : 'blue'}>
                {category.is_active ? 'Desactivar' : 'Restaurar'}
              </Button>
            </form>
          </div>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
