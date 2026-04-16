<script lang="ts">
  import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
  import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
  import type { BudgetStatus } from '$lib/types/budget';
  import { formatArs } from '$lib/shared/currency';
  import { route } from '$lib/shared/navigation';
  import { Button } from 'flowbite-svelte';

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
  };

  let { budgets, formatDate }: BudgetTableProps = $props();
</script>

<div class="hidden overflow-x-auto md:block" aria-label="Tabla de presupuestos">
  <Table hoverable striped>
    <TableHead>
      <TableHeadCell>Tutor</TableHeadCell>
      <TableHeadCell>Estado</TableHeadCell>
      <TableHeadCell class="text-right">Ingredientes</TableHeadCell>
      <TableHeadCell class="text-right">Operativos</TableHeadCell>
      <TableHeadCell class="text-right">Costo total</TableHeadCell>
      <TableHeadCell class="text-right">Precio venta</TableHeadCell>
      <TableHeadCell>Vence</TableHeadCell>
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
            <div class="flex items-center gap-2 whitespace-nowrap">
              <Button
                href={route('/budgets/', budget.id, '/preview')}
                size="xs"
                color="light"
                aria-label="Ver presupuesto"
              >
                Ver
              </Button>
              {#if budget.status === 'accepted'}
                <Button href={route('/seguimiento/', budget.id)} size="xs" color="light">
                  Seguimiento
                </Button>
              {/if}
              {#if budget.status === 'draft' || budget.status === 'ready_to_send'}
                <Button
                  href={route('/budgets/', budget.id, '/update')}
                  size="xs"
                  color="light"
                  aria-label="Editar presupuesto"
                >
                  Editar
                </Button>
                <form
                  method="POST"
                  action="?/delete"
                  onsubmit={(event) => {
                    if (!confirm('¿Eliminar este presupuesto?')) event.preventDefault();
                  }}
                >
                  <input type="hidden" name="budgetId" value={budget.id} />
                  <Button type="submit" size="xs" color="red" aria-label="Eliminar presupuesto">
                    Eliminar
                  </Button>
                </form>
              {:else if budget.status === 'sent'}
                <form
                  method="POST"
                  action="?/undoSent"
                  onsubmit={(event) => {
                    if (!confirm('¿Reabrir este presupuesto? Volverá a borrador.')) event.preventDefault();
                  }}
                >
                  <input type="hidden" name="budgetId" value={budget.id} />
                  <Button type="submit" size="xs" color="light">Reabrir</Button>
                </form>
              {/if}
            </div>
          </TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</div>
