<script lang="ts">
  import { resolve } from '$app/paths';
  import { Alert, Button, Card, Input, Label } from 'flowbite-svelte';
  import { formatArs } from '$lib/shared/currency';

import { route } from '$lib/shared/navigation';
  type ActionData = {
    operatorError?: string;
    values?: {
      name: string;
      baseUnit: string;
      purchaseQuantity: string;
      baseCost: string;
      wastagePercentage: string;
    };
  };

  let { form }: { form: ActionData | null } = $props();

  const rawMaterialsPath = route('/raw-materials');

  const values = $derived({
    name: form?.values?.name ?? '',
    baseUnit: form?.values?.baseUnit ?? 'g',
    purchaseQuantity: form?.values?.purchaseQuantity ?? '',
    baseCost: form?.values?.baseCost ?? '',
    wastagePercentage: form?.values?.wastagePercentage ?? '0'
  });
</script>

<Card size="xl" class="mx-auto max-w-4xl p-6 md:p-8 shadow-sm">
  <h1 class="mb-1 text-xl font-bold text-gray-900">Nueva materia prima</h1>
  <p class="mb-6 text-sm text-gray-600">Completá los datos para dar de alta una materia prima.</p>

  {#if form?.operatorError}
    <Alert color="red" class="mb-4">{form.operatorError}</Alert>
  {/if}

  <form method="POST" action="?/create" class="grid gap-4">
    <div class="grid gap-1">
      <Label for="name">Nombre</Label>
      <Input id="name" name="name" type="text" required value={values.name} />
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div class="grid gap-1">
        <Label for="baseUnit">Unidad base</Label>
        <Input id="baseUnit" name="baseUnit" type="text" required value={values.baseUnit} />
      </div>
      <div class="grid gap-1">
        <Label for="purchaseQuantity">Cantidad comprada</Label>
        <Input id="purchaseQuantity" name="purchaseQuantity" type="number" min="0.001" step="0.001" required value={values.purchaseQuantity} />
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div class="grid gap-1">
        <Label for="baseCost">Costo base</Label>
        <Input id="baseCost" name="baseCost" type="number" min="0" step="0.01" required value={values.baseCost} />
      </div>
      <div class="grid gap-1">
        <Label for="wastagePercentage">% Merma</Label>
        <Input id="wastagePercentage" name="wastagePercentage" type="number" min="0" max="100" step="0.01" required value={values.wastagePercentage} />
      </div>
      <div class="grid gap-1">
        <Label for="costWithWastage">Costo con merma (calculado)</Label>
        <Input
          id="costWithWastage"
          type="text"
          value={formatArs(
            (Number(values.baseCost) || 0) *
            (1 + (Number(values.wastagePercentage) || 0) / 100)
          )}
          disabled
          class="bg-gray-100 cursor-not-allowed"
        />
      </div>
    </div>

    <div class="flex justify-end gap-2">
      <Button href={rawMaterialsPath} color="light">Cancelar</Button>
      <Button type="submit">Crear materia prima</Button>
    </div>
  </form>
</Card>
