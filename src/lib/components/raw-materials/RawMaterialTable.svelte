<script lang="ts">
  import { Button, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
  import ActiveStatusBadge from '$lib/components/admin/ActiveStatusBadge.svelte';
  import SortableHeader from '$lib/components/admin/SortableHeader.svelte';
  import { formatArs } from '$lib/shared/currency';
  import { route } from '$lib/shared/navigation';

  const formatQuantity = (value: number): string => {
    return new Intl.NumberFormat('es-AR').format(value);
  };

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

  type RawMaterialTableProps = {
    rawMaterials: ReadonlyArray<RawMaterialRow>;
    sortBy: 'name' | 'base_unit' | 'cost_with_wastage' | 'is_active';
    sortDir: 'asc' | 'desc';
    buildSortHref: (
      field: 'name' | 'base_unit' | 'cost_with_wastage' | 'is_active',
    ) => string;
  };

  let { rawMaterials, sortBy, sortDir, buildSortHref }: RawMaterialTableProps = $props();
</script>

<Table hoverable striped aria-label="Tabla de materias primas">
  <TableHead>
    <TableHeadCell>
      <SortableHeader
        label="Nombre"
        href={buildSortHref('name')}
        active={sortBy === 'name'}
        dir={sortDir}
      />
    </TableHeadCell>
    <TableHeadCell>
      <SortableHeader
        label="Unidad base"
        href={buildSortHref('base_unit')}
        active={sortBy === 'base_unit'}
        dir={sortDir}
      />
    </TableHeadCell>
    <TableHeadCell>Cantidad comprada</TableHeadCell>
    <TableHeadCell>Costo base</TableHeadCell>
    <TableHeadCell>% Merma</TableHeadCell>
    <TableHeadCell>
      <SortableHeader
        label="Costo con merma"
        href={buildSortHref('cost_with_wastage')}
        active={sortBy === 'cost_with_wastage'}
        dir={sortDir}
      />
    </TableHeadCell>
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
    {#each rawMaterials as material (material.id)}
      <TableBodyRow>
        <TableBodyCell>{material.name}</TableBodyCell>
        <TableBodyCell>{material.base_unit}</TableBodyCell>
        <TableBodyCell>{formatQuantity(material.purchase_quantity)} {material.base_unit}</TableBodyCell>
        <TableBodyCell>{formatArs(material.base_cost)}</TableBodyCell>
        <TableBodyCell>{material.wastage_percentage.toFixed(2)}%</TableBodyCell>
        <TableBodyCell>{formatArs(material.cost_with_wastage)}</TableBodyCell>
        <TableBodyCell>
          <ActiveStatusBadge
            isActive={material.is_active}
            activeLabel="Activa"
            inactiveLabel="Inactiva"
          />
        </TableBodyCell>
        <TableBodyCell>
          <Button href={route('/raw-materials/', material.id, '/update')} size="xs" color="light" aria-label="Editar {material.name}">Editar</Button>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
