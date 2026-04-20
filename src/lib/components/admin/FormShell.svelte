<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import type { Snippet } from 'svelte';
  import { Button, Card } from 'flowbite-svelte';
  import { type FormShellFormState } from '$lib/components/admin/form-shell.model';
  import { showBlockingLoader, closeBlockingLoader, presentActionFeedback } from '$lib/shared/alerts';

  type FormShellProps = {
    title: string;
    description?: string;
    action?: string;
    method?: 'POST' | 'GET';
    enctype?: 'multipart/form-data' | 'application/x-www-form-urlencoded';
    form?: FormShellFormState;
    primaryLabel?: string;
    showPrimary?: boolean;
    children?: Snippet;
    actions?: Snippet;
    loading?: boolean;
    state?: 'idle' | 'error' | 'success';
  };

  let {
    title,
    description,
    action,
    method = 'POST',
    enctype = 'multipart/form-data',
    form = null,
    primaryLabel = 'Guardar cambios',
    showPrimary = true,
    children,
    actions,
    loading = false,
    state: _state
  }: FormShellProps = $props();

  let submitting = $state(false);

  const handleSubmit = () => {
    submitting = true;
  };
</script>

<Card size="xl" class="w-full shadow-sm p-6" id="form-shell-card">
  <header class="space-y-1">
    <h2 class="text-lg font-semibold text-gray-900">{title}</h2>
    {#if description}
      <p class="text-sm text-gray-600">{description}</p>
    {/if}
  </header>

  <form
    {action}
    {method}
    {enctype}
    use:enhance={() => {
      handleSubmit();
      void showBlockingLoader();
      return async ({ result }) => {
        await closeBlockingLoader();
        await applyAction(result);
        await presentActionFeedback(result);
        submitting = false;
      };
    }}
    class="space-y-4"
  >
    {@render children?.()}

    <footer class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      {#if actions}
        {@render actions()}
      {:else if showPrimary}
        <Button
          type="submit"
          disabled={submitting || loading}
        >
          {submitting ? 'Guardando…' : primaryLabel}
        </Button>
      {/if}
    </footer>
  </form>
</Card>