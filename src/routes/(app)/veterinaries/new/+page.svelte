<script lang="ts">
  import { Button, Input, Label } from 'flowbite-svelte';
  import FormShell from '$lib/components/admin/FormShell.svelte';

  import { route } from '$lib/shared/navigation';
  type ActionData = {
    operatorError?: string;
    values?: {
      name: string;
    };
  };

  let { form }: { form: ActionData | null } = $props();
  const veterinariesPath = route('/veterinaries');

  const values = $derived({
    name: form?.values?.name ?? ''
  });

  let submitting = $state(false);
</script>

<FormShell
  title="Nueva veterinaria"
  description="Completá los datos para dar de alta una veterinaria."
  action="?/create"
  method="POST"
  form={form}
  primaryLabel="Crear veterinaria"
>
  <div>
    <Label for="name" class="mb-1">Nombre</Label>
    <Input id="name" name="name" type="text" required value={values.name} />
  </div>

  {#snippet actions()}
    <Button href={veterinariesPath} color="light">Cancelar</Button>
    <Button type="submit" disabled={submitting}>
      {submitting ? 'Guardando…' : 'Crear veterinaria'}
    </Button>
  {/snippet}
</FormShell>
