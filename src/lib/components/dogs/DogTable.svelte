<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Button, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
  import ActiveStatusBadge from '$lib/components/admin/ActiveStatusBadge.svelte';
  import { route } from '$lib/shared/navigation';
  import { closeBlockingLoader, confirmAlert, presentActionFeedback, showBlockingLoader } from '$lib/shared/alerts';

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

  const enhanceDelete = () => {
    return async ({ cancel }: { cancel: () => void }) => {
      const confirmed = await confirmAlert({
        title: 'Desactivar perro',
        text: 'El perro quedara inactivo para nuevos presupuestos.',
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
          <ActiveStatusBadge isActive={dog.is_active} />
        </TableBodyCell>
        <TableBodyCell>
          <div class="flex items-center gap-2">
            <Button href={route('/dogs/', dog.id, '/history')} size="xs" color="light" aria-label="Ver {dog.name}">Ver</Button>
            <Button href={route('/dogs/', dog.id, '/update')} size="xs" color="light" aria-label="Editar {dog.name}">Editar</Button>
            {#if dog.is_active}
              <form method="POST" action="?/delete" use:enhance={enhanceDelete()}>
                <input type="hidden" name="dogId" value={dog.id} />
                <Button type="submit" size="xs" color="red" aria-label="Desactivar {dog.name}">Desactivar</Button>
              </form>
            {/if}
          </div>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
