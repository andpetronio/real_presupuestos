<script lang="ts">
  import { Button, Input, Label, Select, Textarea } from 'flowbite-svelte';
  import FormShell from '$lib/components/admin/FormShell.svelte';

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

  let submitting = $state(false);
</script>

<FormShell
  title="Nuevo perro"
  description="Completá los datos para dar de alta un perro."
  action="?/create"
  method="POST"
  form={form as any}
  primaryLabel="Crear perro"
>
  <div>
    <Label for="tutorId" class="mb-1">Tutor</Label>
    <Select id="tutorId" name="tutorId" required value={values.tutorId}>
      {#each data.tutorOptions as tutor (tutor.id)}
        <option value={tutor.id}>{tutor.full_name}</option>
      {/each}
    </Select>
  </div>

  <div>
    <Label for="veterinaryId" class="mb-1">Veterinaria</Label>
    <Select id="veterinaryId" name="veterinaryId" value={values.veterinaryId}>
      <option value="">Sin veterinaria</option>
      {#each data.veterinaryOptions as veterinary (veterinary.id)}
        <option value={veterinary.id}>{veterinary.name}</option>
      {/each}
    </Select>
  </div>

  <div>
    <Label for="name" class="mb-1">Nombre del perro</Label>
    <Input id="name" name="name" type="text" required value={values.name} />
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    <div>
      <Label for="dietType" class="mb-1">Tipo de dieta</Label>
      <Select id="dietType" name="dietType" required value={values.dietType}>
        <option value="mixta">Mixta</option>
        <option value="cocida">Cocida</option>
        <option value="barf">BARF</option>
      </Select>
    </div>

    <div>
      <Label for="mealsPerDay" class="mb-1">Comidas diarias</Label>
      <Input id="mealsPerDay" name="mealsPerDay" type="number" min="1" step="1" required value={values.mealsPerDay} />
    </div>
  </div>

  <div>
    <Label for="notes" class="mb-1">Notas</Label>
    <Textarea id="notes" name="notes" rows={3} class="w-full" value={values.notes} />
  </div>

  {#snippet actions()}
    <Button href={dogsPath} color="light">Cancelar</Button>
    <Button type="submit" disabled={submitting}>
      {submitting ? 'Guardando…' : 'Crear perro'}
    </Button>
  {/snippet}
</FormShell>
