<script lang="ts">
  import { Button, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
  import { route } from '$lib/shared/navigation';

  type DogRow = {
    id: string;
    name: string;
    diet_type: 'mixta' | 'cocida' | 'barf';
    meals_per_day: number;
    is_active: boolean;
    tutor: { full_name: string } | null;
    veterinary: { name: string } | null;
  };

  type DogTableProps = {
    dogs: ReadonlyArray<DogRow>;
  };

  let { dogs }: DogTableProps = $props();
</script>

<Table hoverable striped aria-label="Tabla de perros">
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
    {#each dogs as dog (dog.id)}
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
          </div>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>