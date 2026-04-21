<script lang="ts">
  import { Button, Input, Label, Select, Textarea } from 'flowbite-svelte';
  import FormShell from '$lib/components/admin/FormShell.svelte';
  import { formatArs } from '$lib/shared/currency';
  import { sumOperationalCost } from '$lib/shared/costs';
  import { route } from '$lib/shared/navigation';
  import type { TutorOption, DogOption, RecipeOption } from '$lib/server/budgets/queries';
  import type { CompositionRow } from '$lib/server/budgets/types';
  import CompositionEditor from '$lib/components/budgets/CompositionEditor.svelte';
  import { didTutorChange, resetRowsForTutorChange } from '$lib/components/budgets/composition-editor.logic';

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
    budget: {
      id: string;
      tutor_id: string | null;
      reference_month?: string | null;
      reference_days?: number | null;
      notes: string | null;
      vacuum_bag_small_qty?: number;
      vacuum_bag_large_qty?: number;
      labels_qty?: number;
      non_woven_bag_qty?: number;
      labor_hours_qty?: number;
      cooking_hours_qty?: number;
      calcium_qty?: number;
      kefir_qty?: number;
    };
    editingRows: ReadonlyArray<CompositionRow>;
  };

  type ActionData = {
    actionType?: 'update';
    operatorError?: string;
    values?: {
      budgetId?: string;
      tutorId: string;
      budgetMonth: string;
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
    budgetId: form?.values?.budgetId ?? data.budget.id,
    tutorId: form?.values?.tutorId ?? (data.budget.tutor_id ?? ''),
    budgetMonth: form?.values?.budgetMonth ?? (data.budget.reference_month?.slice(0, 7) ?? currentMonth),
    notes: form?.values?.notes ?? (data.budget.notes ?? ''),
    vacuumBagSmallQty: form?.values?.vacuumBagSmallQty ?? String(data.budget.vacuum_bag_small_qty ?? ''),
    vacuumBagLargeQty: form?.values?.vacuumBagLargeQty ?? String(data.budget.vacuum_bag_large_qty ?? ''),
    labelsQty: form?.values?.labelsQty ?? String(data.budget.labels_qty ?? ''),
    nonWovenBagQty: form?.values?.nonWovenBagQty ?? String(data.budget.non_woven_bag_qty ?? ''),
    laborHoursQty: form?.values?.laborHoursQty ?? String(data.budget.labor_hours_qty ?? ''),
    cookingHoursQty: form?.values?.cookingHoursQty ?? String(data.budget.cooking_hours_qty ?? ''),
    calciumQty: form?.values?.calciumQty ?? String(data.budget.calcium_qty ?? ''),
    kefirQty: form?.values?.kefirQty ?? String(data.budget.kefir_qty ?? '')
  });

  const initialRows = $derived(
    form?.values?.rows?.length
      ? [...form.values.rows]
      : data.editingRows.length
        ? [...data.editingRows]
        : [{ dogId: '', recipeId: '', assignedDays: '' }]
  );

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

  let submitting = $state(false);
</script>

<FormShell
  title="Editar presupuesto"
  description="Ajustá composición y costos globales del borrador seleccionado."
  action="?/update"
  method="POST"
  form={form}
  primaryLabel="Guardar borrador"
>
  <input type="hidden" name="budgetId" value={values.budgetId} />

  <div class="grid gap-1">
    <Label for="tutorId" class="mb-1">Tutor</Label>
    <Select
      id="tutorId"
      name="tutorId"
      required
      value={tutorSelected}
      onchange={(event) => {
        const nextTutorId = (event.currentTarget as HTMLSelectElement).value;
        if (!didTutorChange(tutorSelected, nextTutorId)) return;

        tutorSelected = nextTutorId;
        rows = resetRowsForTutorChange(rows);
      }}
    >
      <option value="">Seleccionar tutor</option>
      {#each data.tutorOptions as tutor (tutor.id)}
        <option value={tutor.id}>{tutor.fullName}</option>
      {/each}
    </Select>
  </div>

  <div class="grid gap-3 rounded-lg border border-gray-200 p-4 md:grid-cols-1">
    <div class="grid gap-1">
      <Label for="budgetMonth" class="mb-1">Mes del presupuesto</Label>
      <Input id="budgetMonth" name="budgetMonth" type="month" required value={values.budgetMonth} />
    </div>
  </div>

  <CompositionEditor
    bind:rows
    bind:tutorSelected
    {initialRows}
    {initialTutor}
    dogOptions={data.dogOptions}
    recipeOptions={data.recipeOptions}
    keyPrefix="edit"
  />

  <div class="grid gap-3 rounded-lg border border-gray-200 p-4">
    <p class="text-sm font-semibold text-gray-900">Costos globales del presupuesto</p>
    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div class="grid gap-1"><Label for="vacuumBagSmallQty" class="mb-1">Bolsas vacío chicas</Label><Input id="vacuumBagSmallQty" name="vacuumBagSmallQty" type="number" min="0" step="0.001" value={values.vacuumBagSmallQty} /></div>
      <div class="grid gap-1"><Label for="vacuumBagLargeQty" class="mb-1">Bolsas vacío grandes</Label><Input id="vacuumBagLargeQty" name="vacuumBagLargeQty" type="number" min="0" step="0.001" value={values.vacuumBagLargeQty} /></div>
      <div class="grid gap-1"><Label for="labelsQty" class="mb-1">Etiquetas</Label><Input id="labelsQty" name="labelsQty" type="number" min="0" step="0.001" value={values.labelsQty} /></div>
      <div class="grid gap-1"><Label for="nonWovenBagQty" class="mb-1">Bolsas de fiselina</Label><Input id="nonWovenBagQty" name="nonWovenBagQty" type="number" min="0" step="0.001" value={values.nonWovenBagQty} /></div>
      <div class="grid gap-1"><Label for="laborHoursQty" class="mb-1">Horas mano de obra</Label><Input id="laborHoursQty" name="laborHoursQty" type="number" min="0" step="0.001" value={values.laborHoursQty} /></div>
      <div class="grid gap-1"><Label for="cookingHoursQty" class="mb-1">Horas cocción</Label><Input id="cookingHoursQty" name="cookingHoursQty" type="number" min="0" step="0.001" value={values.cookingHoursQty} /></div>
      <div class="grid gap-1"><Label for="calciumQty" class="mb-1">Calcio (u)</Label><Input id="calciumQty" name="calciumQty" type="number" min="0" step="0.001" value={values.calciumQty} /></div>
      <div class="grid gap-1"><Label for="kefirQty" class="mb-1">Kefir (u)</Label><Input id="kefirQty" name="kefirQty" type="number" min="0" step="0.001" value={values.kefirQty} /></div>
    </div>
    <p class="text-sm text-gray-600">Costo operativo estimado: {formatArs(costPreview)}</p>
  </div>

  <div class="grid gap-1">
    <Label for="notes" class="mb-1">Notas</Label>
    <Textarea id="notes" name="notes" rows={2} class="w-full" value={values.notes} />
  </div>

  {#snippet actions()}
    <Button href={budgetsPath} color="light">Cancelar</Button>
    <Button type="submit" disabled={submitting}>
      {submitting ? 'Guardando…' : 'Guardar borrador'}
    </Button>
  {/snippet}
</FormShell>
