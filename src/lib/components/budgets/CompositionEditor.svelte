<script lang="ts">
  import { Button, Input, Label, Select } from 'flowbite-svelte';
  import type { CompositionRow } from '$lib/server/budgets/types';
  import type { DogOption, RecipeOption } from '$lib/server/budgets/queries';
  import { syncRowOnDogChange } from '$lib/components/budgets/composition-editor.logic';

  type Props = {
    // tutorOptions intentionally omitted - tutor dropdown lives in parent page
    dogOptions: ReadonlyArray<DogOption>;
    recipeOptions: ReadonlyArray<RecipeOption>;
    initialRows?: Array<CompositionRow>;
    initialTutor?: string;
    keyPrefix?: 'create' | 'edit';
    disabled?: boolean;
    rows?: Array<CompositionRow>;
    tutorSelected?: string;
    onRowsChange?: (rows: Array<CompositionRow>) => void;
    onTutorChange?: (tutorId: string) => void;
  };

  let {
    dogOptions,
    recipeOptions,
    initialRows = [{ dogId: '', recipeId: '', assignedDays: '' }],
    initialTutor = '',
    keyPrefix = 'create',
    disabled = false,
    rows = $bindable([]),
    tutorSelected = $bindable(''),
    onRowsChange,
    onTutorChange
  }: Props = $props();

  // Derived helpers
  const getDogsForTutor = (tutorId: string) => dogOptions.filter((dog) => dog.tutorId === tutorId);
  const getRecipesForDog = (dogId: string) => recipeOptions.filter((recipe) => recipe.dogId === dogId);

  // Sync when initial values change (e.g., after server validation error)
  $effect(() => {
    rows = [...initialRows];
    tutorSelected = initialTutor;
  });

  // Internal handlers
  const addRow = () => {
    rows = [...rows, { dogId: '', recipeId: '', assignedDays: '' }];
    onRowsChange?.(rows);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    rows = rows.filter((_, rowIndex) => rowIndex !== index);
    onRowsChange?.(rows);
  };

  const updateRow = (index: number, field: keyof CompositionRow, value: string) => {
    rows = rows.map((row, rowIndex) => {
      if (rowIndex !== index) return row;

      if (field === 'dogId') {
        return syncRowOnDogChange({
          row,
          nextDogId: value,
          recipeOptions
        });
      }

      return { ...row, [field]: value };
    });
    onRowsChange?.(rows);
  };
</script>

<div class="grid gap-3 rounded-lg border border-gray-200 p-4">
  <p class="text-sm font-semibold text-gray-900">Recetas asignadas (por perro y días)</p>

  {#each rows as row, index (`${keyPrefix}-${index}`)}
    <div class="grid gap-2 md:grid-cols-[2fr_2fr_1fr_auto] md:items-end">
      <div class="grid gap-1">
        <Label for={`rowDog-${index}`}>Perro</Label>
        <Select
          id={`rowDog-${index}`}
          name="rowDogId"
          required
          disabled={disabled}
          value={row.dogId}
          onchange={(event) => updateRow(index, 'dogId', (event.currentTarget as HTMLSelectElement).value)}
        >
          {#each getDogsForTutor(tutorSelected) as dog (dog.id)}
            <option value={dog.id}>{dog.name}</option>
          {/each}
        </Select>
      </div>

      <div class="grid gap-1">
        <Label for={`recipe-${index}`}>Receta</Label>
        <Select
          id={`recipe-${index}`}
          name="recipeId"
          required
          disabled={disabled}
          value={row.recipeId}
          onchange={(event) => updateRow(index, 'recipeId', (event.currentTarget as HTMLSelectElement).value)}
        >
          {#each getRecipesForDog(row.dogId) as recipe (recipe.id)}
            <option value={recipe.id}>{recipe.name}</option>
          {/each}
        </Select>
      </div>

      <div class="grid gap-1">
        <Label for={`days-${index}`}>Días asignados</Label>
        <Input
          id={`days-${index}`}
          name="assignedDays"
          type="number"
          min="1"
          step="1"
          required
          disabled={disabled}
          value={row.assignedDays}
          oninput={(event) => updateRow(index, 'assignedDays', (event.currentTarget as HTMLInputElement).value)}
        />
      </div>

      <Button type="button" color="light" onclick={() => removeRow(index)} disabled={disabled}>
        Quitar
      </Button>
    </div>
  {/each}

  <div>
    <Button type="button" color="light" onclick={addRow} disabled={disabled}>
      Agregar receta
    </Button>
  </div>
</div>
