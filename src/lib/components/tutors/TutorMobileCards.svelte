<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Card, Button } from 'flowbite-svelte';
  import ActiveStatusBadge from '$lib/components/admin/ActiveStatusBadge.svelte';
  import { route } from '$lib/shared/navigation';
  import { closeBlockingLoader, confirmAlert, presentActionFeedback, showBlockingLoader } from '$lib/shared/alerts';

  type TutorRow = {
    id: string;
    full_name: string;
    whatsapp_number: string;
    notes: string | null;
    is_active: boolean;
    created_at: string;
  };

  type TutorMobileCardsProps = {
    tutors: ReadonlyArray<TutorRow>;
  };

  let { tutors }: TutorMobileCardsProps = $props();

  const enhanceStatusAction = (params: {
    title: string;
    text: string;
    confirmButtonText: string;
  }) => {
    return async ({ cancel }: { cancel: () => void }) => {
      const confirmed = await confirmAlert(params);
      if (!confirmed) {
        cancel();
        return;
      }

      void showBlockingLoader();

      return async ({ result }: { result: import('@sveltejs/kit').ActionResult }) => {
        await closeBlockingLoader();
        await applyAction(result);
        await presentActionFeedback(result);
        if (result.type === 'success') {
          await invalidateAll();
        }
      };
    };
  };
</script>

<div class="space-y-3 md:hidden" aria-label="Lista de tutores">
  {#each tutors as tutor (tutor.id)}
    <Card class="p-4" role="listitem">
      <!-- Nombre -->
      <div class="mb-3 flex items-start justify-between gap-2">
        <p class="font-semibold text-gray-900">{tutor.full_name}</p>
        <ActiveStatusBadge isActive={tutor.is_active} />
      </div>

      <!-- WhatsApp -->
      <div class="mb-3 text-sm">
        <p class="text-xs text-gray-500">WhatsApp</p>
        <p class="font-medium">{tutor.whatsapp_number}</p>
      </div>

      <!-- Notas (preview) -->
      {#if tutor.notes}
        <div class="mb-3 text-sm">
          <p class="text-xs text-gray-500">Notas</p>
          <p class="text-gray-600 line-clamp-2">{tutor.notes}</p>
        </div>
      {/if}

      <!-- Acciones -->
      <div class="flex flex-wrap gap-2">
        <Button
          href={route('/tutors/', tutor.id, '/update')}
          size="xs"
          color="light"
          aria-label="Editar {tutor.full_name}"
        >
          Editar
        </Button>
        {#if tutor.is_active}
          <form method="POST" action="?/delete" use:enhance={enhanceStatusAction({
            title: 'Desactivar tutor',
            text: 'Esto desactivara tambien todos sus perros y recetas.',
            confirmButtonText: 'Si, desactivar'
          })}>
            <input type="hidden" name="tutorId" value={tutor.id} />
            <Button type="submit" size="xs" color="red" aria-label="Desactivar {tutor.full_name}">
              Desactivar
            </Button>
          </form>
        {:else}
          <form method="POST" action="?/restore" use:enhance={enhanceStatusAction({
            title: 'Restaurar tutor',
            text: 'Esto reactivara en cascada todos sus perros y recetas.',
            confirmButtonText: 'Si, restaurar'
          })}>
            <input type="hidden" name="tutorId" value={tutor.id} />
            <Button type="submit" size="xs" color="blue" aria-label="Restaurar {tutor.full_name}">
              Restaurar
            </Button>
          </form>
        {/if}
      </div>
    </Card>
  {/each}
</div>
