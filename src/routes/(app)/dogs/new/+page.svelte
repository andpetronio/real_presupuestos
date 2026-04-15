<script lang="ts">
  import { resolve } from '$app/paths';
  import { Alert, Button, Card, Input, Label, Select, Textarea } from 'flowbite-svelte';

import { route } from '$lib/shared/navigation';
  type PageData = {
    tutorOptions: ReadonlyArray<{ id: string; full_name: string }>;
    veterinaryOptions: ReadonlyArray<{ id: string; name: string }>;
  };

  type ActionData = {
    operatorError?: string;
    values?: {
      tutorId: string;
      veterinaryId: string;
      name: string;
      dietType: string;
      mealsPerDay: string;
      notes: string;
    };
  };

  let { data, form }: { data: PageData; form: ActionData | null } = $props();
  const dogsPath = route('/dogs');

  const values = $derived({
    tutorId: form?.values?.tutorId ?? '',
    veterinaryId: form?.values?.veterinaryId ?? '',
    name: form?.values?.name ?? '',
    dietType: form?.values?.dietType ?? 'mixta',
    mealsPerDay: form?.values?.mealsPerDay ?? '',
    notes: form?.values?.notes ?? ''
  });
</script>

<Card size="xl" class="mx-auto max-w-3xl p-6 md:p-8 shadow-sm">
  <h1 class="mb-1 text-xl font-bold text-gray-900">Nuevo perro</h1>
  <p class="mb-6 text-sm text-gray-600">Completá los datos para dar de alta un perro.</p>

  {#if form?.operatorError}
    <Alert color="red" class="mb-4">{form.operatorError}</Alert>
  {/if}

  <form method="POST" action="?/create" class="grid gap-4">
    <div>
      <Label for="tutorId">Tutor</Label>
      <Select id="tutorId" name="tutorId" required value={values.tutorId}>
        {#each data.tutorOptions as tutor (tutor.id)}
          <option value={tutor.id}>{tutor.full_name}</option>
        {/each}
      </Select>
    </div>

    <div>
      <Label for="veterinaryId">Veterinaria</Label>
      <Select id="veterinaryId" name="veterinaryId" value={values.veterinaryId}>
        <option value="">Sin veterinaria</option>
        {#each data.veterinaryOptions as veterinary (veterinary.id)}
          <option value={veterinary.id}>{veterinary.name}</option>
        {/each}
      </Select>
    </div>

    <div>
      <Label for="name">Nombre del perro</Label>
      <Input id="name" name="name" type="text" required value={values.name} />
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div>
        <Label for="dietType">Tipo de dieta</Label>
        <Select id="dietType" name="dietType" required value={values.dietType}>
          <option value="mixta">Mixta</option>
          <option value="cocida">Cocida</option>
          <option value="barf">BARF</option>
        </Select>
      </div>

      <div>
        <Label for="mealsPerDay">Comidas diarias</Label>
        <Input id="mealsPerDay" name="mealsPerDay" type="number" min="1" step="1" required value={values.mealsPerDay} />
      </div>
    </div>

    <div>
      <Label for="notes">Notas</Label>
      <Textarea id="notes" name="notes" rows={3} class="w-full" value={values.notes} />
    </div>

    <div class="flex justify-end gap-2">
      <a href={dogsPath}><Button color="light">Cancelar</Button></a>
      <Button type="submit">Crear perro</Button>
    </div>
  </form>
</Card>
