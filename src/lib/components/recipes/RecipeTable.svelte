<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Button, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
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

  type RecipeTableProps = {
    recipes: ReadonlyArray<RecipeRow>;
  };

  let { recipes }: RecipeTableProps = $props();

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

<Table hoverable striped aria-label="Tabla de recetas">
  <TableHead>
    <TableHeadCell>Receta</TableHeadCell>
    <TableHeadCell>Perro</TableHeadCell>
    <TableHeadCell>Notas</TableHeadCell>
    <TableHeadCell>Estado</TableHeadCell>
    <TableHeadCell>Acciones</TableHeadCell>
  </TableHead>
  <TableBody>
    {#each recipes as recipe (recipe.id)}
      <TableBodyRow>
        <TableBodyCell>{recipe.name}</TableBodyCell>
        <TableBodyCell>{recipe.dog?.name ?? 'Sin perro'}</TableBodyCell>
        <TableBodyCell>{recipe.notes ?? '—'}</TableBodyCell>
        <TableBodyCell>
          <ActiveStatusBadge
            isActive={recipe.is_active}
            activeLabel="Activa"
            inactiveLabel="Inactiva"
          />
        </TableBodyCell>
        <TableBodyCell>
          <div class="flex items-center gap-2">
            <Button href={route('/recipes/', recipe.id, '/update')} size="xs" color="light" aria-label="Editar {recipe.name}">Editar</Button>
            {#if recipe.is_active}
              <form method="POST" action="?/delete" use:enhance={enhanceDelete()}>
                <input type="hidden" name="recipeId" value={recipe.id} />
                <Button type="submit" size="xs" color="red" aria-label="Desactivar {recipe.name}">Desactivar</Button>
              </form>
            {/if}
          </div>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
