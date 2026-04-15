<script lang="ts">
  import { Card, Button } from 'flowbite-svelte';
  import { route } from '$lib/shared/navigation';

  type VeterinaryRow = {
    id: string;
    name: string;
    created_at: string;
  };

  type VeterinaryMobileCardsProps = {
    veterinaries: ReadonlyArray<VeterinaryRow>;
  };

  let { veterinaries }: VeterinaryMobileCardsProps = $props();
</script>

<div class="space-y-3 md:hidden" aria-label="Lista de veterinarias">
  {#each veterinaries as veterinary (veterinary.id)}
    <Card class="p-4" role="listitem">
      <!-- Nombre -->
      <div class="mb-3">
        <p class="font-semibold text-gray-900">{veterinary.name}</p>
      </div>

      <!-- Acciones -->
      <div class="flex flex-wrap gap-2">
        <Button
          href={route('/veterinaries/', veterinary.id, '/update')}
          size="xs"
          color="light"
          aria-label="Editar {veterinary.name}"
        >
          Editar
        </Button>
      </div>
    </Card>
  {/each}
</div>