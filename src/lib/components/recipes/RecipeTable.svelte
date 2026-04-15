<script lang="ts">
  import { Button, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
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

  type RecipeTableProps = {
    recipes: ReadonlyArray<RecipeRow>;
  };

  let { recipes }: RecipeTableProps = $props();
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
          <StatusBadge
            status={recipe.is_active ? 'accepted' : 'rejected'}
            label={recipe.is_active ? 'Activa' : 'Inactiva'}
          />
        </TableBodyCell>
        <TableBodyCell>
          <Button href={route('/recipes/', recipe.id, '/update')} size="xs" color="light" aria-label="Editar {recipe.name}">Editar</Button>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>