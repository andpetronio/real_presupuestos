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

  type VeterinaryRow = {
    id: string;
    name: string;
    created_at: string;
  };

  type PageData = {
    veterinaries: ReadonlyArray<VeterinaryRow>;
    tableState: 'idle' | 'success' | 'error' | 'empty';
    tableMessage: { title: string; detail: string } | null;
  };

  let { data }: { data: PageData } = $props();

  const newVeterinaryPath = route('/veterinaries/new');
  </script>

<div class="mb-4 flex justify-end">
  <Button href={newVeterinaryPath} color="blue">Nueva veterinaria</Button>
</div>

{#if data.tableState === 'error'}
  <Alert color="red">{data.tableMessage?.detail ?? 'No pudimos cargar veterinarias.'}</Alert>
{:else if data.tableState === 'empty'}
  <Alert color="blue">{data.tableMessage?.detail ?? 'Todavía no hay veterinarias.'}</Alert>
{:else}
  <Card size="xl" class="w-full shadow-sm">
    <div class="overflow-x-auto">
      <Table hoverable striped>
        <TableHead>
          <TableHeadCell>Nombre</TableHeadCell>
          <TableHeadCell>Acciones</TableHeadCell>
        </TableHead>
        <TableBody>
          {#each data.veterinaries as veterinary (veterinary.id)}
            <TableBodyRow>
              <TableBodyCell>{veterinary.name}</TableBodyCell>
              <TableBodyCell>
                <Button href={route('/veterinaries/', veterinary.id, '/update')} size="xs" color="light" aria-label="Editar {veterinary.name}">Editar</Button>
              </TableBodyCell>
            </TableBodyRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  </Card>
{/if}
