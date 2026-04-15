<script lang="ts">
  import { resolve } from '$app/paths';

import { route } from '$lib/shared/navigation';  import {
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

  type DogRow = {
    id: string;
    name: string;
    diet_type: 'mixta' | 'cocida' | 'barf';
    meals_per_day: number;
    is_active: boolean;
    tutor: { full_name: string } | null;
    veterinary: { name: string } | null;
  };

  type PageData = {
    dogs: ReadonlyArray<DogRow>;
    tableState: 'idle' | 'success' | 'error' | 'empty';
    tableMessage: { title: string; detail: string } | null;
  };

  type ActionData = {
    actionType?: 'delete';
    operatorError?: string;
    operatorSuccess?: string;
  };

  let { data, form }: { data: PageData; form: ActionData | null } = $props();
  const newDogPath = route('/dogs/new');
  </script>

<div class="mb-4 flex justify-end">
  <Button href={newDogPath} color="primary">Nuevo perro</Button>
</div>

{#if form?.operatorError}
  <Alert color="red" class="mb-4">{form.operatorError}</Alert>
{:else if form?.operatorSuccess}
  <Alert color="green" class="mb-4">{form.operatorSuccess}</Alert>
{/if}

{#if data.tableState === 'error'}
  <Alert color="red">{data.tableMessage?.detail ?? 'No pudimos cargar perros.'}</Alert>
{:else if data.tableState === 'empty'}
  <Alert color="blue">{data.tableMessage?.detail ?? 'Todavía no hay perros.'}</Alert>
{:else}
  <Card size="xl" class="w-full shadow-sm">
    <div class="overflow-x-auto">
      <Table hoverable striped>
        <TableHead>
          <TableHeadCell>Nombre</TableHeadCell>
          <TableHeadCell>Tutor</TableHeadCell>
          <TableHeadCell>Veterinaria</TableHeadCell>
          <TableHeadCell>Tipo dieta</TableHeadCell>
          <TableHeadCell>Comidas/día</TableHeadCell>
          <TableHeadCell>Estado</TableHeadCell>
          <TableHeadCell>Acciones</TableHeadCell>
        </TableHead>
        <TableBody>
          {#each data.dogs as dog (dog.id)}
            <TableBodyRow>
              <TableBodyCell>{dog.name}</TableBodyCell>
              <TableBodyCell>{dog.tutor?.full_name ?? 'Sin tutor'}</TableBodyCell>
              <TableBodyCell>{dog.veterinary?.name ?? 'Sin veterinaria'}</TableBodyCell>
              <TableBodyCell>{dog.diet_type.toUpperCase()}</TableBodyCell>
              <TableBodyCell>{dog.meals_per_day}</TableBodyCell>
              <TableBodyCell>
                <span class={dog.is_active ? 'rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700' : 'rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600'}>
                  {dog.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </TableBodyCell>
              <TableBodyCell>
                <div class="flex items-center gap-2">
                  <Button href={route('/dogs/', dog.id, '/update')} size="xs" color="light" aria-label="Editar {dog.name}">Editar</Button>
                  {#if dog.is_active}
                    <form
                      method="POST"
                      action="?/delete"
                      onsubmit={(event) => {
                        if (!confirm('¿Desactivar este perro?')) event.preventDefault();
                      }}
                    >
                      <input type="hidden" name="dogId" value={dog.id} />
                      <Button type="submit" size="xs" color="red" aria-label="Desactivar {dog.name}">Eliminar</Button>
                    </form>
                  {/if}
                </div>
              </TableBodyCell>
            </TableBodyRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  </Card>
{/if}
