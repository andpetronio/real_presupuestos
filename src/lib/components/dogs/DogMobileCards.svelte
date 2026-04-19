<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { Card, Button } from 'flowbite-svelte';
  import { route } from '$lib/shared/navigation';
  import { closeBlockingLoader, confirmAlert, presentActionFeedback, showBlockingLoader } from '$lib/shared/alerts';

  type DogRow = {
    id: string;
    name: string;
    diet_type: 'mixta' | 'cocida' | 'barf';
    meals_per_day: number;
    is_active: boolean;
    tutor: { full_name: string } | null;
    veterinary: { name: string } | null;
  };

  type DogMobileCardsProps = {
    dogs: ReadonlyArray<DogRow>;
  };

  let { dogs }: DogMobileCardsProps = $props();

  const enhanceDelete = () => {
    return async ({ cancel }: { cancel: () => void }) => {
      const confirmed = await confirmAlert({
        title: 'Desactivar perro',
        text: 'El perro quedara inactivo para nuevos presupuestos.',
        confirmButtonText: 'Si, desactivar'
      });

      if (!confirmed) {
        cancel();
        return;
      }

      void showBlockingLoader();

      return async ({ result }: { result: import('@sveltejs/kit').ActionResult }) => {
        await closeBlockingLoader();
        await applyAction(result);
        await presentActionFeedback(result);
      };
    };
  };
</script>

<div class="space-y-3 md:hidden" aria-label="Lista de perros">
  {#each dogs as dog (dog.id)}
    <Card class="p-4" role="listitem">
      <!-- Nombre + Estado -->
      <div class="mb-3 flex items-start justify-between gap-2">
        <p class="font-semibold text-gray-900">{dog.name}</p>
        <span
          class={dog.is_active
            ? 'rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700'
            : 'rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600'}
        >
          {dog.is_active ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      <!-- Tutor -->
      <div class="mb-3 text-sm">
        <p class="text-xs text-gray-500">Tutor</p>
        <p class="font-medium">{dog.tutor?.full_name ?? 'Sin tutor'}</p>
      </div>

      <!-- Diet type + Meals -->
      <div class="mb-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p class="text-xs text-gray-500">Tipo dieta</p>
          <p class="font-medium">{dog.diet_type.toUpperCase()}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Comidas/día</p>
          <p class="font-medium">{dog.meals_per_day}</p>
        </div>
      </div>

      <!-- Veterinaria -->
      <div class="mb-3 text-sm">
        <p class="text-xs text-gray-500">Veterinaria</p>
        <p class="font-medium">{dog.veterinary?.name ?? 'Sin veterinaria'}</p>
      </div>

      <!-- Acciones -->
      <div class="flex flex-wrap gap-2">
        <Button
          href={route('/dogs/', dog.id, '/history')}
          size="xs"
          color="light"
          aria-label="Ver {dog.name}"
        >
          Ver
        </Button>
        <Button
          href={route('/dogs/', dog.id, '/update')}
          size="xs"
          color="light"
          aria-label="Editar {dog.name}"
        >
          Editar
        </Button>
        {#if dog.is_active}
          <form
            method="POST"
            action="?/delete"
            use:enhance={enhanceDelete()}
          >
            <input type="hidden" name="dogId" value={dog.id} />
            <Button type="submit" size="xs" color="red" aria-label="Desactivar {dog.name}">
              Eliminar
            </Button>
          </form>
        {/if}
      </div>
    </Card>
  {/each}
</div>
