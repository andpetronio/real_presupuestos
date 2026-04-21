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
  import type { WholesalerCategoryListRow } from '$lib/types/view-models/wholesaler-categories';

  type Props = {
    categories: ReadonlyArray<WholesalerCategoryListRow>;
  };

  let { categories }: Props = $props();

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

<div class='space-y-3 md:hidden' aria-label='Lista de categorías mayoristas'>
  {#each categories as category (category.id)}
    <Card class='p-4' role='listitem'>
      <div class='mb-3 flex items-start justify-between gap-2'>
        <div>
          <p class='font-semibold text-gray-900'>{category.name}</p>
          <p class='text-xs text-gray-500'>Alta {new Date(category.created_at).toLocaleDateString('es-AR')}</p>
        </div>
        <ActiveStatusBadge isActive={category.is_active} activeLabel='Activa' inactiveLabel='Inactiva' />
      </div>

      <div class='flex flex-wrap gap-2'>
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
    </Card>
  {/each}
</div>
