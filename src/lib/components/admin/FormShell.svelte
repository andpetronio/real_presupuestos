<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import type { Snippet } from 'svelte';
  import { Alert, Button, Card } from 'flowbite-svelte';
  import { isFormError, isFormSuccess, type FormShellFormState } from '$lib/components/admin/form-shell.model';

  type FormShellProps = {
    title: string;
    description?: string;
    action?: string;
    method?: 'POST' | 'GET';
    form?: FormShellFormState;
    primaryLabel?: string;
    showPrimary?: boolean;
    children?: Snippet;
    actions?: Snippet;
    loading?: boolean;
    // For displaying error/success states without a form
    state?: 'idle' | 'error' | 'success';
  };

  let {
    title,
    description,
    action,
    method = 'POST',
    form = null,
    primaryLabel = 'Guardar cambios',
    showPrimary = true,
    children,
    actions,
    loading = false,
    state: _explicitState
  }: FormShellProps = $props();

  // Get all field errors as flat array for validation summary
  const fieldErrors = $derived(form?.state === 'error' && form.errors ? form.errors : {});

  // Submitting state - controlled by use:enhance
  let submitting = $state(false);

  const handleSubmit = () => {
    submitting = true;
  };
</script>

<Card size="xl" class="w-full shadow-sm p-6">
  <header class="space-y-1">
    <h2 class="text-lg font-semibold text-gray-900">{title}</h2>
    {#if description}
      <p class="text-sm text-gray-600">{description}</p>
    {/if}
  </header>

  <form
    {action}
    {method}
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

<!-- Field error display helper - expose for child components -->
{#snippet fieldError(name: string)}
  {#if fieldErrors[name]?.length}
    <p class="mt-1 text-xs text-red-600" role="alert">
      {fieldErrors[name].join(', ')}
    </p>
  {/if}
{/snippet}
