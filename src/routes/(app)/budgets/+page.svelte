<script lang="ts">
  import { resolve } from '$app/paths';
  import {
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
  import FeedbackBanner from '$lib/components/FeedbackBanner.svelte';
  import type { BudgetStatus } from '$lib/types/budget';
  import { formatArs } from '$lib/shared/currency';

import { route } from '$lib/shared/navigation';
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

  type PageData = {
    budgets: ReadonlyArray<BudgetRow>;
    tableState: 'idle' | 'success' | 'error' | 'empty';
    tableMessage: { title: string; detail: string } | null;
  };

  type ActionData = {
    actionType?: 'sendWhatsapp' | 'delete' | 'undoSent';
    operatorError?: string;
    operatorSuccess?: string;
  };

  let { data, form }: { data: PageData; form: ActionData | null } = $props();

  const budgetsPath = route('/budgets');
  const newBudgetPath = route('/budgets/new');
  
  const formatDate = (value: string | null): string => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-AR');
  };

  const feedbackMessage = $derived(form?.operatorError ?? form?.operatorSuccess ?? '');
  const feedbackColor = $derived(form?.operatorError ? 'red' : 'green');
</script>

<div class="mb-4 flex justify-end">
  <Button href={newBudgetPath} color="blue">Nuevo presupuesto</Button>
</div>

{#if feedbackMessage}
  <FeedbackBanner message={feedbackMessage} color={feedbackColor} />
{/if}

{#if data.tableState === 'error'}
  <FeedbackBanner message={data.tableMessage?.detail ?? 'No pudimos cargar presupuestos.'} color="red" />
{:else if data.tableState === 'empty'}
  <FeedbackBanner message={data.tableMessage?.detail ?? 'Todavía no hay presupuestos.'} color="blue" />
{:else}
  <Card size="xl" class="w-full shadow-sm">
    <div class="overflow-x-auto">
      <Table hoverable striped>
        <TableHead>
          <TableHeadCell>Tutor</TableHeadCell>
          <TableHeadCell>Estado</TableHeadCell>
          <TableHeadCell>Ingredientes</TableHeadCell>
          <TableHeadCell>Operativos</TableHeadCell>
          <TableHeadCell>Costo total</TableHeadCell>
          <TableHeadCell>Precio venta</TableHeadCell>
          <TableHeadCell>Vence</TableHeadCell>
          <TableHeadCell>Acciones</TableHeadCell>
        </TableHead>
        <TableBody>
          {#each data.budgets as budget (budget.id)}
            <TableBodyRow>
              <TableBodyCell>{budget.tutor?.full_name ?? 'Sin tutor'}</TableBodyCell>
              <TableBodyCell><StatusBadge status={budget.status} /></TableBodyCell>
              <TableBodyCell>{formatArs(budget.ingredient_total_global)}</TableBodyCell>
              <TableBodyCell>{formatArs(budget.operational_total_global)}</TableBodyCell>
              <TableBodyCell>{formatArs(budget.total_cost)}</TableBodyCell>
              <TableBodyCell>{formatArs(budget.final_sale_price)}</TableBodyCell>
              <TableBodyCell>{formatDate(budget.expires_at)}</TableBodyCell>
              <TableBodyCell>
                <div class="flex items-center gap-2 whitespace-nowrap">
                  <Button href={route('/budgets/', budget.id, '/preview')} size="xs" color="light" aria-label="Ver presupuesto">Ver</Button>
                  {#if budget.status === 'draft' || budget.status === 'ready_to_send'}
                    <Button href={route('/budgets/', budget.id, '/update')} size="xs" color="light" aria-label="Editar presupuesto">Editar</Button>
                    <form
                      method="POST"
                      action="?/delete"
                      onsubmit={(event) => {
                        if (!confirm('¿Eliminar este presupuesto?')) event.preventDefault();
                      }}
                    >
                      <input type="hidden" name="budgetId" value={budget.id} />
                      <Button type="submit" size="xs" color="red" aria-label="Eliminar presupuesto">Eliminar</Button>
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
  </Card>
{/if}
