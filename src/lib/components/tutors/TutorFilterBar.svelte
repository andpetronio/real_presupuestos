<script lang="ts">
  import GenericFilterBar from '$lib/components/admin/GenericFilterBar.svelte';

  type TutorFilterBarProps = {
    currentSearch: string;
  };

  let { currentSearch }: TutorFilterBarProps = $props();
</script>

<GenericFilterBar
  searchPlaceholder="Nombre del tutor…"
  currentSearch={currentSearch}
/>