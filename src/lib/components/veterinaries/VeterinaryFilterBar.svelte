<script lang="ts">
  import GenericFilterBar from '$lib/components/admin/GenericFilterBar.svelte';

  type VeterinaryFilterBarProps = {
    currentSearch: string;
  };

  let { currentSearch }: VeterinaryFilterBarProps = $props();
</script>

<GenericFilterBar
  searchPlaceholder="Nombre de la veterinaria…"
  currentSearch={currentSearch}
/>