<script lang="ts">
  import { Button, Card } from 'flowbite-svelte';
  import { Package } from '$lib/icons/phosphor';

  type EmptyStateProps = {
    title: string;
    detail?: string;
    actionLabel?: string;
    onAction?: () => void;
  };

  let {
    title,
    detail = 'Todavía no hay datos para mostrar en este módulo.',
    actionLabel,
    onAction
  }: EmptyStateProps = $props();

  const Icon = Package;
</script>

<Card class="border-dashed" role="status" aria-live="polite">
  <div class="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex items-start gap-3">
      <div class="rounded-lg bg-primary-50 p-2">
        <Icon size={28} weight="duotone" aria-hidden="true" />
      </div>

      <div class="copy">
        <h3>{title}</h3>
        <p>{detail}</p>
      </div>
    </div>

    {#if actionLabel}
      <Button type="button" onclick={() => onAction?.()} color="light">{actionLabel}</Button>
    {/if}
  </div>
</Card>

<style>
  .copy h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-gray-900);
  }

  .copy p {
    margin: 0.25rem 0 0;
    color: var(--color-gray-600);
    font-size: 0.925rem;
  }
</style>
