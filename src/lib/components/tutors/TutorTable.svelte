<script lang="ts">
  import { Button, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
  import { route } from '$lib/shared/navigation';

  type TutorRow = {
    id: string;
    full_name: string;
    whatsapp_number: string;
    notes: string | null;
    created_at: string;
  };

  type TutorTableProps = {
    tutors: ReadonlyArray<TutorRow>;
  };

  let { tutors }: TutorTableProps = $props();
</script>

<Table hoverable striped aria-label="Tabla de tutores">
  <TableHead>
    <TableHeadCell>Nombre</TableHeadCell>
    <TableHeadCell>WhatsApp</TableHeadCell>
    <TableHeadCell>Notas</TableHeadCell>
    <TableHeadCell>Acciones</TableHeadCell>
  </TableHead>
  <TableBody>
    {#each tutors as tutor (tutor.id)}
      <TableBodyRow>
        <TableBodyCell>{tutor.full_name}</TableBodyCell>
        <TableBodyCell>{tutor.whatsapp_number}</TableBodyCell>
        <TableBodyCell>{tutor.notes ?? '—'}</TableBodyCell>
        <TableBodyCell>
          <Button href={route('/tutors/', tutor.id, '/update')} size="xs" color="light" aria-label="Editar {tutor.full_name}">Editar</Button>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>