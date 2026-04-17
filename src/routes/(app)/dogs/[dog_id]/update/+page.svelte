<script lang="ts">
  import { Button, Input, Label, Select, Textarea } from 'flowbite-svelte';
  import FormShell from '$lib/components/admin/FormShell.svelte';

  import { route } from '$lib/shared/navigation';
  import { untrack } from 'svelte';

  type ScheduleEntry = {
    day_of_month: number;
    pct: number;
  };

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
    deliverySchedule: Array<{ day_of_month: number; pct: number }>;
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

  let scheduleEntries = $state<ScheduleEntry[]>([]);

  $effect(() => {
    const incoming = data.deliverySchedule.map((e) => ({ day_of_month: e.day_of_month, pct: e.pct }));
    untrack(() => {
      scheduleEntries = incoming;
    });
  });

  let totalPct = $derived(scheduleEntries.reduce((sum, e) => sum + (e.pct || 0), 0));
  let remainingPct = $derived(Math.max(100 - totalPct, 0));
  let isValid = $derived(
    totalPct <= 100 &&
    scheduleEntries.every(
      (e) => e.day_of_month >= 1 && e.day_of_month <= 31 && e.pct >= 1 && e.pct <= 100
    )
  );

  const scheduleJson = $derived(JSON.stringify(scheduleEntries));

  function addEntry() {
    scheduleEntries = [...scheduleEntries, { day_of_month: 1, pct: 0 }];
  }

  function removeEntry(index: number) {
    scheduleEntries = scheduleEntries.filter((_, i) => i !== index);
  }
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

  <div>
    <div class="mb-3 flex flex-wrap items-center gap-3">
      <Label class="mb-0">Calendario de entregas mensuales</Label>
      <Button type="button" size="xs" color="light" onclick={addEntry}>
        + Agregar fecha
      </Button>
    </div>

    {#if scheduleEntries.length > 0}
      <div class="mb-3 space-y-2">
        {#each scheduleEntries as entry, i (i)}
          <div class="flex items-start gap-3">
            <div class="flex flex-col gap-1">
              <Label for="day-{i}" class="text-xs">Día del mes</Label>
              <Input
                id="day-{i}"
                type="number"
                min="1"
                max="31"
                bind:value={entry.day_of_month}
                class="!w-20"
              />
            </div>
            <div class="flex flex-col gap-1">
              <Label class="text-xs">% a entregar</Label>
              <div class="flex items-center gap-1">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  bind:value={entry.pct}
                  class="!w-20"
                />
                <span class="text-sm text-gray-500">%</span>
              </div>
            </div>
            <Button
              type="button"
              size="xs"
              color="red"
              outline
              onclick={() => removeEntry(i)}
              aria-label="Eliminar fecha"
              class="mt-6"
            >
              ×
            </Button>
          </div>
        {/each}
      </div>

      <div class="flex items-center gap-4 text-sm">
        <span class:text-red-600={totalPct > 100} class:text-green-700={totalPct <= 100}>
          Total: {totalPct}%
        </span>
        {#if remainingPct > 0}
          <span class="text-gray-500">Restante: {remainingPct}%</span>
        {:else if totalPct === 100}
          <span class="text-green-600 font-medium">Completo ✓</span>
        {:else}
          <span class="text-red-600">Excede 100%</span>
        {/if}
      </div>
    {:else}
      <p class="text-sm text-gray-400 italic">Sin fechas de entrega configuradas.</p>
    {/if}

    <input type="hidden" name="deliverySchedule" value={scheduleJson} />
  </div>

  {#snippet actions()}
    <Button href={dogsPath} color="light">Cancelar</Button>
    <Button type="submit" disabled={submitting || totalPct > 100}>
      {submitting ? 'Guardando…' : 'Guardar cambios'}
    </Button>
  {/snippet}
</FormShell>
