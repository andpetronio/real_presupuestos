<script lang="ts">
  import { resolve } from '$app/paths';
  import { Alert, Button, Card, Input, Label } from 'flowbite-svelte';

import { route } from '$lib/shared/navigation';
  type ActionData = {
    operatorError?: string;
    values?: {
      name: string;
    };
  };

  let { form }: { form: ActionData | null } = $props();
  const veterinariesPath = route('/veterinaries');

  const values = $derived({
    name: form?.values?.name ?? ''
  });
</script>

<Card size="xl" class="mx-auto max-w-3xl p-6 md:p-8 shadow-sm">
  <h1 class="mb-1 text-xl font-bold text-gray-900">Nueva veterinaria</h1>
  <p class="mb-6 text-sm text-gray-600">Completá los datos para dar de alta una veterinaria.</p>

  {#if form?.operatorError}
    <Alert color="red" class="mb-4">{form.operatorError}</Alert>
  {/if}

  <form method="POST" action="?/create" class="grid gap-4">
    <div>
      <Label for="name">Nombre</Label>
      <Input id="name" name="name" type="text" required value={values.name} />
    </div>

    <div class="flex justify-end gap-2">
      <Button href={veterinariesPath} color="light">Cancelar</Button>
      <Button type="submit">Crear veterinaria</Button>
    </div>
  </form>
</Card>
