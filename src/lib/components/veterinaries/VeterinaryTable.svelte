<script lang="ts">
  import { Button, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
  import SortableHeader from '$lib/components/admin/SortableHeader.svelte';
  import { route } from '$lib/shared/navigation';

  type VeterinaryRow = {
    id: string;
    name: string;
    created_at: string;
  };

  type VeterinaryTableProps = {
    veterinaries: ReadonlyArray<VeterinaryRow>;
    sortBy: 'name';
    sortDir: 'asc' | 'desc';
    buildSortHref: (field: 'name') => string;
  };

  let { veterinaries, sortBy, sortDir, buildSortHref }: VeterinaryTableProps = $props();
</script>

<Table hoverable striped aria-label="Tabla de veterinarias">
  <TableHead>
    <TableHeadCell>
      <SortableHeader
        label="Nombre"
        href={buildSortHref('name')}
        active={sortBy === 'name'}
        dir={sortDir}
      />
    </TableHeadCell>
    <TableHeadCell>Acciones</TableHeadCell>
  </TableHead>
  <TableBody>
    {#each veterinaries as veterinary (veterinary.id)}
      <TableBodyRow>
        <TableBodyCell>{veterinary.name}</TableBodyCell>
        <TableBodyCell>
          <Button href={route('/veterinaries/', veterinary.id, '/update')} size="xs" color="light" aria-label="Editar {veterinary.name}">Editar</Button>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
