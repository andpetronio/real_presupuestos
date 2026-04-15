<script lang="ts">
  import { Card, Button } from 'flowbite-svelte';
  import { route } from '$lib/shared/navigation';

  type TutorRow = {
    id: string;
    full_name: string;
    whatsapp_number: string;
    notes: string | null;
    created_at: string;
  };

  type TutorMobileCardsProps = {
    tutors: ReadonlyArray<TutorRow>;
  };

  let { tutors }: TutorMobileCardsProps = $props();
</script>

<div class="space-y-3 md:hidden" aria-label="Lista de tutores">
  {#each tutors as tutor (tutor.id)}
    <Card class="p-4" role="listitem">
      <!-- Nombre -->
      <div class="mb-3">
        <p class="font-semibold text-gray-900">{tutor.full_name}</p>
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
      </div>
    </Card>
  {/each}
</div>