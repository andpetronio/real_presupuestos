<script lang='ts'>
  import { Button } from 'flowbite-svelte';
  import FormShell from '$lib/components/admin/FormShell.svelte';
  import WholesalerCategoryFormFields from '$lib/components/wholesaler-categories/WholesalerCategoryFormFields.svelte';
  import type { WholesalerCategoryFormState } from '$lib/types/view-models/wholesaler-categories';

  let { form }: { form: WholesalerCategoryFormState | null } = $props();

  const values = $derived({
    name: form?.values?.name ?? '',
  });

  let submitting = $state(false);
</script>

<FormShell
  title='Nueva categoría mayorista'
  description='Creá una categoría para clasificar mayoristas en el backoffice.'
  action='?/create'
  method='POST'
  form={form}
  primaryLabel='Crear categoría'
>
  <div class='grid gap-4'>
    <WholesalerCategoryFormFields {values} />
  </div>

  {#snippet actions()}
    <Button href='/mayorista-categories' color='light'>Cancelar</Button>
    <Button type='submit' disabled={submitting}>{submitting ? 'Guardando…' : 'Crear categoría'}</Button>
  {/snippet}
</FormShell>
