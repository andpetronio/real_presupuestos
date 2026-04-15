<script lang="ts">
  import { resolve } from '$app/paths';
  import {
    Alert,
    Button,
    Card,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell
  } from 'flowbite-svelte';
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

  type PageData = {
    recipes: ReadonlyArray<RecipeRow>;
    tableState: 'idle' | 'success' | 'error' | 'empty';
    tableMessage: { title: string; detail: string } | null;
  };

  let { data }: { data: PageData } = $props();

  const newRecipePath = route('/recipes/new');
  </script>

<div class="mb-4 flex justify-end">
  <Button href={newRecipePath} color="blue">Nueva receta</Button>
</div>

{#if data.tableState === 'error'}
  <Alert color="red">{data.tableMessage?.detail ?? 'No pudimos cargar recetas.'}</Alert>
{:else if data.tableState === 'empty'}
  <Alert color="blue">{data.tableMessage?.detail ?? 'Todavía no hay recetas.'}</Alert>
{:else}
  <Card size="xl" class="w-full shadow-sm">
    <div class="overflow-x-auto">
      <Table hoverable striped>
        <TableHead>
          <TableHeadCell>Receta</TableHeadCell>
          <TableHeadCell>Perro</TableHeadCell>
          <TableHeadCell>Notas</TableHeadCell>
          <TableHeadCell>Estado</TableHeadCell>
          <TableHeadCell>Acciones</TableHeadCell>
        </TableHead>
        <TableBody>
          {#each data.recipes as recipe (recipe.id)}
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
    </div>
  </Card>
{/if}
