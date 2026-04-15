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
  import { formatArs, formatQuantity } from '$lib/shared/currency';

import { route } from '$lib/shared/navigation';
  type RawMaterialRow = {
    id: string;
    name: string;
    base_unit: string;
    purchase_quantity: number;
    base_cost: number;
    wastage_percentage: number;
    cost_with_wastage: number;
    is_active: boolean;
  };

  type PageData = {
    rawMaterials: ReadonlyArray<RawMaterialRow>;
    tableState: 'idle' | 'success' | 'error' | 'empty';
    tableMessage: { title: string; detail: string } | null;
  };

  let { data }: { data: PageData } = $props();

  const newRawMaterialPath = route('/raw-materials/new');
  </script>

<div class="mb-4 flex justify-end">
  <Button href={newRawMaterialPath} color="blue">Nueva materia prima</Button>
</div>

{#if data.tableState === 'error'}
  <Alert color="red">{data.tableMessage?.detail ?? 'No pudimos cargar materias primas.'}</Alert>
{:else if data.tableState === 'empty'}
  <Alert color="blue">{data.tableMessage?.detail ?? 'Todavía no hay materias primas.'}</Alert>
{:else}
  <Card size="xl" class="w-full shadow-sm">
    <div class="overflow-x-auto">
      <Table hoverable striped>
        <TableHead>
          <TableHeadCell>Nombre</TableHeadCell>
          <TableHeadCell>Unidad base</TableHeadCell>
          <TableHeadCell>Cantidad comprada</TableHeadCell>
          <TableHeadCell>Costo base</TableHeadCell>
          <TableHeadCell>% Merma</TableHeadCell>
          <TableHeadCell>Costo con merma</TableHeadCell>
          <TableHeadCell>Estado</TableHeadCell>
          <TableHeadCell>Acciones</TableHeadCell>
        </TableHead>
        <TableBody>
          {#each data.rawMaterials as material (material.id)}
            <TableBodyRow>
              <TableBodyCell>{material.name}</TableBodyCell>
              <TableBodyCell>{material.base_unit}</TableBodyCell>
              <TableBodyCell>{formatQuantity(material.purchase_quantity)} {material.base_unit}</TableBodyCell>
              <TableBodyCell>{formatArs(material.base_cost)}</TableBodyCell>
              <TableBodyCell>{material.wastage_percentage.toFixed(2)}%</TableBodyCell>
              <TableBodyCell>{formatArs(material.cost_with_wastage)}</TableBodyCell>
              <TableBodyCell>
                <StatusBadge
                  status={material.is_active ? 'accepted' : 'rejected'}
                  label={material.is_active ? 'Activa' : 'Inactiva'}
                />
              </TableBodyCell>
              <TableBodyCell>
                <Button href={route('/raw-materials/', material.id, '/update')} size="xs" color="light" aria-label="Editar {material.name}">Editar</Button>
              </TableBodyCell>
            </TableBodyRow>
          {/each}
        </TableBody>
      </Table>
    </div>
  </Card>
{/if}
