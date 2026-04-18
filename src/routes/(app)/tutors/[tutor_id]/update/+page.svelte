<script lang="ts">
  import { Button, Input, Label, Textarea } from 'flowbite-svelte';
  import FormShell from '$lib/components/admin/FormShell.svelte';

  import { route } from '$lib/shared/navigation';
  type PageData = {
    tutor: {
      id: string;
      full_name: string;
      whatsapp_number: string;
      notes: string | null;
    };
  };

  type ActionData = {
    operatorError?: string;
    values?: {
      fullName: string;
      whatsappNumber: string;
      notes: string;
    };
  };

  let { data, form }: { data: PageData; form: ActionData | null } = $props();
  const tutorsPath = route('/tutors');

  const values = $derived({
    fullName: form?.values?.fullName ?? data.tutor.full_name,
    whatsappNumber: form?.values?.whatsappNumber ?? data.tutor.whatsapp_number,
    notes: form?.values?.notes ?? (data.tutor.notes ?? '')
  });

  let submitting = $state(false);
</script>

<FormShell
  title="Editar tutor"
  description="Actualizá los datos del tutor seleccionado."
  action="?/update"
  method="POST"
  form={form}
  primaryLabel="Guardar cambios"
>
  <div>
    <Label for="fullName" class="mb-1">Nombre completo</Label>
    <Input id="fullName" name="fullName" type="text" required value={values.fullName} />
  </div>

  <div>
    <Label for="whatsappNumber" class="mb-1">WhatsApp</Label>
    <Input id="whatsappNumber" name="whatsappNumber" type="text" required value={values.whatsappNumber} />
  </div>

  <div>
    <Label for="notes" class="mb-1">Notas</Label>
    <Textarea id="notes" name="notes" rows={3} class="w-full" value={values.notes} />
  </div>

  {#snippet actions()}
    <Button href={tutorsPath} color="light">Cancelar</Button>
    <Button type="submit" disabled={submitting}>
      {submitting ? 'Guardando…' : 'Guardar cambios'}
    </Button>
  {/snippet}
</FormShell>
