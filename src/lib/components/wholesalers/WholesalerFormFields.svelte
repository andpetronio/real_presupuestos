<script lang='ts'>
  import { Input, Label, Select, Textarea } from 'flowbite-svelte';
  import type {
    WholesalerCategoryOption,
    WholesalerFormValues,
  } from '$lib/types/view-models/wholesalers';

  type Props = {
    values: WholesalerFormValues;
    categories?: ReadonlyArray<WholesalerCategoryOption>;
  };

  let { values, categories = [] }: Props = $props();
</script>

<div class='md:col-span-2'>
  <h3 class='text-sm font-semibold uppercase tracking-wide text-gray-500'>Comercial</h3>
</div>

<div>
  <Label for='name' class='mb-1'>Nombre</Label>
  <Input id='name' name='name' required value={values.name} />
</div>

<div>
  <Label for='categoryId' class='mb-1'>Categoría</Label>
  <Select id='categoryId' name='categoryId' value={values.categoryId}>
    <option value=''>Sin categoría</option>
    {#each categories as category (category.id)}
      <option value={category.id}>
        {category.name}{category.is_active ? '' : ' (inactiva)'}
      </option>
    {/each}
  </Select>
</div>

<div>
  <Label for='code' class='mb-1'>Código (opcional)</Label>
  <Input id='code' name='code' maxlength={24} value={values.code} />
</div>

<div>
  <Label for='minTotalUnits' class='mb-1'>Mínimo de unidades</Label>
  <Input
    id='minTotalUnits'
    name='minTotalUnits'
    type='number'
    min={1}
    required
    value={values.minTotalUnits}
  />
</div>

<div>
  <Label for='deliveryDays' class='mb-1'>Días de entrega</Label>
  <Input
    id='deliveryDays'
    name='deliveryDays'
    type='number'
    min={1}
    required
    value={values.deliveryDays}
  />
</div>

<div class='md:col-span-2 mt-2'>
  <h3 class='text-sm font-semibold uppercase tracking-wide text-gray-500'>Identificación y contacto</h3>
</div>

<div>
  <Label for='taxId' class='mb-1'>CUIT o DNI</Label>
  <Input id='taxId' name='taxId' maxlength={13} value={values.taxId} />
</div>

<div>
  <Label for='contactFullName' class='mb-1'>Nombre y apellido del contacto</Label>
  <Input id='contactFullName' name='contactFullName' value={values.contactFullName} />
</div>

<div>
  <Label for='contactWhatsapp' class='mb-1'>Número de WhatsApp</Label>
  <Input id='contactWhatsapp' name='contactWhatsapp' value={values.contactWhatsapp} />
</div>

<div>
  <Label for='contactEmail' class='mb-1'>Email de contacto</Label>
  <Input id='contactEmail' name='contactEmail' type='email' value={values.contactEmail} />
</div>

<div class='md:col-span-2 mt-2'>
  <h3 class='text-sm font-semibold uppercase tracking-wide text-gray-500'>Operación</h3>
</div>

<div class='md:col-span-2'>
  <Label for='address' class='mb-1'>Dirección</Label>
  <Textarea id='address' name='address' rows={3} class='w-full' value={values.address} />
</div>

<div class='md:col-span-2'>
  <Label for='deliveryPreference' class='mb-1'>Cómo recibir el pedido</Label>
  <Textarea
    id='deliveryPreference'
    name='deliveryPreference'
    rows={3}
    class='w-full'
    value={values.deliveryPreference}
  />
</div>

<div class='md:col-span-2'>
  <Label for='paymentPreference' class='mb-1'>Forma de pago preferida</Label>
  <Textarea
    id='paymentPreference'
    name='paymentPreference'
    rows={3}
    class='w-full'
    value={values.paymentPreference}
  />
</div>

<div class='md:col-span-2'>
  <Label for='notes' class='mb-1'>Notas</Label>
  <Textarea id='notes' name='notes' rows={3} class='w-full' value={values.notes} />
</div>
