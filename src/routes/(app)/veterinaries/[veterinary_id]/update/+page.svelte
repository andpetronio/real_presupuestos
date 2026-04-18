<script lang="ts">
  import { Button, Input, Label } from 'flowbite-svelte';
  import FormShell from '$lib/components/admin/FormShell.svelte';

  import { route } from '$lib/shared/navigation';
  type PageData = {
    veterinary: {
      id: string;
      name: string;
    };
  };

  type ActionData = {
    operatorError?: string;
    values?: {
      name: string;
    };
  };

  let { data, form }: { data: PageData; form: ActionData | null } = $props();
  const veterinariesPath = route('/veterinaries');

  const values = $derived({
    name: form?.values?.name ?? data.veterinary.name
  });

  let submitting = $state(false);
</script>

<FormShell
  title="Editar veterinaria"
  description="Actualizá los datos de la veterinaria seleccionada."
  action="?/update"
  method="POST"
  form={form}
  primaryLabel="Guardar cambios"
>
  <div>
    <Label for="name" class="mb-1">Nombre</Label>
    <Input id="name" name="name" type="text" required value={values.name} />
  </div>

  {#snippet actions()}
    <Button href={veterinariesPath} color="light">Cancelar</Button>
    <Button type="submit" disabled={submitting}>
      {submitting ? 'Guardando…' : 'Guardar cambios'}
    </Button>
  {/snippet}
</FormShell>
