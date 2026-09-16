<script lang="ts">
  import { TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
  import DataTable from '$lib/components/admin/DataTable.svelte';
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

<div class="hidden lg:block" aria-label="Tabla de presupuestos">
  <DataTable ariaLabel="Tabla de presupuestos" scrollable={false}>
    <TableHead>
      <TableHeadCell class="bg-gray-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <SortableHeader
          label="Tutor"
          href={buildSortHref('tutor')}
          active={sortBy === 'tutor'}
          dir={sortDir}
        />
      </TableHeadCell>
      <TableHeadCell class="bg-gray-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <SortableHeader
          label="Estado"
          href={buildSortHref('status')}
          active={sortBy === 'status'}
          dir={sortDir}
        />
      </TableHeadCell>
      <TableHeadCell class="bg-gray-50 px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Ingredientes</TableHeadCell>
      <TableHeadCell class="bg-gray-50 px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Operativos</TableHeadCell>
      <TableHeadCell class="bg-gray-50 px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
        <SortableHeader
          label="Costo total"
          href={buildSortHref('total_cost')}
          active={sortBy === 'total_cost'}
          dir={sortDir}
        />
      </TableHeadCell>
      <TableHeadCell class="bg-gray-50 px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
        <SortableHeader
          label="Precio venta"
          href={buildSortHref('final_sale_price')}
          active={sortBy === 'final_sale_price'}
          dir={sortDir}
        />
      </TableHeadCell>
      <TableHeadCell class="bg-gray-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <SortableHeader
          label="Vence"
          href={buildSortHref('expires_at')}
          active={sortBy === 'expires_at'}
          dir={sortDir}
        />
      </TableHeadCell>
      <TableHeadCell class="bg-gray-50 px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Acciones</TableHeadCell>
    </TableHead>
    <TableBody>
      {#each budgets as budget (budget.id)}
        <TableBodyRow class="border-gray-100 bg-white hover:bg-gray-50">
          <TableBodyCell class="px-4 py-2.5 font-medium text-gray-900">
            {budget.tutor?.full_name ?? 'Sin tutor'}
          </TableBodyCell>
          <TableBodyCell class="px-4 py-2.5">
            <StatusBadge status={budget.status} />
          </TableBodyCell>
          <TableBodyCell class="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">{formatArs(budget.ingredient_total_global)}</TableBodyCell>
          <TableBodyCell class="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">{formatArs(budget.operational_total_global)}</TableBodyCell>
          <TableBodyCell class="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">{formatArs(budget.total_cost)}</TableBodyCell>
          <TableBodyCell class="whitespace-nowrap px-4 py-2.5 text-right font-semibold text-gray-900 tabular-nums">
            {formatArs(budget.final_sale_price)}
          </TableBodyCell>
          <TableBodyCell class="whitespace-nowrap px-4 py-2.5">{formatDate(budget.expires_at)}</TableBodyCell>
          <TableBodyCell class="px-4 py-2.5 text-right">
            <BudgetActionsMenu {budget} renderContext="table" />
          </TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </DataTable>
</div>
