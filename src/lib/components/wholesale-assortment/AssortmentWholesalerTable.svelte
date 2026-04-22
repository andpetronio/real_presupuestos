<script lang="ts">
  import { Button, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
  import ActiveStatusBadge from '$lib/components/admin/ActiveStatusBadge.svelte';
  import { route } from '$lib/shared/navigation';
  import type { AssortmentWholesalerRow } from '$lib/types/view-models/wholesale-assortment';

  type Props = { wholesalers: ReadonlyArray<AssortmentWholesalerRow> };
  let { wholesalers }: Props = $props();
</script>

<Table hoverable striped aria-label="Tabla de surtido por mayorista">
  <TableHead>
    <TableHeadCell>Nombre</TableHeadCell>
    <TableHeadCell>Código</TableHeadCell>
    <TableHeadCell>Mínimo</TableHeadCell>
    <TableHeadCell>Estado</TableHeadCell>
    <TableHeadCell>Productos habilitados</TableHeadCell>
    <TableHeadCell>Acciones</TableHeadCell>
  </TableHead>
  <TableBody>
    {#each wholesalers as wholesaler (wholesaler.id)}
      <TableBodyRow>
        <TableBodyCell>{wholesaler.name}</TableBodyCell>
        <TableBodyCell class="font-mono text-xs">{wholesaler.unique_random_code}</TableBodyCell>
        <TableBodyCell>{wholesaler.min_total_units}</TableBodyCell>
        <TableBodyCell>
          <ActiveStatusBadge isActive={wholesaler.is_active} />
        </TableBodyCell>
        <TableBodyCell>{wholesaler.enabledProductsCount}</TableBodyCell>
        <TableBodyCell>
          <Button href={route('/mayorista-assortment/', wholesaler.id)} size="xs" color="light">Gestionar productos</Button>
        </TableBodyCell>
      </TableBodyRow>
    {/each}
  </TableBody>
</Table>
