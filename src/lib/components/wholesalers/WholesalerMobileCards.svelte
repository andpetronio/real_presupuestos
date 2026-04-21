<script lang='ts'>
  import { applyAction, enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Button, Card } from 'flowbite-svelte';
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

<div class='space-y-3 md:hidden' aria-label='Lista de mayoristas'>
  {#each wholesalers as wholesaler (wholesaler.id)}
    <Card class='p-4' role='listitem'>
      <div class='mb-3 flex items-start justify-between gap-2'>
        <div>
          <p class='font-semibold text-gray-900'>{wholesaler.name}</p>
          <p class='text-sm text-gray-500'>{wholesaler.category_name ?? 'Sin categoría'}</p>
        </div>
        <ActiveStatusBadge isActive={wholesaler.is_active} />
      </div>

      <div class='mb-3 grid grid-cols-2 gap-2 text-sm'>
        <div>
          <p class='text-xs text-gray-500'>CUIT/DNI</p>
          <p class='font-medium'>{wholesaler.tax_id ?? '—'}</p>
        </div>
        <div>
          <p class='text-xs text-gray-500'>Contacto</p>
          <p class='font-medium'>{wholesaler.contact_full_name ?? '—'}</p>
        </div>
        <div>
          <p class='text-xs text-gray-500'>WhatsApp</p>
          <p class='font-medium'>{wholesaler.contact_whatsapp ?? '—'}</p>
        </div>
        <div>
          <p class='text-xs text-gray-500'>Email</p>
          <p class='font-medium break-all'>{wholesaler.contact_email ?? '—'}</p>
        </div>
      </div>

      <div class='mb-3 grid grid-cols-2 gap-2 text-sm'>
        <div>
          <p class='text-xs text-gray-500'>Código</p>
          <p class='font-mono text-xs'>{wholesaler.unique_random_code}</p>
        </div>
        <div>
          <p class='text-xs text-gray-500'>Mínimo</p>
          <p class='font-medium'>{wholesaler.min_total_units} unidades</p>
        </div>
      </div>

      <div class='flex flex-wrap gap-2'>
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
    </Card>
  {/each}
</div>
