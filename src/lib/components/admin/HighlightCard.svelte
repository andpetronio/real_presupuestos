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

<div class="rounded-lg border border-gray-200 bg-white p-4">
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0 flex-1">
      <p class="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p class="mt-1.5 text-2xl font-semibold tracking-tight text-gray-900">{value}</p>
      {#if delta !== null}
        <p class="mt-1 text-xs text-gray-500">
          {formatDelta(delta)} {deltaLabel}
        </p>
      {/if}
    </div>

    {#if iconSnippet}
      <span class="rounded-md bg-primary-50 p-2 text-primary-700" aria-hidden="true">
        {@render iconSnippet()}
      </span>
    {/if}
  </div>

  {#if subValue}
    <div class="mt-3 border-t border-gray-100 pt-3">
      <p class="text-xs uppercase tracking-wide text-gray-500">{subValue.label}</p>
      <p class="mt-1 text-lg font-semibold text-gray-900">{subValue.value}</p>
    </div>
  {/if}
</div>
