<script lang="ts">
  import { Button, Input, Label, Select, Textarea } from 'flowbite-svelte';
  import FormShell from '$lib/components/admin/FormShell.svelte';

  import { route } from '$lib/shared/navigation';
  type PageData = {
    dog: {
      id: string;
      tutor_id: string;
      veterinary_id: string | null;
      name: string;
      diet_type: 'mixta' | 'cocida' | 'barf';
      meals_per_day: number;
      notes: string | null;
    };
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
    tutorId: form?.values?.tutorId ?? data.dog.tutor_id,
    veterinaryId: form?.values?.veterinaryId ?? (data.dog.veterinary_id ?? ''),
    name: form?.values?.name ?? data.dog.name,
    dietType: form?.values?.dietType ?? data.dog.diet_type,
    mealsPerDay: form?.values?.mealsPerDay ?? String(data.dog.meals_per_day),
    notes: form?.values?.notes ?? (data.dog.notes ?? '')
  });

  let submitting = $state(false);
</script>

<FormShell
  title="Editar perro"
  description="Actualizá los datos del perro seleccionado."
  action="?/update"
  method="POST"
  form={form as any}
  primaryLabel="Guardar cambios"
>
  <div>
    <Label for="tutorId" class="mb-1">Tutor</Label>
    <Select id="tutorId" name="tutorId" required value={values.tutorId}>
      <option value="">Seleccionar tutor</option>
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
      {submitting ? 'Guardando…' : 'Guardar cambios'}
    </Button>
  {/snippet}
</FormShell>
