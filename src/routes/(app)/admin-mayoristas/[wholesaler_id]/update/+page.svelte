<script lang='ts'>
  import { Button, Card } from 'flowbite-svelte';
  import FormShell from '$lib/components/admin/FormShell.svelte';
  import WholesalerFormFields from '$lib/components/wholesalers/WholesalerFormFields.svelte';
  import type {
    WholesalerCategoryOption,
    WholesalerFormState,
  } from '$lib/types/view-models/wholesalers';

  type PageData = {
    wholesaler: {
      id: string;
      name: string;
      unique_random_code: string;
      min_total_units: number;
      delivery_days: number;
      is_active: boolean;
      notes: string | null;
      category_id: string | null;
      tax_id: string | null;
      contact_full_name: string | null;
      contact_whatsapp: string | null;
      contact_email: string | null;
      address: string | null;
      delivery_preference: string | null;
      payment_preference: string | null;
    };
    categories: ReadonlyArray<WholesalerCategoryOption>;
  };

  let { data, form }: { data: PageData; form: WholesalerFormState | null } = $props();

  const values = $derived({
    name: form?.values?.name ?? data.wholesaler.name,
    categoryId: form?.values?.categoryId ?? (data.wholesaler.category_id ?? ''),
    code: form?.values?.code ?? data.wholesaler.unique_random_code,
    minTotalUnits: form?.values?.minTotalUnits ?? String(data.wholesaler.min_total_units),
    deliveryDays: form?.values?.deliveryDays ?? String(data.wholesaler.delivery_days),
    taxId: form?.values?.taxId ?? (data.wholesaler.tax_id ?? ''),
    contactFullName: form?.values?.contactFullName ?? (data.wholesaler.contact_full_name ?? ''),
    contactWhatsapp: form?.values?.contactWhatsapp ?? (data.wholesaler.contact_whatsapp ?? ''),
    contactEmail: form?.values?.contactEmail ?? (data.wholesaler.contact_email ?? ''),
    address: form?.values?.address ?? (data.wholesaler.address ?? ''),
    deliveryPreference: form?.values?.deliveryPreference ?? (data.wholesaler.delivery_preference ?? ''),
    paymentPreference: form?.values?.paymentPreference ?? (data.wholesaler.payment_preference ?? ''),
    notes: form?.values?.notes ?? (data.wholesaler.notes ?? ''),
  });

  let submitting = $state(false);
</script>

<div class='space-y-4'>
  <FormShell
    title='Editar mayorista'
    description='Actualizá datos comerciales, fiscales y operativos del mayorista.'
    action='?/update'
    method='POST'
    form={form}
    primaryLabel='Guardar cambios'
  >
    <div class='grid gap-4 md:grid-cols-2'>
      <WholesalerFormFields {values} categories={data.categories} />
    </div>

    {#snippet actions()}
      <Button href='/admin-mayoristas' color='light'>Cancelar</Button>
      <Button type='submit' disabled={submitting}>{submitting ? 'Guardando…' : 'Guardar cambios'}</Button>
    {/snippet}
  </FormShell>

  <Card size='xl' class='w-full p-4 shadow-sm'>
    <h3 class='text-base font-semibold text-gray-900'>Acciones secundarias</h3>
    <div class='mt-3 flex flex-wrap gap-2'>
      <form method='POST' action='?/regenerateCode'>
        <Button type='submit' color='light'>Regenerar código</Button>
      </form>
      <form method='POST' action='?/toggleActive'>
        <input type='hidden' name='activate' value={data.wholesaler.is_active ? 'false' : 'true'} />
        <Button type='submit' color={data.wholesaler.is_active ? 'red' : 'blue'}>
          {data.wholesaler.is_active ? 'Desactivar mayorista' : 'Restaurar mayorista'}
        </Button>
      </form>
    </div>
  </Card>
</div>
