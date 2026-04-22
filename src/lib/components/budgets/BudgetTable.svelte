<script lang="ts">
  import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
  import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
  import SortableHeader from '$lib/components/admin/SortableHeader.svelte';
  import type { BudgetStatus } from '$lib/types/budget';
  import { formatArs } from '$lib/shared/currency';
  import BudgetActionsMenu from './BudgetActionsMenu.svelte';

  type BudgetRow = {
    id: string;
    status: BudgetStatus;
    tutor: { full_name: string } | null;
    ingredient_total_global: number;
    operational_total_global: number;
    total_cost: number;
    final_sale_price: number;
    expires_at: string | null;
  };

  type BudgetTableProps = {
    budgets: ReadonlyArray<BudgetRow>;
    formatDate: (date: string | null) => string;
    sortBy: 'tutor' | 'status' | 'total_cost' | 'final_sale_price' | 'expires_at';
    sortDir: 'asc' | 'desc';
    buildSortHref: (
      field: 'tutor' | 'status' | 'total_cost' | 'final_sale_price' | 'expires_at',
    ) => string;
  };

  let { budgets, formatDate, sortBy, sortDir, buildSortHref }: BudgetTableProps = $props();
</script>

<div class="hidden overflow-x-auto md:block" aria-label="Tabla de presupuestos">
  <Table hoverable striped>
    <TableHead>
      <TableHeadCell>
        <SortableHeader
          label="Tutor"
          href={buildSortHref('tutor')}
          active={sortBy === 'tutor'}
          dir={sortDir}
        />
      </TableHeadCell>
      <TableHeadCell>
        <SortableHeader
          label="Estado"
          href={buildSortHref('status')}
          active={sortBy === 'status'}
          dir={sortDir}
        />
      </TableHeadCell>
      <TableHeadCell class="text-right">Ingredientes</TableHeadCell>
      <TableHeadCell class="text-right">Operativos</TableHeadCell>
      <TableHeadCell class="text-right">
        <SortableHeader
          label="Costo total"
          href={buildSortHref('total_cost')}
          active={sortBy === 'total_cost'}
          dir={sortDir}
        />
      </TableHeadCell>
      <TableHeadCell class="text-right">
        <SortableHeader
          label="Precio venta"
          href={buildSortHref('final_sale_price')}
          active={sortBy === 'final_sale_price'}
          dir={sortDir}
        />
      </TableHeadCell>
      <TableHeadCell>
        <SortableHeader
          label="Vence"
          href={buildSortHref('expires_at')}
          active={sortBy === 'expires_at'}
          dir={sortDir}
        />
      </TableHeadCell>
      <TableHeadCell>Acciones</TableHeadCell>
    </TableHead>
    <TableBody>
      {#each budgets as budget (budget.id)}
        <TableBodyRow>
          <TableBodyCell class="font-medium text-gray-900">
            {budget.tutor?.full_name ?? 'Sin tutor'}
          </TableBodyCell>
          <TableBodyCell>
            <StatusBadge status={budget.status} />
          </TableBodyCell>
          <TableBodyCell class="text-right">{formatArs(budget.ingredient_total_global)}</TableBodyCell>
          <TableBodyCell class="text-right">{formatArs(budget.operational_total_global)}</TableBodyCell>
          <TableBodyCell class="text-right">{formatArs(budget.total_cost)}</TableBodyCell>
          <TableBodyCell class="text-right font-semibold text-gray-900">
            {formatArs(budget.final_sale_price)}
          </TableBodyCell>
          <TableBodyCell>{formatDate(budget.expires_at)}</TableBodyCell>
          <TableBodyCell>
            <BudgetActionsMenu {budget} />
          </TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</div>
