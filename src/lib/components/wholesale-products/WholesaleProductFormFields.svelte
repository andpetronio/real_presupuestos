<script lang="ts">
  import { Input, Label, Textarea } from 'flowbite-svelte';
  import type { WholesaleProductFormValues } from '$lib/types/view-models/wholesale-products';

  type Props = {
    values: WholesaleProductFormValues;
  };

  let { values }: Props = $props();
</script>

<div>
  <Label for="name" class="mb-1">Nombre</Label>
  <Input id="name" name="name" required value={values.name} />
</div>

<div>
  <Label for="presentation" class="mb-1">Presentación</Label>
  <Input id="presentation" name="presentation" required value={values.presentation} />
</div>

<div>
  <Label for="priceArs" class="mb-1">Precio ARS</Label>
  <Input id="priceArs" name="priceArs" type="number" min={0} step={0.01} required value={values.priceArs} />
</div>

<div class="md:col-span-2">
  <Label for="description" class="mb-1">Descripción</Label>
  <Textarea id="description" name="description" rows={3} class="w-full" value={values.description} />
</div>
