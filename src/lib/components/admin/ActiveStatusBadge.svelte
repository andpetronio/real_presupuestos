<script lang="ts">
  import StatusBadge from '$lib/components/admin/StatusBadge.svelte';

  type ActiveStatusBadgeProps = {
    isActive: boolean;
    activeLabel?: string;
    inactiveLabel?: string;
  };

  let {
    isActive,
    activeLabel = 'Activo',
    inactiveLabel = 'Inactivo'
  }: ActiveStatusBadgeProps = $props();

  const label = $derived(isActive ? activeLabel : inactiveLabel);
  const status = $derived(isActive ? 'accepted' : 'rejected');
</script>

<StatusBadge status={status} label={label} />
