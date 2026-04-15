<script lang="ts">
  import { Card, Button } from 'flowbite-svelte';
  import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
  import { route } from '$lib/shared/navigation';

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
</script>

<div class="space-y-3 md:hidden" aria-label="Lista de recetas">
  {#each recipes as recipe (recipe.id)}
    <Card class="p-4" role="listitem">
      <!-- Nombre + Estado -->
      <div class="mb-3 flex items-start justify-between gap-2">
        <p class="font-semibold text-gray-900">{recipe.name}</p>
        <StatusBadge
          status={recipe.is_active ? 'accepted' : 'rejected'}
          label={recipe.is_active ? 'Activa' : 'Inactiva'}
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
      </div>
    </Card>
  {/each}
</div>