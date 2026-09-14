<script lang="ts">
  import { Button, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Badge, Select } from 'flowbite-svelte';
  import DataTable from '$lib/components/admin/DataTable.svelte';
  import ListSurface from '$lib/components/admin/ListSurface.svelte';
  import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
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
    activeCount: number;
    closedCount: number;
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
{:else}
  <ListSurface>
    {#snippet toolbar()}
    <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div class="inline-flex w-fit items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1" role="tablist" aria-label="Filtro por estado">
        <button
          type="button"
          role="tab"
          aria-selected={data.selectedShow === 'active'}
          class={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${data.selectedShow === 'active' ? 'bg-primary-700 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          onclick={() => handleShowChange('active')}
        >
          <span>Activos</span>
          <span class={`rounded-full px-2 py-0.5 text-xs ${data.selectedShow === 'active' ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-700'}`}>
            {data.activeCount}
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={data.selectedShow === 'closed'}
          class={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${data.selectedShow === 'closed' ? 'bg-primary-700 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          onclick={() => handleShowChange('closed')}
        >
          <span>Cerrados</span>
          <span class={`rounded-full px-2 py-0.5 text-xs ${data.selectedShow === 'closed' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
            {data.closedCount}
          </span>
        </button>
      </div>
      <div class="grid w-full gap-1 sm:w-56">
        <label for="tutor-filter" class="text-sm font-medium text-gray-700">Tutor</label>
        <Select
          id="tutor-filter"
          items={tutorSelectOptions}
          value={data.selectedTutor}
          onchange={(e) => handleTutorChange((e.currentTarget as HTMLSelectElement).value)}
        />
      </div>
    </div>
    {/snippet}

    {#snippet content()}
    {#if data.state === 'empty'}
      <div class="p-4">
        <FeedbackBanner message={data.message?.detail ?? 'No hay presupuestos para este filtro.'} color="blue" />
      </div>
    {:else}
      <div class="hidden lg:block" aria-label="Tabla de seguimiento de presupuestos aceptados">
        <DataTable ariaLabel="Tabla de seguimiento de presupuestos aceptados" scrollable={false}>
          <TableHead>
            <TableHeadCell class="bg-gray-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Tutor</TableHeadCell>
            <TableHeadCell class="bg-gray-50 px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Preparadas</TableHeadCell>
            <TableHeadCell class="bg-gray-50 px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Entregadas</TableHeadCell>
            <TableHeadCell class="bg-gray-50 px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Cobrado</TableHeadCell>
            <TableHeadCell class="bg-gray-50 px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Total</TableHeadCell>
            <TableHeadCell class="bg-gray-50 px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Acciones</TableHeadCell>
          </TableHead>
          <TableBody>
            {#each data.trackingRows as budget (budget.id)}
              {@const prepBadge = pctBadge(budget.preparedPct)}
              {@const delBadge = pctBadge(budget.deliveredPct)}
              {@const colBadge = pctBadge(budget.collectedPct)}
              <TableBodyRow class="border-gray-100 bg-white hover:bg-gray-50">
                <TableBodyCell class="px-4 py-2.5">
                  <div class="flex items-center gap-2">
                    {#if budget.status === 'closed'}
                      <StatusBadge status="closed" />
                    {:else if !budget.viewedAt}
                      <span class="inline-block h-2 w-2 rounded-full bg-yellow-400" title="No visitado"></span>
                    {/if}
                    <span class="font-medium text-gray-900">{budget.tutorName}</span>
                  </div>
                </TableBodyCell>
                <TableBodyCell class="px-4 py-2.5 text-center">
                  <Badge color={prepBadge.color}>{prepBadge.label}</Badge>
                </TableBodyCell>
                <TableBodyCell class="px-4 py-2.5 text-center">
                  <Badge color={delBadge.color}>{delBadge.label}</Badge>
                </TableBodyCell>
                <TableBodyCell class="px-4 py-2.5 text-center">
                  <Badge color={colBadge.color}>{colBadge.label}</Badge>
                </TableBodyCell>
                <TableBodyCell class="whitespace-nowrap px-4 py-2.5 text-right font-semibold text-gray-900 tabular-nums">{budget.total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</TableBodyCell>
                <TableBodyCell class="px-4 py-2.5 text-right">
                  <Button href={route('/seguimiento/', budget.id)} size="xs" color="light">Ver detalle</Button>
                </TableBodyCell>
              </TableBodyRow>
            {/each}
          </TableBody>
        </DataTable>
      </div>

      <div class="grid gap-2.5 p-3 lg:hidden">
        {#each data.trackingRows as budget (budget.id)}
          {@const prepBadge = pctBadge(budget.preparedPct)}
          {@const delBadge = pctBadge(budget.deliveredPct)}
          {@const colBadge = pctBadge(budget.collectedPct)}
          <article class="rounded-lg border border-gray-200 bg-white p-3">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-2">
                {#if budget.status === 'closed'}
                  <StatusBadge status="closed" />
                {:else if !budget.viewedAt}
                  <span class="inline-block h-2 w-2 rounded-full bg-yellow-400" title="No visitado"></span>
                {/if}
                <p class="font-semibold text-gray-900">{budget.tutorName}</p>
              </div>
            </div>

            <div class="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div class="flex flex-col items-center rounded-md bg-gray-50 p-2">
                <p class="text-xs text-gray-500">Prep.</p>
                <Badge color={prepBadge.color}>{prepBadge.label}</Badge>
              </div>
              <div class="flex flex-col items-center rounded-md bg-gray-50 p-2">
                <p class="text-xs text-gray-500">Entr.</p>
                <Badge color={delBadge.color}>{delBadge.label}</Badge>
              </div>
              <div class="flex flex-col items-center rounded-md bg-gray-50 p-2">
                <p class="text-xs text-gray-500">Cob.</p>
                <Badge color={colBadge.color}>{colBadge.label}</Badge>
              </div>
            </div>

            <div class="mt-3 grid grid-cols-1 gap-2 border-t border-gray-100 pt-3 text-sm">
              <div class="text-right"><p class="text-gray-500">Total</p><p class="font-semibold tabular-nums text-gray-900">{budget.total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</p></div>
            </div>

            <div class="mt-3">
              <Button href={route('/seguimiento/', budget.id)} size="xs" color="light">Ver seguimiento</Button>
            </div>
          </article>
        {/each}
      </div>
    {/if}
    {/snippet}
  </ListSurface>
{/if}
