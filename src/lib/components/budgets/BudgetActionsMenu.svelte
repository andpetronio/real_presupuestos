<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { browser } from '$app/environment';
  import { invalidateAll } from '$app/navigation';
  import { Button, Dropdown, DropdownItem, DropdownDivider } from 'flowbite-svelte';
  import type { BudgetStatus } from '$lib/types/budget';
  import { route } from '$lib/shared/navigation';
  import { ArrowCounterClockwiseIcon, ChartLineIcon, CheckCircleIcon, EyeIcon, PencilSimpleIcon, TrashIcon, WhatsappLogoIcon, XCircleIcon } from 'phosphor-svelte';
  import { closeBlockingLoader, confirmAlert, presentActionFeedback, showBlockingLoader } from '$lib/shared/alerts';

  type BudgetActionsMenuProps = {
    budget: {
      id: string;
      status: BudgetStatus;
      tutor: { full_name: string } | null;
    };
  };

  let { budget }: BudgetActionsMenuProps = $props();

  let open = $state(false);

  const previewPath = $derived(route('/budgets/', budget.id, '/preview'));
  const editPath = $derived(route('/budgets/', budget.id, '/update'));
  const seguimientoPath = $derived(route('/seguimiento/', budget.id));
  const acceptFormId = $derived(`accept-form-${budget.id}`);
  const rejectFormId = $derived(`reject-form-${budget.id}`);
  const deleteFormId = $derived(`delete-form-${budget.id}`);
  const undoFormId = $derived(`undo-form-${budget.id}`);
  const sendWhatsappFormId = $derived(`send-whatsapp-form-${budget.id}`);

  const submitFormById = (formId: string) => () => {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;
    form.requestSubmit();
  };

  const createEnhancedSubmit = (options?: {
    title: string;
    text: string;
    confirmButtonText: string;
    openRedirectInNamedTab?: string;
  }) => {
    return async ({ cancel }: { cancel: () => void }) => {
      if (options?.title && options?.text) {
        const confirmed = await confirmAlert({
          title: options.title,
          text: options.text,
          confirmButtonText: options.confirmButtonText
        });
        if (!confirmed) {
          cancel();
          return;
        }
      }

      open = false;
      void showBlockingLoader();

      return async ({ result }: { result: import('@sveltejs/kit').ActionResult }) => {
        await closeBlockingLoader();
        if (result.type === 'redirect' && options?.openRedirectInNamedTab && browser) {
          window.open(result.location, options.openRedirectInNamedTab);
          await invalidateAll();
          return;
        }
        await applyAction(result);
        if (result.type === 'success') {
          await invalidateAll();
        }
        await presentActionFeedback(result);
      };
    };
  };
</script>

<div class="relative inline-block">
  <form
    id={acceptFormId}
    method="POST"
    action="?/accept"
    class="hidden"
    use:enhance={createEnhancedSubmit()}
  >
    <input type="hidden" name="budgetId" value={budget.id} />
  </form>
  <form
    id={rejectFormId}
    method="POST"
    action="?/reject"
    class="hidden"
    use:enhance={createEnhancedSubmit({
      title: 'Rechazar presupuesto',
      text: 'Esta accion lo marcara como rechazado.',
      confirmButtonText: 'Si, rechazar'
    })}
  >
    <input type="hidden" name="budgetId" value={budget.id} />
  </form>
  <form
    id={deleteFormId}
    method="POST"
    action="?/delete"
    class="hidden"
    use:enhance={createEnhancedSubmit({
      title: 'Eliminar borrador',
      text: 'Esta accion eliminara el presupuesto definitivamente.',
      confirmButtonText: 'Si, eliminar'
    })}
  >
    <input type="hidden" name="budgetId" value={budget.id} />
  </form>
  <form
    id={undoFormId}
    method="POST"
    action="?/undoSent"
    class="hidden"
    use:enhance={createEnhancedSubmit({
      title: 'Reabrir presupuesto',
      text: 'El presupuesto volvera a estado borrador.',
      confirmButtonText: 'Si, reabrir'
    })}
  >
    <input type="hidden" name="budgetId" value={budget.id} />
  </form>
  <form
    id={sendWhatsappFormId}
    method="POST"
    action="?/sendWhatsapp"
    class="hidden"
    use:enhance={createEnhancedSubmit({
      title: 'Enviar por WhatsApp',
      text: 'Se abrirá WhatsApp en una pestaña nueva.',
      confirmButtonText: 'Abrir WhatsApp',
      openRedirectInNamedTab: 'whatsapp_compose'
    })}
  >
    <input type="hidden" name="budgetId" value={budget.id} />
  </form>

  <Button
    size="xs"
    color="light"
    class="px-2"
    aria-label="Acciones"
    onclick={() => (open = !open)}
  >
    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 128 128">
      <circle cx="28" cy="64" r="6" />
      <circle cx="64" cy="64" r="6" />
      <circle cx="100" cy="64" r="6" />
    </svg>
  </Button>

  <Dropdown bind:isOpen={open} class="z-50 min-w-44 list-none">
    <DropdownItem href={previewPath}>
      <div class="flex items-center gap-2">
        <EyeIcon size={16} />
        Ver
      </div>
    </DropdownItem>

    {#if budget.status === 'accepted' || budget.status === 'closed'}
      <DropdownItem href={seguimientoPath}>
        <div class="flex items-center gap-2">
          <ChartLineIcon size={16} />
          Seguimiento
        </div>
      </DropdownItem>
    {/if}

    {#if budget.status === 'draft' || budget.status === 'ready_to_send'}
      <DropdownItem href={editPath}>
        <div class="flex items-center gap-2">
          <PencilSimpleIcon size={16} />
          Editar
        </div>
      </DropdownItem>
      {#if budget.status === 'draft'}
        <DropdownItem
          aClass="w-full cursor-pointer text-green-600 dark:text-green-500"
          onclick={submitFormById(sendWhatsappFormId)}
        >
          <div class="flex items-center gap-2">
            <WhatsappLogoIcon size={16} />
            Enviar por WP
          </div>
        </DropdownItem>
      {/if}
      <DropdownItem
        aClass="w-full cursor-pointer text-red-600 dark:text-red-500"
        onclick={submitFormById(deleteFormId)}
      >
        <div class="flex items-center gap-2">
          <TrashIcon size={16} />
          Eliminar
        </div>
      </DropdownItem>
    {/if}

    {#if budget.status === 'sent'}
      <DropdownDivider />
      <DropdownItem
        aClass="w-full cursor-pointer text-green-600 dark:text-green-500"
        onclick={submitFormById(acceptFormId)}
      >
        <div class="flex items-center gap-2">
          <CheckCircleIcon size={16} />
          Aceptar
        </div>
      </DropdownItem>
      <DropdownItem
        aClass="w-full cursor-pointer text-red-600 dark:text-red-500"
        onclick={submitFormById(rejectFormId)}
      >
        <div class="flex items-center gap-2">
          <XCircleIcon size={16} />
          Rechazar
        </div>
      </DropdownItem>
      <DropdownItem
        aClass="w-full cursor-pointer"
        onclick={submitFormById(undoFormId)}
      >
        <div class="flex items-center gap-2">
          <ArrowCounterClockwiseIcon size={16} />
          Reabrir
        </div>
      </DropdownItem>
    {/if}
  </Dropdown>
</div>
