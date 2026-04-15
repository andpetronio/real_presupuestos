<script lang="ts">
  import type { Snippet } from 'svelte';

  type HighlightCardProps = {
    label: string;
    value: number | string;
    delta?: number | null;
    deltaLabel?: string;
    subValue?: { label: string; value: string };
    iconSnippet?: Snippet;
  };

  let {
    label,
    value,
    delta = null,
    deltaLabel = 'vs período anterior',
    subValue,
    iconSnippet
  }: HighlightCardProps = $props();

  const formatDelta = (value: number | null) => {
    if (value === null) return '';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };
</script>

<div class="rounded-xl border border-primary-200 bg-primary-50 p-4">
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0 flex-1">
      <p class="text-xs uppercase tracking-wide text-primary-700">{label}</p>
      <p class="mt-1 text-3xl font-bold text-primary-700">{value}</p>
      {#if delta !== null}
        <p class="mt-1 text-sm text-primary-700/80">
          {formatDelta(delta)} {deltaLabel}
        </p>
      {/if}
    </div>

    {#if iconSnippet}
      <span class="rounded-lg bg-white p-2 text-primary-700" aria-hidden="true">
        {@render iconSnippet()}
      </span>
    {/if}
  </div>

  {#if subValue}
    <div class="mt-4 rounded-lg border border-primary-200 bg-white/70 p-3">
      <p class="text-xs uppercase tracking-wide text-primary-700">{subValue.label}</p>
      <p class="mt-1 text-xl font-semibold text-primary-700">{subValue.value}</p>
    </div>
  {/if}
</div>
