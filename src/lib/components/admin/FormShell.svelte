<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import type { Snippet } from 'svelte';
  import { Alert, Button, Card } from 'flowbite-svelte';
  import { isFormError, isFormSuccess, type EnhancedFormState } from '$lib/components/admin/form-shell.model';

  type FormShellProps = {
    title: string;
    description?: string;
    action?: string;
    method?: 'POST' | 'GET';
    form?: EnhancedFormState | null;
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
    state: explicitState
  }: FormShellProps = $props();

  // Derived state from SvelteKit form
  const hasError = $derived(isFormError(form) || explicitState === 'error');
  const hasSuccess = $derived(isFormSuccess(form) || explicitState === 'success');
  const legacyErrorMessage = $derived((form as { operatorError?: string } | null)?.operatorError);
  const legacySuccessMessage = $derived((form as { operatorSuccess?: string } | null)?.operatorSuccess);
  const hasLegacyError = $derived(Boolean(legacyErrorMessage));
  const hasLegacySuccess = $derived(Boolean(legacySuccessMessage));
  const errorMessage = $derived(
    form?.state === 'error' ? form.message :
    legacyErrorMessage ? legacyErrorMessage :
    explicitState === 'error' && description ? description : undefined
  );
  const successMessage = $derived(
    form?.state === 'success'
      ? form.message
      : legacySuccessMessage || 'Cambios guardados correctamente.'
  );

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

  {#if (hasError || hasLegacyError) && errorMessage}
    <Alert color="red" role="status" aria-live="polite" class="mt-4">
      {errorMessage}
    </Alert>
  {/if}

  {#if hasSuccess || hasLegacySuccess}
    <Alert color="green" role="status" aria-live="polite" class="mt-4">
      {successMessage}
    </Alert>
  {/if}

  <form
    {action}
    {method}
    use:enhance={() => {
      handleSubmit();
      return async ({ result }) => {
        await applyAction(result);
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
