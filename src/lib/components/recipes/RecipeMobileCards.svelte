<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Card, Button } from 'flowbite-svelte';
  import ActiveStatusBadge from '$lib/components/admin/ActiveStatusBadge.svelte';
  import { route } from '$lib/shared/navigation';
  import { closeBlockingLoader, confirmAlert, presentActionFeedback, showBlockingLoader } from '$lib/shared/alerts';

  type RecipeRow = {
    id: string;
    dog_id: string;
    name: string;
    notes: string | null;
    is_active: boolean;
    dog: { name: string } | null;
  };

  type RecipeMobileCardsProps = {
    recipes: ReadonlyArray<RecipeRow>;
  };

  let { recipes }: RecipeMobileCardsProps = $props();

  const enhanceDelete = () => {
    return async ({ cancel }: { cancel: () => void }) => {
      const confirmed = await confirmAlert({
        title: 'Desactivar receta',
        text: 'La receta quedara inactiva para nuevos presupuestos.',
        confirmButtonText: 'Si, desactivar'
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

<div class="space-y-3 md:hidden" aria-label="Lista de recetas">
  {#each recipes as recipe (recipe.id)}
    <Card class="p-4" role="listitem">
      <!-- Nombre + Estado -->
      <div class="mb-3 flex items-start justify-between gap-2">
        <p class="font-semibold text-gray-900">{recipe.name}</p>
        <ActiveStatusBadge
          isActive={recipe.is_active}
          activeLabel="Activa"
          inactiveLabel="Inactiva"
        />
      </div>

      <!-- Perro asociado -->
      <div class="mb-3 text-sm">
        <p class="text-xs text-gray-500">Perro</p>
        <p class="font-medium">{recipe.dog?.name ?? 'Sin perro'}</p>
      </div>

      <!-- Notas (preview) -->
      {#if recipe.notes}
        <div class="mb-3 text-sm">
          <p class="text-xs text-gray-500">Notas</p>
          <p class="text-gray-600 line-clamp-2">{recipe.notes}</p>
        </div>
      {/if}

      <!-- Acciones -->
      <div class="flex flex-wrap gap-2">
        <Button
          href={route('/recipes/', recipe.id, '/update')}
          size="xs"
          color="light"
          aria-label="Editar {recipe.name}"
        >
          Editar
        </Button>
        {#if recipe.is_active}
          <form method="POST" action="?/delete" use:enhance={enhanceDelete()}>
            <input type="hidden" name="recipeId" value={recipe.id} />
            <Button type="submit" size="xs" color="red" aria-label="Desactivar {recipe.name}">
              Desactivar
            </Button>
          </form>
        {/if}
      </div>
    </Card>
  {/each}
</div>
