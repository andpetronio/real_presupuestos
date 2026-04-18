<script lang="ts">
  import { Button, Input, Label } from 'flowbite-svelte';
  import FormShell from '$lib/components/admin/FormShell.svelte';
  import { formatArs } from '$lib/shared/currency';

  import { route } from '$lib/shared/navigation';
  type PageData = {
    rawMaterial: {
      id: string;
      name: string;
      base_unit: string;
      purchase_quantity: number;
      base_cost: number;
      wastage_percentage: number;
    };
  };

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

  let { data, form }: { data: PageData; form: ActionData | null } = $props();

  const rawMaterialsPath = route('/raw-materials');

  const values = $derived({
    name: form?.values?.name ?? data.rawMaterial.name,
    baseUnit: form?.values?.baseUnit ?? data.rawMaterial.base_unit,
    purchaseQuantity: form?.values?.purchaseQuantity ?? String(data.rawMaterial.purchase_quantity),
    baseCost: form?.values?.baseCost ?? String(data.rawMaterial.base_cost),
    wastagePercentage: form?.values?.wastagePercentage ?? String(data.rawMaterial.wastage_percentage)
  });

  let submitting = $state(false);
</script>

<FormShell
  title="Editar materia prima"
  description="Actualizá costo, merma y datos operativos de la materia prima."
  action="?/update"
  method="POST"
  form={form}
  primaryLabel="Guardar cambios"
>
  <div class="grid gap-1">
    <Label for="name" class="mb-1">Nombre</Label>
    <Input id="name" name="name" type="text" required value={values.name} />
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    <div class="grid gap-1">
      <Label for="baseUnit" class="mb-1">Unidad base</Label>
      <Input id="baseUnit" name="baseUnit" type="text" required value={values.baseUnit} />
    </div>
    <div class="grid gap-1">
      <Label for="purchaseQuantity" class="mb-1">Cantidad comprada</Label>
      <Input id="purchaseQuantity" name="purchaseQuantity" type="number" min="0.001" step="0.001" required value={values.purchaseQuantity} />
    </div>
  </div>

  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <div class="grid gap-1">
      <Label for="baseCost" class="mb-1">Costo base</Label>
      <Input id="baseCost" name="baseCost" type="number" min="0" step="0.01" required value={values.baseCost} />
    </div>
    <div class="grid gap-1">
      <Label for="wastagePercentage" class="mb-1">% Merma</Label>
      <Input id="wastagePercentage" name="wastagePercentage" type="number" min="0" max="100" step="0.01" required value={values.wastagePercentage} />
    </div>
    <div class="grid gap-1">
      <Label for="costWithWastage" class="mb-1">Costo con merma (calculado)</Label>
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

  {#snippet actions()}
    <Button href={rawMaterialsPath} color="light">Cancelar</Button>
    <Button type="submit" disabled={submitting}>
      {submitting ? 'Guardando…' : 'Guardar cambios'}
    </Button>
  {/snippet}
</FormShell>
