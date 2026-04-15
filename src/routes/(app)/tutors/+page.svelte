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

  type TutorRow = {
    id: string;
    full_name: string;
    whatsapp_number: string;
    notes: string | null;
    created_at: string;
  };

  type PageData = {
    tutors: ReadonlyArray<TutorRow>;
    tableState: 'idle' | 'success' | 'error' | 'empty';
    tableMessage: { title: string; detail: string } | null;
  };

  let { data }: { data: PageData } = $props();

  const newTutorPath = route('/tutors/new');
  </script>

<div class="mb-4 flex justify-end">
  <Button href={newTutorPath} color="blue">Nuevo tutor</Button>
</div>

{#if data.tableState === 'error'}
  <Alert color="red">{data.tableMessage?.detail ?? 'No pudimos cargar tutores.'}</Alert>
{:else if data.tableState === 'empty'}
  <Alert color="blue">{data.tableMessage?.detail ?? 'Todavía no hay tutores.'}</Alert>
{:else}
  <Card size="xl" class="w-full shadow-sm">
    <div class="overflow-x-auto">
      <Table hoverable striped>
        <TableHead>
          <TableHeadCell>Nombre</TableHeadCell>
          <TableHeadCell>WhatsApp</TableHeadCell>
          <TableHeadCell>Notas</TableHeadCell>
          <TableHeadCell>Acciones</TableHeadCell>
        </TableHead>
        <TableBody>
          {#each data.tutors as tutor (tutor.id)}
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
    </div>
  </Card>
{/if}
