<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button } from 'flowbite-svelte';
  import FormShell from '$lib/components/admin/FormShell.svelte';
  import WholesaleProductFormFields from '$lib/components/wholesale-products/WholesaleProductFormFields.svelte';
  import WholesaleProductImagePicker from '$lib/components/wholesale-products/WholesaleProductImagePicker.svelte';
  import type { WholesaleProductFormState } from '$lib/types/view-models/wholesale-products';

  let { form }: { form: WholesaleProductFormState | null } = $props();

  const values = $derived({
    name: form?.values?.name ?? '',
    presentation: form?.values?.presentation ?? '',
    priceArs: form?.values?.priceArs ?? '0',
    description: form?.values?.description ?? '',
  });

  let imageFiles = $state<File[]>([]);

  const handleImageChange = (files: File[]) => {
    imageFiles = files;
  };

  const handleSubmit = () => {
    const formElement = document.getElementById('form-shell-card')?.querySelector('form');
    if (!formElement || imageFiles.length === 0) return;

    const formData = new FormData(formElement);
    const ordered = new FormData();

    for (const [key, value] of formData.entries()) {
      if (key !== 'images') {
        ordered.append(key, value);
      }
    }
    for (const file of imageFiles) {
      ordered.append('images', file);
    }

    formElement.action = '?/create';
    formElement.method = 'POST';
    formElement.enctype = 'multipart/form-data';
    formElement.requestSubmit();
  };
</script>

<FormShell
  title="Nuevo producto mayorista"
  description="Cargá la información comercial del producto y sus imágenes."
  action="?/create"
  method="POST"
  form={form}
  primaryLabel="Crear producto"
>
  <div class="grid gap-4 md:grid-cols-2">
    <WholesaleProductFormFields {values} />
    <div class="md:col-span-2">
      <WholesaleProductImagePicker onchange={handleImageChange} />
    </div>
  </div>

  {#snippet actions()}
    <Button href="/mayorista-products" color="light">Cancelar</Button>
    <Button onclick={handleSubmit}>Crear producto</Button>
  {/snippet}
</FormShell>