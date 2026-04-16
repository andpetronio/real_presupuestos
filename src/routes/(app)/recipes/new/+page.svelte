<script lang="ts">
  import { Button, Input, Label, Select, Textarea } from 'flowbite-svelte';
  import FormShell from '$lib/components/admin/FormShell.svelte';

  import { route } from '$lib/shared/navigation';
  type DogOption = { id: string; name: string; tutorName: string };
  type RawMaterialOption = { id: string; name: string; baseUnit: string };
  type RecipeItemDraft = { rawMaterialId: string; dailyQuantity: string };

  type PageData = {
    dogOptions: ReadonlyArray<DogOption>;
    rawMaterialOptions: ReadonlyArray<RawMaterialOption>;
  };

  type ActionData = {
    operatorError?: string;
    values?: {
      dogId: string;
      name: string;
      notes: string;
      items: Array<RecipeItemDraft>;
    };
  };

  let { data, form }: { data: PageData; form: ActionData | null } = $props();
  const recipesPath = route('/recipes');

  const values = $derived({
    dogId: form?.values?.dogId ?? '',
    name: form?.values?.name ?? '',
    notes: form?.values?.notes ?? ''
  });

  // Reactive sync happens via $effect below (form repopulation after validation error).
  // svelte-ignore state_referenced_locally
  let recipeItems = $state<Array<RecipeItemDraft>>(
    form?.values?.items?.length ? [...form.values.items] : [{ rawMaterialId: '', dailyQuantity: '' }]
  );

  // Sync when form re-renders after server validation error.
  // Cannot use $derived here because recipeItems is independently mutated by addRow/removeRow/updateRow.
  $effect(() => {
    if (form?.values?.items) {
      recipeItems = [...form.values.items];
    }
  });

  const addRow = () => {
    recipeItems = [...recipeItems, { rawMaterialId: '', dailyQuantity: '' }];
  };

  const removeRow = (index: number) => {
    if (recipeItems.length <= 1) return;
    recipeItems = recipeItems.filter((_, rowIndex) => rowIndex !== index);
  };

  const updateRow = (index: number, field: keyof RecipeItemDraft, value: string) => {
    recipeItems = recipeItems.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row));
  };

  let submitting = $state(false);
</script>

<FormShell
  title="Nueva receta"
  description="Asociá una receta a un perro y definí sus materias primas."
  action="?/create"
  method="POST"
  form={form as any}
  primaryLabel="Crear receta"
>
  <div class="grid gap-1">
    <Label for="dogId" class="mb-1">Perro</Label>
    <Select id="dogId" name="dogId" required value={values.dogId}>
      {#each data.dogOptions as dog (dog.id)}
        <option value={dog.id}>{dog.name} — {dog.tutorName}</option>
      {/each}
    </Select>
  </div>

  <div class="grid gap-1">
    <Label for="name" class="mb-1">Nombre receta</Label>
    <Input id="name" name="name" type="text" required value={values.name} />
  </div>

  <div class="grid gap-1">
    <Label for="notes" class="mb-1">Notas</Label>
    <Textarea id="notes" name="notes" rows={2} class="w-full" value={values.notes} />
  </div>

  <div class="grid gap-3 rounded-lg border border-gray-200 p-4">
    <p class="text-sm font-semibold text-gray-900">Materias primas y cantidades</p>
    {#each recipeItems as item, index (`create-${index}`)}
      <div class="grid gap-2 md:grid-cols-[2fr_1fr_auto] md:items-end">
        <div class="grid gap-1">
          <Label for={`rawMaterial-${index}`} class="mb-1">Materia prima</Label>
          <Select
            id={`rawMaterial-${index}`}
            name="rawMaterialId"
            required
            value={item.rawMaterialId}
            onchange={(event) => updateRow(index, 'rawMaterialId', (event.currentTarget as HTMLSelectElement).value)}
          >
            {#each data.rawMaterialOptions as material (material.id)}
              <option value={material.id}>{material.name} ({material.baseUnit})</option>
            {/each}
          </Select>
        </div>

        <div class="grid gap-1">
          <Label for={`dailyQuantity-${index}`} class="mb-1">Cantidad diaria</Label>
          <Input
            id={`dailyQuantity-${index}`}
            name="dailyQuantity"
            type="number"
            min="0.001"
            step="0.001"
            required
            value={item.dailyQuantity}
            oninput={(event) => updateRow(index, 'dailyQuantity', (event.currentTarget as HTMLInputElement).value)}
          />
        </div>

        <Button type="button" color="light" onclick={() => removeRow(index)}>Quitar</Button>
      </div>
    {/each}
    <div>
      <Button type="button" color="light" onclick={addRow}>Agregar materia prima</Button>
    </div>
  </div>

  {#snippet actions()}
    <Button href={recipesPath} color="light">Cancelar</Button>
    <Button type="submit" disabled={submitting}>
      {submitting ? 'Guardando…' : 'Crear receta'}
    </Button>
  {/snippet}
</FormShell>
