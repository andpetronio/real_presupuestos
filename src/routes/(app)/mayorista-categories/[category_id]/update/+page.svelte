<script lang='ts'>
  import { Button, Card } from 'flowbite-svelte';
  import FormShell from '$lib/components/admin/FormShell.svelte';
  import WholesalerCategoryFormFields from '$lib/components/wholesaler-categories/WholesalerCategoryFormFields.svelte';
  import type { WholesalerCategoryFormState } from '$lib/types/view-models/wholesaler-categories';

  type PageData = {
    category: {
      id: string;
      name: string;
      is_active: boolean;
      created_at: string;
    };
  };

  let { data, form }: { data: PageData; form: WholesalerCategoryFormState | null } = $props();

  const values = $derived({
    name: form?.values?.name ?? data.category.name,
  });

  let submitting = $state(false);
</script>

<div class='space-y-4'>
  <FormShell
    title='Editar categoría mayorista'
    description='Actualizá el nombre de la categoría.'
    action='?/update'
    method='POST'
    form={form}
    primaryLabel='Guardar cambios'
  >
    <div class='grid gap-4'>
      <WholesalerCategoryFormFields {values} />
    </div>

    {#snippet actions()}
      <Button href='/mayorista-categories' color='light'>Cancelar</Button>
      <Button type='submit' disabled={submitting}>{submitting ? 'Guardando…' : 'Guardar cambios'}</Button>
    {/snippet}
  </FormShell>

  <Card size='xl' class='w-full p-4 shadow-sm'>
    <h3 class='text-base font-semibold text-gray-900'>Acciones secundarias</h3>
    <div class='mt-3 flex flex-wrap gap-2'>
      <form method='POST' action='?/toggleActive'>
        <input type='hidden' name='activate' value={data.category.is_active ? 'false' : 'true'} />
        <Button type='submit' color={data.category.is_active ? 'red' : 'blue'}>
          {data.category.is_active ? 'Desactivar categoría' : 'Restaurar categoría'}
        </Button>
      </form>
    </div>
  </Card>
</div>
