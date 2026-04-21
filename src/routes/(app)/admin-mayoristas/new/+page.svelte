<script lang='ts'>
  import { Button } from 'flowbite-svelte';
  import FormShell from '$lib/components/admin/FormShell.svelte';
  import WholesalerFormFields from '$lib/components/wholesalers/WholesalerFormFields.svelte';
  import type {
    WholesalerCategoryOption,
    WholesalerFormState,
  } from '$lib/types/view-models/wholesalers';

  type PageData = {
    categories: ReadonlyArray<WholesalerCategoryOption>;
  };

  let { data, form }: { data: PageData; form: WholesalerFormState | null } = $props();

  const values = $derived({
    name: form?.values?.name ?? '',
    categoryId: form?.values?.categoryId ?? '',
    code: form?.values?.code ?? '',
    minTotalUnits: form?.values?.minTotalUnits ?? '5',
    taxId: form?.values?.taxId ?? '',
    contactFullName: form?.values?.contactFullName ?? '',
    contactWhatsapp: form?.values?.contactWhatsapp ?? '',
    contactEmail: form?.values?.contactEmail ?? '',
    address: form?.values?.address ?? '',
    deliveryPreference: form?.values?.deliveryPreference ?? '',
    paymentPreference: form?.values?.paymentPreference ?? '',
    notes: form?.values?.notes ?? '',
  });

  let submitting = $state(false);
</script>

<FormShell
  title='Nuevo mayorista'
  description='Completá los datos comerciales y operativos para dar de alta un mayorista del marketplace.'
  action='?/create'
  method='POST'
  form={form}
  primaryLabel='Crear mayorista'
>
  <div class='grid gap-4 md:grid-cols-2'>
    <WholesalerFormFields {values} categories={data.categories} />
  </div>

  {#snippet actions()}
    <Button href='/admin-mayoristas' color='light'>Cancelar</Button>
    <Button type='submit' disabled={submitting}>{submitting ? 'Guardando…' : 'Crear mayorista'}</Button>
  {/snippet}
</FormShell>
