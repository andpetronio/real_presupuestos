<script lang="ts">
  import { Button, Input, Label, Textarea } from 'flowbite-svelte';
  import FormShell from '$lib/components/admin/FormShell.svelte';

  import { route } from '$lib/shared/navigation';
  type ActionData = {
    operatorError?: string;
    values?: {
      fullName: string;
      whatsappNumber: string;
      notes: string;
    };
  };

  let { form }: { form: ActionData | null } = $props();
  const tutorsPath = route('/tutors');

  const values = $derived({
    fullName: form?.values?.fullName ?? '',
    whatsappNumber: form?.values?.whatsappNumber ?? '',
    notes: form?.values?.notes ?? ''
  });

  let submitting = $state(false);
</script>

<FormShell
  title="Nuevo tutor"
  description="Completá los datos para dar de alta un tutor."
  action="?/create"
  method="POST"
  form={form as any}
  primaryLabel="Crear tutor"
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
      {submitting ? 'Guardando…' : 'Crear tutor'}
    </Button>
  {/snippet}
</FormShell>
