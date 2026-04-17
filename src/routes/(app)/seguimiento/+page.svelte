<script lang="ts">
  import { Button, Card, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Badge, Select } from 'flowbite-svelte';
  import FeedbackBanner from '$lib/components/FeedbackBanner.svelte';
  import { goto } from '$app/navigation';
  import { route } from '$lib/shared/navigation';

  type TrackingRow = {
    id: string;
    status: string;
    tutorId: string;
    tutorName: string;
    viewedAt: string | null;
    total: number;
    paid: number;
    preparedPct: number;
    deliveredPct: number;
    collectedPct: number;
  };

  type TutorOption = { id: string; fullName: string };

  type PageData = {
    state: 'success' | 'empty' | 'error';
    message: { title: string; detail?: string } | null;
    trackingRows: ReadonlyArray<TrackingRow>;
    tutorOptions: ReadonlyArray<TutorOption>;
    selectedTutor: string;
    selectedShow: 'active' | 'closed';
  };

  let { data }: { data: PageData } = $props();



  const pctBadge = (pct: number) => {
    if (pct === 0) return { color: 'red' as const, label: '0%' };
    if (pct < 33) return { color: 'red' as const, label: `${pct}%` };
    if (pct < 66) return { color: 'yellow' as const, label: `${pct}%` };
    return { color: 'green' as const, label: `${pct}%` };
  };

  const tutorSelectOptions = $derived([
    { value: '', name: 'Todos los tutores' },
    ...data.tutorOptions.map((t) => ({ value: t.id, name: t.fullName }))
  ]);

  const handleTutorChange = (tutorId: string) => {
    const url = new URL(window.location.href);
    if (tutorId) {
      url.searchParams.set('tutor', tutorId);
    } else {
      url.searchParams.delete('tutor');
    }
    goto(url, { replaceState: true });
  };

  const handleShowChange = (show: 'active' | 'closed') => {
    const url = new URL(window.location.href);
    url.searchParams.set('show', show);
    goto(url, { replaceState: true });
  };
</script>

{#if data.state === 'error'}
  <FeedbackBanner message={data.message?.detail ?? 'No pudimos cargar seguimiento.'} color="red" />
{:else if data.state === 'empty'}
  <FeedbackBanner message={data.message?.detail ?? 'No hay presupuestos.'} color="blue" />
{:else}
  <Card size="xl" class="w-full shadow-sm p-0">
    <div class="flex flex-wrap items-center gap-4 border-b border-gray-200 p-4">
      <div class="flex gap-1">
        <Button
          size="xs"
          color={data.selectedShow === 'active' ? 'primary' : 'light'}
          onclick={() => handleShowChange('active')}
        >
          Activos
        </Button>
        <Button
          size="xs"
          color={data.selectedShow === 'closed' ? 'primary' : 'light'}
          onclick={() => handleShowChange('closed')}
        >
          Cerrados
        </Button>
      </div>
      <div class="grid gap-1 md:max-w-xs">
        <label for="tutor-filter" class="text-sm font-medium text-gray-700">Tutor</label>
        <Select
          id="tutor-filter"
          items={tutorSelectOptions}
          value={data.selectedTutor}
          onchange={(e) => handleTutorChange((e.currentTarget as HTMLSelectElement).value)}
        />
      </div>
    </div>

    <div class="hidden overflow-x-auto md:block" aria-label="Tabla de seguimiento de presupuestos aceptados">
      <Table hoverable striped>
        <TableHead>
          <TableHeadCell>Tutor</TableHeadCell>
          <TableHeadCell class="text-center">Preparadas</TableHeadCell>
          <TableHeadCell class="text-center">Entregadas</TableHeadCell>
          <TableHeadCell class="text-center">Cobrado</TableHeadCell>
          <TableHeadCell class="text-right">Total</TableHeadCell>
          <TableHeadCell>Acciones</TableHeadCell>
        </TableHead>
        <TableBody>
          {#each data.trackingRows as budget (budget.id)}
            {@const prepBadge = pctBadge(budget.preparedPct)}
            {@const delBadge = pctBadge(budget.deliveredPct)}
            {@const colBadge = pctBadge(budget.collectedPct)}
            <TableBodyRow>
              <TableBodyCell>
                <div class="flex items-center gap-2">
                  {#if budget.status === 'closed'}
                    <Badge color="gray">Cerrado</Badge>
                  {:else if !budget.viewedAt}
                    <span class="inline-block h-2 w-2 rounded-full bg-yellow-400" title="No visitado"></span>
                  {/if}
                  <span class="font-medium text-gray-900">{budget.tutorName}</span>
                </div>
              </TableBodyCell>
              <TableBodyCell class="text-center">
                <Badge color={prepBadge.color}>{prepBadge.label}</Badge>
              </TableBodyCell>
              <TableBodyCell class="text-center">
                <Badge color={delBadge.color}>{delBadge.label}</Badge>
              </TableBodyCell>
              <TableBodyCell class="text-center">
                <Badge color={colBadge.color}>{colBadge.label}</Badge>
              </TableBodyCell>
              <TableBodyCell class="text-right">{budget.total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</TableBodyCell>
              <TableBodyCell>
                <Button href={route('/seguimiento/', budget.id)} size="xs" color="light">Ver detalle</Button>
              </TableBodyCell>
            </TableBodyRow>
          {/each}
        </TableBody>
      </Table>
    </div>

    <div class="grid gap-3 p-4 md:hidden">
      {#each data.trackingRows as budget (budget.id)}
        {@const prepBadge = pctBadge(budget.preparedPct)}
        {@const delBadge = pctBadge(budget.deliveredPct)}
        {@const colBadge = pctBadge(budget.collectedPct)}
        <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-2">
              {#if budget.status === 'closed'}
                <Badge color="gray">Cerrado</Badge>
              {:else if !budget.viewedAt}
                <span class="inline-block h-2 w-2 rounded-full bg-yellow-400" title="No visitado"></span>
              {/if}
              <p class="font-semibold text-gray-900">{budget.tutorName}</p>
            </div>
          </div>

          <div class="mt-3 grid grid-cols-3 gap-2 text-sm">
            <div class="flex flex-col items-center rounded bg-gray-50 p-2">
              <p class="text-xs text-gray-500">Prep.</p>
              <Badge color={prepBadge.color}>{prepBadge.label}</Badge>
            </div>
            <div class="flex flex-col items-center rounded bg-gray-50 p-2">
              <p class="text-xs text-gray-500">Entr.</p>
              <Badge color={delBadge.color}>{delBadge.label}</Badge>
            </div>
            <div class="flex flex-col items-center rounded bg-gray-50 p-2">
              <p class="text-xs text-gray-500">Cob.</p>
              <Badge color={colBadge.color}>{colBadge.label}</Badge>
            </div>
          </div>

          <div class="mt-3 grid grid-cols-1 gap-2 border-t border-gray-100 pt-3 text-sm">
            <div class="text-right"><p class="text-gray-500">Total</p><p class="font-semibold">{budget.total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</p></div>
          </div>

          <div class="mt-3">
            <Button href={route('/seguimiento/', budget.id)} size="xs" color="light">Ver seguimiento</Button>
          </div>
        </div>
      {/each}
    </div>
  </Card>
{/if}
