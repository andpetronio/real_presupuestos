<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Button, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
  import ActiveStatusBadge from '$lib/components/admin/ActiveStatusBadge.svelte';
  import SortableHeader from '$lib/components/admin/SortableHeader.svelte';
  import { route } from '$lib/shared/navigation';
  import { closeBlockingLoader, confirmAlert, presentActionFeedback, showBlockingLoader } from '$lib/shared/alerts';

  type TutorRow = {
    id: string;
    full_name: string;
    whatsapp_number: string;
    notes: string | null;
    is_active: boolean;
    created_at: string;
  };

  type TutorTableProps = {
    tutors: ReadonlyArray<TutorRow>;
    sortBy: 'full_name' | 'whatsapp_number' | 'is_active';
    sortDir: 'asc' | 'desc';
    buildSortHref: (field: 'full_name' | 'whatsapp_number' | 'is_active') => string;
  };

  let { tutors, sortBy, sortDir, buildSortHref }: TutorTableProps = $props();

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

<Table hoverable striped aria-label="Tabla de tutores">
  <TableHead>
    <TableHeadCell>
      <SortableHeader
        label="Nombre"
        href={buildSortHref('full_name')}
        active={sortBy === 'full_name'}
        dir={sortDir}
      />
    </TableHeadCell>
    <TableHeadCell>
      <SortableHeader
        label="WhatsApp"
        href={buildSortHref('whatsapp_number')}
        active={sortBy === 'whatsapp_number'}
        dir={sortDir}
      />
    </TableHeadCell>
    <TableHeadCell>Notas</TableHeadCell>
    <TableHeadCell>
      <SortableHeader
        label="Estado"
        href={buildSortHref('is_active')}
        active={sortBy === 'is_active'}
        dir={sortDir}
      />
    </TableHeadCell>
    <TableHeadCell>Acciones</TableHeadCell>
  </TableHead>
  <TableBody>
    {#each tutors as tutor (tutor.id)}
      <TableBodyRow>
        <TableBodyCell>{tutor.full_name}</TableBodyCell>
        <TableBodyCell>{tutor.whatsapp_number}</TableBodyCell>
        <TableBodyCell>{tutor.notes ?? '—'}</TableBodyCell>
        <TableBodyCell>
          <ActiveStatusBadge isActive={tutor.is_active} />
        </TableBodyCell>
        <TableBodyCell>
          <div class="flex items-center gap-2">
            <Button href={route('/tutors/', tutor.id, '/update')} size="xs" color="light" aria-label="Editar {tutor.full_name}">Editar</Button>
            {#if tutor.is_active}
              <form method="POST" action="?/delete" use:enhance={enhanceStatusAction({
                title: 'Desactivar tutor',
                text: 'Esto desactivara tambien todos sus perros y recetas.',
                confirmButtonText: 'Si, desactivar'
              })}>
                <input type="hidden" name="tutorId" value={tutor.id} />
                <Button type="submit" size="xs" color="red" aria-label="Desactivar {tutor.full_name}">Desactivar</Button>
              </form>
            {:else}
              <form method="POST" action="?/restore" use:enhance={enhanceStatusAction({
                title: 'Restaurar tutor',
                text: 'Esto reactivara en cascada todos sus perros y recetas.',
                confirmButtonText: 'Si, restaurar'
              })}>
                <input type="hidden" name="tutorId" value={tutor.id} />
                <Button type="submit" size="xs" color="blue" aria-label="Restaurar {tutor.full_name}">Restaurar</Button>
              </form>
            {/if}
          </div>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
