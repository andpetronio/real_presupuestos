<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { Alert, Button, Card, Label, Textarea } from 'flowbite-svelte';
  import { formatArs } from '$lib/shared/currency';
  import { closeBlockingLoader, presentActionFeedback, showBlockingLoader } from '$lib/shared/alerts';

  type BudgetResponseData = {
    id: string;
    status: string;
    finalSalePrice: number;
    expiresAt: string | null;
    notes: string | null;
    rejectionReason: string | null;
    acceptedAt: string | null;
    rejectedAt: string | null;
    sentAt: string | null;
    tutorName: string;
    canRespond: boolean;
  };

  type PageData = {
    budget: BudgetResponseData | null;
    pageState: 'success' | 'error';
    pageMessage: { kind: 'error'; title: string; detail: string } | null;
  };

  type FormState = {
    actionType?: 'accept' | 'reject';
    operatorError?: string;
    operatorSuccess?: string;
    rejectionReason?: string;
  };

  let { data, form }: { data: PageData; form: FormState | null } = $props();

  const formatDate = (value: string | null): string => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const rejectionDraft = $derived(form?.rejectionReason ?? '');

  const enhanceWithFeedback = () => {
    return async () => {
      void showBlockingLoader();

      return async ({ result }: { result: import('@sveltejs/kit').ActionResult }) => {
        await closeBlockingLoader();
        await applyAction(result);
        await presentActionFeedback(result);
      };
    };
  };
</script>

<svelte:head>
  <title>Respuesta de presupuesto</title>
</svelte:head>

<main class="min-h-screen bg-gray-50 px-3 py-4 text-gray-900 sm:px-4 sm:py-8">
  <div class="mx-auto w-full max-w-3xl space-y-4">
    <Card size="xl" class="w-full p-5 shadow-sm sm:p-6">
      <h1 class="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">Confirmá tu presupuesto</h1>
      <p class="mt-1 text-sm text-gray-600">Acá podés confirmar o descartar la propuesta.</p>

      {#if data.pageState === 'error' || !data.budget}
        <Alert color="red" class="mt-4">
          <strong>{data.pageMessage?.title ?? 'No disponible'}</strong>
          <p>{data.pageMessage?.detail ?? 'No pudimos cargar la información del presupuesto.'}</p>
        </Alert>
      {:else}
        <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="rounded-lg border border-gray-200 bg-white p-3 sm:col-span-2">
            <p class="text-xs uppercase tracking-wide text-gray-500">Tutor</p>
            <p class="mt-1 text-lg font-semibold text-gray-900">{data.budget.tutorName}</p>
          </div>
          <div class="rounded-lg border border-gray-200 bg-white p-3 sm:col-span-2">
            <p class="text-xs uppercase tracking-wide text-gray-500">Total</p>
            <p class="mt-1 text-3xl font-bold text-primary-700">{formatArs(data.budget.finalSalePrice)}</p>
          </div>
          <div class="rounded-lg border border-gray-200 bg-white p-3 sm:col-span-2">
            <p class="text-xs uppercase tracking-wide text-gray-500">Vencimiento</p>
            <p class="mt-1 text-lg font-semibold text-gray-900">{formatDate(data.budget.expiresAt)}</p>
          </div>
        </div>

        {#if data.budget.notes}
          <Card size="xl" class="mt-4 w-full border border-gray-200 bg-gray-50 p-4 shadow-none">
            <p class="text-xs uppercase tracking-wide text-gray-500">Notas del presupuesto</p>
            <p class="mt-2 whitespace-pre-wrap text-sm text-gray-700">{data.budget.notes}</p>
          </Card>
        {/if}

        {#if data.budget.status === 'rejected' && data.budget.rejectionReason}
          <Card size="xl" class="mt-4 w-full border border-secondary-200 bg-secondary-50 p-4 shadow-none">
            <p class="text-xs uppercase tracking-wide text-secondary-700">Motivo registrado</p>
            <p class="mt-2 whitespace-pre-wrap text-sm text-secondary-900">{data.budget.rejectionReason}</p>
          </Card>
        {/if}

        {#if data.budget.canRespond}
          <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card size="xl" class="w-full p-4 shadow-sm">
              <p class="text-sm font-semibold text-gray-900">¿Te sirve la propuesta?</p>
              <p class="mt-1 text-sm text-gray-600">Si está todo bien, por favor aceptá y listo.</p>
              <form method="POST" action="?/accept" class="mt-4" use:enhance={enhanceWithFeedback()}>
                <Button type="submit" color="green" class="h-12 w-full text-base font-semibold">Aceptar</Button>
              </form>
            </Card>

            <Card size="xl" class="w-full p-4 shadow-sm">
              <p class="text-sm font-semibold text-gray-900">¿Querés rechazar?</p>
              <p class="mt-1 text-sm text-gray-600">Podés dejar un comentario opcional para mejorar la propuesta.</p>
              <form method="POST" action="?/reject" class="mt-4 space-y-3" use:enhance={enhanceWithFeedback()}>
                <div>
                  <Label for="rejectionReason">Motivo de rechazo (opcional)</Label>
                  <Textarea
                    id="rejectionReason"
                    name="rejectionReason"
                    rows={4}
                    maxlength={500}
                    class="w-full"
                    placeholder="Contanos por qué no te cerró la propuesta..."
                    value={rejectionDraft}
                  />
                </div>
                <Button type="submit" color="light" class="h-12 w-full text-base font-semibold">Rechazar presupuesto</Button>
              </form>
            </Card>
          </div>
        {:else}
          <Alert color="blue" class="mt-4">
            Este presupuesto ya no admite respuesta. Si necesitás una revisión, escribinos por WhatsApp.
          </Alert>
        {/if}
      {/if}
    </Card>
  </div>
</main>
