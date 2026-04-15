<script lang="ts">
  import type { Snippet } from 'svelte';
  import {
    resolveValueColorClass,
    resolveDeltaColorClass,
    formatDeltaBadge
  } from './metric-card.model';

  type MetricCardProps = {
    label: string;
    value: number | string;
    delta?: number | null;
    deltaLabel?: string;
    iconSnippet?: Snippet;
    trendDirection?: 'up' | 'down' | 'neutral';
    colorVariant?: 'default' | 'primary' | 'accent' | 'secondary';
  };

  let {
    label,
    value,
    delta = null,
    deltaLabel = 'vs período anterior',
    iconSnippet,
    trendDirection = 'neutral',
    colorVariant = 'default'
  }: MetricCardProps = $props();

  const valueColorClass = $derived(resolveValueColorClass(colorVariant));
  const deltaColorClass = $derived(resolveDeltaColorClass(delta, trendDirection));
  const deltaText = $derived(delta === null ? '' : `${formatDeltaBadge(delta)} ${deltaLabel}`);
</script>

<div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0 flex-1">
      <p class="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p class="mt-2 text-3xl font-bold {valueColorClass}">{value}</p>
      {#if delta !== null && deltaText}
        <p class="mt-1 text-xs {deltaColorClass}">{deltaText}</p>
      {/if}
    </div>

    {#if iconSnippet}
      <div class="flex-shrink-0">
        {@render iconSnippet()}
      </div>
    {/if}
  </div>
</div>
