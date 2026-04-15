<script lang="ts">
  import { Alert, Button, Card, Input, Label, Select, Textarea } from 'flowbite-svelte';
  import { formatArs } from '$lib/shared/currency';
  import { sumOperationalCost } from '$lib/shared/costs';
  import { route } from '$lib/shared/navigation';
  import type { TutorOption, DogOption, RecipeOption } from '$lib/server/budgets/queries';
  import type { CompositionRow } from '$lib/server/budgets/types';
  import CompositionEditor from '$lib/components/budgets/CompositionEditor.svelte';

  type PageData = {
    tutorOptions: ReadonlyArray<TutorOption>;
    dogOptions: ReadonlyArray<DogOption>;
    recipeOptions: ReadonlyArray<RecipeOption>;
    settings: {
      vacuum_bag_small_unit_cost: number;
      vacuum_bag_large_unit_cost: number;
      label_unit_cost: number;
      non_woven_bag_unit_cost: number;
      labor_hour_cost: number;
      cooking_hour_cost: number;
      calcium_unit_cost: number;
      kefir_unit_cost: number;
      default_requested_days?: number;
    } | null;
  };

  type ActionData = {
    actionType?: 'create';
    operatorError?: string;
    values?: {
      tutorId: string;
      budgetMonth: string;
      budgetDays: string;
      notes: string;
      vacuumBagSmallQty: string;
      vacuumBagLargeQty: string;
      labelsQty: string;
      nonWovenBagQty: string;
      laborHoursQty: string;
      cookingHoursQty: string;
      calciumQty: string;
      kefirQty: string;
      rows: Array<CompositionRow>;
    };
  };

  let { data, form }: { data: PageData; form: ActionData | null } = $props();
  const budgetsPath = route('/budgets');
  const currentMonth = new Date().toISOString().slice(0, 7);

  const values = $derived({
    tutorId: form?.values?.tutorId ?? '',
    budgetMonth: form?.values?.budgetMonth ?? currentMonth,
    budgetDays: form?.values?.budgetDays ?? String(data.settings?.default_requested_days ?? 30),
    notes: form?.values?.notes ?? '',
    vacuumBagSmallQty: form?.values?.vacuumBagSmallQty ?? '',
    vacuumBagLargeQty: form?.values?.vacuumBagLargeQty ?? '',
    labelsQty: form?.values?.labelsQty ?? '',
    nonWovenBagQty: form?.values?.nonWovenBagQty ?? '',
    laborHoursQty: form?.values?.laborHoursQty ?? '',
    cookingHoursQty: form?.values?.cookingHoursQty ?? '',
    calciumQty: form?.values?.calciumQty ?? '',
    kefirQty: form?.values?.kefirQty ?? ''
  });

  const initialRows = $derived(form?.values?.rows?.length ? [...form.values.rows] : [{ dogId: '', recipeId: '', assignedDays: '' }]);
  const initialTutor = $derived(values.tutorId);

  // State managed by CompositionEditor via bind
  let tutorSelected = $state('');
  let rows = $state<Array<CompositionRow>>([{ dogId: '', recipeId: '', assignedDays: '' }]);

  const costPreview = $derived(
    data.settings
      ? sumOperationalCost(
          {
            vacuumBagSmallQty: Number(values.vacuumBagSmallQty) || 0,
            vacuumBagLargeQty: Number(values.vacuumBagLargeQty) || 0,
            labelsQty: Number(values.labelsQty) || 0,
            nonWovenBagQty: Number(values.nonWovenBagQty) || 0,
            laborHoursQty: Number(values.laborHoursQty) || 0,
            cookingHoursQty: Number(values.cookingHoursQty) || 0,
            calciumQty: Number(values.calciumQty) || 0,
            kefirQty: Number(values.kefirQty) || 0
          },
          data.settings
        )
      : 0
  );
</script>

<Card size="xl" class="mx-auto max-w-6xl p-6 md:p-8 shadow-sm">
  <h1 class="mb-1 text-xl font-bold text-gray-900">Nuevo presupuesto</h1>
  <p class="mb-6 text-sm text-gray-600">Seleccioná tutor, composición por perro/receta y costos globales.</p>

  {#if form?.operatorError}
    <Alert color="red" class="mb-4">{form.operatorError}</Alert>
  {/if}

  <form method="POST" action="?/create" class="grid gap-4">
    <div class="grid gap-1">
      <Label for="tutorId">Tutor</Label>
      <Select
        id="tutorId"
        name="tutorId"
        required
        value={tutorSelected}
        onchange={(event) => {
          tutorSelected = (event.currentTarget as HTMLSelectElement).value;
          // Clear dog and recipe selections when tutor changes
          rows = rows.map((row) => ({ ...row, dogId: '', recipeId: '' }));
        }}
      >
        <option value="">Seleccionar tutor</option>
        {#each data.tutorOptions as tutor (tutor.id)}
          <option value={tutor.id}>{tutor.fullName}</option>
        {/each}
      </Select>
    </div>

    <div class="grid gap-3 rounded-lg border border-gray-200 p-4 md:grid-cols-2">
      <div class="grid gap-1">
        <Label for="budgetMonth">Mes del presupuesto</Label>
        <Input id="budgetMonth" name="budgetMonth" type="month" required value={values.budgetMonth} />
      </div>
      <div class="grid gap-1">
        <Label for="budgetDays">Días del presupuesto</Label>
        <Input id="budgetDays" name="budgetDays" type="number" min="1" step="1" required value={values.budgetDays} />
      </div>
    </div>

    <CompositionEditor
      bind:rows
      bind:tutorSelected
      {initialRows}
      {initialTutor}
      dogOptions={data.dogOptions}
      recipeOptions={data.recipeOptions}
      keyPrefix="create"
    />

    <div class="grid gap-3 rounded-lg border border-gray-200 p-4">
      <p class="text-sm font-semibold text-gray-900">Costos globales del presupuesto</p>
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div class="grid gap-1"><Label for="vacuumBagSmallQty">Bolsas vacío chicas</Label><Input id="vacuumBagSmallQty" name="vacuumBagSmallQty" type="number" min="0" step="0.001" value={values.vacuumBagSmallQty} /></div>
        <div class="grid gap-1"><Label for="vacuumBagLargeQty">Bolsas vacío grandes</Label><Input id="vacuumBagLargeQty" name="vacuumBagLargeQty" type="number" min="0" step="0.001" value={values.vacuumBagLargeQty} /></div>
        <div class="grid gap-1"><Label for="labelsQty">Etiquetas</Label><Input id="labelsQty" name="labelsQty" type="number" min="0" step="0.001" value={values.labelsQty} /></div>
        <div class="grid gap-1"><Label for="nonWovenBagQty">Bolsas de fiselina</Label><Input id="nonWovenBagQty" name="nonWovenBagQty" type="number" min="0" step="0.001" value={values.nonWovenBagQty} /></div>
        <div class="grid gap-1"><Label for="laborHoursQty">Horas mano de obra</Label><Input id="laborHoursQty" name="laborHoursQty" type="number" min="0" step="0.001" value={values.laborHoursQty} /></div>
        <div class="grid gap-1"><Label for="cookingHoursQty">Horas cocción</Label><Input id="cookingHoursQty" name="cookingHoursQty" type="number" min="0" step="0.001" value={values.cookingHoursQty} /></div>
        <div class="grid gap-1"><Label for="calciumQty">Calcio (u)</Label><Input id="calciumQty" name="calciumQty" type="number" min="0" step="0.001" value={values.calciumQty} /></div>
        <div class="grid gap-1"><Label for="kefirQty">Kefir (u)</Label><Input id="kefirQty" name="kefirQty" type="number" min="0" step="0.001" value={values.kefirQty} /></div>
      </div>
      <p class="text-sm text-gray-600">Costo operativo estimado: {formatArs(costPreview)}</p>
    </div>

    <div class="grid gap-1">
      <Label for="notes">Notas</Label>
      <Textarea id="notes" name="notes" rows={2} class="w-full" value={values.notes} />
    </div>

    <div class="flex justify-end gap-2">
      <Button href={budgetsPath} color="light">Cancelar</Button>
      <Button type="submit">Crear borrador</Button>
    </div>
  </form>
</Card>
