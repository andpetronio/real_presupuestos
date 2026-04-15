<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Alert, Card } from 'flowbite-svelte';
  import EmptyState from '$lib/components/admin/EmptyState.svelte';
  import {
    resolveTableShellView,
    type TableShellState,
    type TableShellViewModel
  } from '$lib/components/admin/table-shell.model';

  type TableShellProps = {
    title: string;
    description?: string;
    state: TableShellState;
    loadingLabel?: string;
    emptyTitle?: string;
    emptyDetail?: string;
    emptyActionLabel?: string;
    onEmptyAction?: () => void;
    errorTitle?: string;
    errorDetail?: string;
    toolbar?: Snippet;
    children?: Snippet;
  };

  let {
    title,
    description,
    state,
    loadingLabel = 'Cargando información para el operador…',
    emptyTitle = 'No hay resultados todavía',
    emptyDetail,
    emptyActionLabel,
    onEmptyAction,
    errorTitle = 'No pudimos cargar la tabla',
    errorDetail = 'Reintentá en unos segundos o revisá la conexión.',
    toolbar,
    children
  }: TableShellProps = $props();

  const view = $derived<TableShellViewModel>(
    resolveTableShellView({
      state,
      loadingLabel,
      emptyTitle,
      emptyDetail,
      emptyActionLabel,
      errorTitle,
      errorDetail
    })
  );
</script>

<Card size="xl" class="w-full shadow-sm" aria-live="polite">
  <header class="space-y-1">
    <div>
      <h2 class="text-lg font-semibold text-gray-900">{title}</h2>
      {#if description}
        <p class="text-sm text-gray-600">{description}</p>
      {/if}
    </div>
  </header>

  {#if view.kind === 'loading'}
    <Alert color="blue" role="status">{view.message}</Alert>
  {:else if view.kind === 'empty'}
    <EmptyState
      title={view.title}
      detail={view.detail}
      actionLabel={view.actionLabel}
      onAction={onEmptyAction}
    />
  {:else if view.kind === 'error'}
    <Alert color="red" role="status">
      <p class="font-semibold">{view.title}</p>
      <p>{view.detail}</p>
    </Alert>
  {:else}
    <div class="space-y-3">
      {#if toolbar}
        <div>{@render toolbar()}</div>
      {/if}

      <div class="overflow-x-auto">
        {@render children?.()}
      </div>
    </div>
  {/if}
</Card>
