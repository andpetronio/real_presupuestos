<script lang="ts">
  import { Button, Card } from 'flowbite-svelte';
  import FormShell from '$lib/components/admin/FormShell.svelte';
  import WholesaleProductFormFields from '$lib/components/wholesale-products/WholesaleProductFormFields.svelte';
  import WholesaleProductImagePicker from '$lib/components/wholesale-products/WholesaleProductImagePicker.svelte';
  import type { WholesaleProductFormState } from '$lib/types/view-models/wholesale-products';

  type PageData = {
    product: {
      id: string;
      name: string;
      presentation: string;
      price_ars: number;
      description: string | null;
      is_active: boolean;
      images: Array<{ id: string; public_url: string; storage_path: string; sort_order: number }>;
    };
  };

  let { data, form }: { data: PageData; form: WholesaleProductFormState | null } = $props();

  const values = $derived({
    name: form?.values?.name ?? data.product.name,
    presentation: form?.values?.presentation ?? data.product.presentation,
    priceArs: form?.values?.priceArs ?? String(data.product.price_ars),
    description: form?.values?.description ?? (data.product.description ?? ''),
  });
</script>

<div class="space-y-4">
  <FormShell
    title="Editar producto mayorista"
    description="Actualizá precio, presentación y contenido comercial del producto."
    action="?/update"
    method="POST"
    form={form}
    primaryLabel="Guardar cambios"
  >
    <div class="grid gap-4 md:grid-cols-2">
      <WholesaleProductFormFields {values} />
    </div>

    {#snippet actions()}
      <Button href="/mayorista-products" color="light">Cancelar</Button>
      <Button type="submit">Guardar cambios</Button>
    {/snippet}
  </FormShell>

  <Card size="xl" class="w-full p-4 shadow-sm">
    <h3 class="text-base font-semibold text-gray-900">Gestión de imágenes</h3>
    <p class="mt-1 text-sm text-gray-600">
      Agregá una nueva imagen para el producto.
    </p>

    <form method="POST" action="?/uploadImages" enctype="multipart/form-data" class="mt-4 space-y-4">
      <WholesaleProductImagePicker
        existingImages={data.product.images}
        label="Imagen del producto"
        helpText="Seleccioná una imagen."
        deleteAction="?/deleteImage"
      />

      <Button type="submit">Subir imagen</Button>
    </form>
  </Card>

  <Card size="xl" class="w-full p-4 shadow-sm">
    <h3 class="text-base font-semibold text-gray-900">Estado del producto</h3>
    <div class="mt-3 flex flex-wrap gap-2">
      <form method="POST" action="?/toggleActive">
        <input type="hidden" name="activate" value={data.product.is_active ? 'false' : 'true'} />
        <Button type="submit" color={data.product.is_active ? 'red' : 'blue'}>
          {data.product.is_active ? 'Desactivar producto' : 'Restaurar producto'}
        </Button>
      </form>
    </div>
  </Card>
</div>
