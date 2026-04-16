<script lang="ts">
  import { Button, Card, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Badge } from 'flowbite-svelte';
  import FeedbackBanner from '$lib/components/FeedbackBanner.svelte';
  import { formatArs } from '$lib/shared/currency';
  import { route } from '$lib/shared/navigation';

  type TrackingRow = {
    id: string;
    tutorName: string;
    acceptedAt: string | null;
    viewedAt: string | null;
    total: number;
    paid: number;
    pending: number;
  };

  type PageData = {
    state: 'success' | 'empty' | 'error';
    message: { title: string; detail?: string } | null;
    trackingRows: ReadonlyArray<TrackingRow>;
  };

  let { data }: { data: PageData } = $props();

  const formatDate = (value: string | null): string => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-AR');
  };
</script>

{#if data.state === 'error'}
  <FeedbackBanner message={data.message?.detail ?? 'No pudimos cargar seguimiento.'} color="red" />
{:else if data.state === 'empty'}
  <FeedbackBanner message={data.message?.detail ?? 'Todavía no hay presupuestos aceptados.'} color="blue" />
{:else}
  <Card size="xl" class="w-full shadow-sm p-0">
    <div class="hidden overflow-x-auto md:block" aria-label="Tabla de seguimiento de presupuestos aceptados">
      <Table hoverable striped>
        <TableHead>
          <TableHeadCell>Tutor</TableHeadCell>
          <TableHeadCell>Estado</TableHeadCell>
          <TableHeadCell>Aceptado</TableHeadCell>
          <TableHeadCell class="text-right">Total</TableHeadCell>
          <TableHeadCell class="text-right">Cobrado</TableHeadCell>
          <TableHeadCell class="text-right">Saldo</TableHeadCell>
          <TableHeadCell>Acciones</TableHeadCell>
        </TableHead>
        <TableBody>
          {#each data.trackingRows as budget (budget.id)}
            <TableBodyRow>
              <TableBodyCell class="font-medium text-gray-900">{budget.tutorName}</TableBodyCell>
              <TableBodyCell>
                {#if budget.viewedAt}
                  <Badge color="green">Visto</Badge>
                {:else}
                  <Badge color="yellow">Nuevo</Badge>
                {/if}
              </TableBodyCell>
              <TableBodyCell>{formatDate(budget.acceptedAt)}</TableBodyCell>
              <TableBodyCell class="text-right">{formatArs(budget.total)}</TableBodyCell>
              <TableBodyCell class="text-right">{formatArs(budget.paid)}</TableBodyCell>
              <TableBodyCell class="text-right font-semibold">{formatArs(budget.pending)}</TableBodyCell>
              <TableBodyCell>
                <Button href={route('/seguimiento/', budget.id)} size="xs" color="light">Ver seguimiento</Button>
              </TableBodyCell>
            </TableBodyRow>
          {/each}
        </TableBody>
      </Table>
    </div>

    <div class="grid gap-3 p-4 md:hidden">
      {#each data.trackingRows as budget (budget.id)}
        <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-semibold text-gray-900">{budget.tutorName}</p>
              <p class="text-xs text-gray-500">Aceptado: {formatDate(budget.acceptedAt)}</p>
            </div>
            {#if budget.viewedAt}
              <Badge color="green">Visto</Badge>
            {:else}
              <Badge color="yellow">Nuevo</Badge>
            {/if}
          </div>

          <div class="mt-3 grid grid-cols-3 gap-2 text-sm">
            <div><p class="text-gray-500">Total</p><p class="font-medium">{formatArs(budget.total)}</p></div>
            <div><p class="text-gray-500">Cobrado</p><p class="font-medium">{formatArs(budget.paid)}</p></div>
            <div><p class="text-gray-500">Saldo</p><p class="font-semibold">{formatArs(budget.pending)}</p></div>
          </div>

          <div class="mt-3">
            <Button href={route('/seguimiento/', budget.id)} size="xs" color="light">Ver seguimiento</Button>
          </div>
        </div>
      {/each}
    </div>
  </Card>
{/if}
