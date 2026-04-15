<script lang="ts">
  import { resolve } from '$app/paths';
  import { Alert, Button, Card, Input, Label, Textarea } from 'flowbite-svelte';

import { route } from '$lib/shared/navigation';
  type PageData = {
    tutor: {
      id: string;
      full_name: string;
      whatsapp_number: string;
      notes: string | null;
    };
  };

  type ActionData = {
    operatorError?: string;
    values?: {
      fullName: string;
      whatsappNumber: string;
      notes: string;
    };
  };

  let { data, form }: { data: PageData; form: ActionData | null } = $props();
  const tutorsPath = route('/tutors');

  const values = $derived({
    fullName: form?.values?.fullName ?? data.tutor.full_name,
    whatsappNumber: form?.values?.whatsappNumber ?? data.tutor.whatsapp_number,
    notes: form?.values?.notes ?? (data.tutor.notes ?? '')
  });
</script>

<Card size="xl" class="mx-auto max-w-3xl p-6 md:p-8 shadow-sm">
  <h1 class="mb-1 text-xl font-bold text-gray-900">Editar tutor</h1>
  <p class="mb-6 text-sm text-gray-600">Actualizá los datos del tutor seleccionado.</p>

  {#if form?.operatorError}
    <Alert color="red" class="mb-4">{form.operatorError}</Alert>
  {/if}

  <form method="POST" action="?/update" class="grid gap-4">
    <div>
      <Label for="fullName">Nombre completo</Label>
      <Input id="fullName" name="fullName" type="text" required value={values.fullName} />
    </div>

    <div>
      <Label for="whatsappNumber">WhatsApp</Label>
      <Input id="whatsappNumber" name="whatsappNumber" type="text" required value={values.whatsappNumber} />
    </div>

    <div>
      <Label for="notes">Notas</Label>
      <Textarea id="notes" name="notes" rows={3} class="w-full" value={values.notes} />
    </div>

    <div class="flex justify-end gap-2">
      <Button href={tutorsPath} color="light">Cancelar</Button>
      <Button type="submit">Guardar cambios</Button>
    </div>
  </form>
</Card>
