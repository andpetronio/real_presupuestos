<script lang="ts">
  import { resolve } from '$app/paths';
  import { Alert, Button, Card, Input, Label } from 'flowbite-svelte';

import { route } from '$lib/shared/navigation';
  type PageData = {
    veterinary: {
      id: string;
      name: string;
    };
  };

  type ActionData = {
    operatorError?: string;
    values?: {
      name: string;
    };
  };

  let { data, form }: { data: PageData; form: ActionData | null } = $props();
  const veterinariesPath = route('/veterinaries');

  const values = $derived({
    name: form?.values?.name ?? data.veterinary.name
  });
</script>

<Card size="xl" class="mx-auto max-w-3xl p-6 md:p-8 shadow-sm">
  <h1 class="mb-1 text-xl font-bold text-gray-900">Editar veterinaria</h1>
  <p class="mb-6 text-sm text-gray-600">Actualizá los datos de la veterinaria seleccionada.</p>

  {#if form?.operatorError}
    <Alert color="red" class="mb-4">{form.operatorError}</Alert>
  {/if}

  <form method="POST" action="?/update" class="grid gap-4">
    <div>
      <Label for="name">Nombre</Label>
      <Input id="name" name="name" type="text" required value={values.name} />
    </div>

    <div class="flex justify-end gap-2">
      <Button href={veterinariesPath} color="light">Cancelar</Button>
      <Button type="submit">Guardar cambios</Button>
    </div>
  </form>
</Card>
