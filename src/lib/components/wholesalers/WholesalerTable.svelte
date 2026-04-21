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
  import { route } from '$lib/shared/navigation';
  import {
    closeBlockingLoader,
    confirmAlert,
    presentActionFeedback,
    showBlockingLoader,
  } from '$lib/shared/alerts';
  import type { WholesalerListRow } from '$lib/types/view-models/wholesalers';

  type Props = {
    wholesalers: ReadonlyArray<WholesalerListRow>;
  };

  let { wholesalers }: Props = $props();

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

<Table hoverable striped aria-label='Tabla de mayoristas'>
  <TableHead>
    <TableHeadCell>Nombre</TableHeadCell>
    <TableHeadCell>Categoría</TableHeadCell>
    <TableHeadCell>Contacto</TableHeadCell>
    <TableHeadCell>WhatsApp</TableHeadCell>
    <TableHeadCell>Email</TableHeadCell>
    <TableHeadCell>Estado</TableHeadCell>
    <TableHeadCell>Acciones</TableHeadCell>
  </TableHead>
  <TableBody>
    {#each wholesalers as wholesaler (wholesaler.id)}
      <TableBodyRow>
        <TableBodyCell>
          <div>
            <p class='font-medium'>{wholesaler.name}</p>
            <p class='text-xs text-gray-500'>Código: {wholesaler.unique_random_code}</p>
          </div>
        </TableBodyCell>
        <TableBodyCell>{wholesaler.category_name ?? '—'}</TableBodyCell>
        <TableBodyCell>{wholesaler.contact_full_name ?? '—'}</TableBodyCell>
        <TableBodyCell>{wholesaler.contact_whatsapp ?? '—'}</TableBodyCell>
        <TableBodyCell>{wholesaler.contact_email ?? '—'}</TableBodyCell>
        <TableBodyCell>
          <ActiveStatusBadge isActive={wholesaler.is_active} />
        </TableBodyCell>
        <TableBodyCell>
          <div class='flex items-center gap-2'>
            <Button href={route('/admin-mayoristas/', wholesaler.id, '/update')} size='xs' color='light'>Editar</Button>
            <form
              method='POST'
              action='?/toggleActive'
              use:enhance={enhanceStatusAction({
                title: wholesaler.is_active ? 'Desactivar mayorista' : 'Restaurar mayorista',
                text: wholesaler.is_active ? 'El mayorista dejará de poder ingresar al portal.' : 'El mayorista volverá a quedar habilitado para el portal.',
                confirmButtonText: wholesaler.is_active ? 'Sí, desactivar' : 'Sí, restaurar'
              })}
            >
              <input type='hidden' name='id' value={wholesaler.id} />
              <input type='hidden' name='activate' value={wholesaler.is_active ? 'false' : 'true'} />
              <Button type='submit' size='xs' color={wholesaler.is_active ? 'red' : 'blue'}>
                {wholesaler.is_active ? 'Desactivar' : 'Restaurar'}
              </Button>
            </form>
          </div>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
