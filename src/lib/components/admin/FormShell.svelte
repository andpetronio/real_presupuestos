<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Alert, Button, Card } from 'flowbite-svelte';
  import {
    resolveFormShellMessage,
    resolvePrimaryActionDisabled,
    resolvePrimaryLabel,
    type FormShellState
  } from '$lib/components/admin/form-shell.model';

  type FormShellProps = {
    title: string;
    description?: string;
    state?: FormShellState;
    message?: string;
    validationErrors?: ReadonlyArray<string>;
    primaryLabel?: string;
    disablePrimary?: boolean;
    showPrimary?: boolean;
    onPrimary?: () => void;
    children?: Snippet;
  };

  let {
    title,
    description,
    state = 'idle',
    message,
    validationErrors = [],
    primaryLabel = 'Guardar cambios',
    disablePrimary = false,
    showPrimary = true,
    onPrimary,
    children
  }: FormShellProps = $props();

  const stateMessage = $derived(resolveFormShellMessage(state, message));
  const primaryDisabled = $derived(resolvePrimaryActionDisabled(state, disablePrimary));
  const primaryActionLabel = $derived(resolvePrimaryLabel(state, primaryLabel));
  const feedbackColor = $derived<'blue' | 'red' | 'green'>(
    state === 'success' ? 'green' : state === 'saving' ? 'blue' : 'red'
  );
</script>

<Card size="xl" class="w-full shadow-sm">
  <header class="space-y-1">
    <h2 class="text-lg font-semibold text-gray-900">{title}</h2>
    {#if description}
      <p class="text-sm text-gray-600">{description}</p>
    {/if}
  </header>

  {#if state !== 'idle'}
    <Alert color={feedbackColor} role="status" aria-live="polite">
      {stateMessage}
    </Alert>
  {/if}

  {#if state === 'validation' && validationErrors.length > 0}
    <Alert color="red" role="status" aria-live="polite">
      <ul class="list-disc ps-4">
        {#each validationErrors as error (error)}
          <li>{error}</li>
        {/each}
      </ul>
    </Alert>
  {/if}

  <div class="space-y-4">
    {@render children?.()}
  </div>

  {#if showPrimary}
    <footer class="flex justify-end">
      <Button type="button" onclick={() => onPrimary?.()} disabled={primaryDisabled}>
        {primaryActionLabel}
      </Button>
    </footer>
  {/if}
</Card>
