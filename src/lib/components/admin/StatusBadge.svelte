<script lang="ts">
  import { Badge } from 'flowbite-svelte';
  import type { BudgetStatus } from '$lib/types/budget';

  type BadgeColor = 'primary' | 'gray' | 'amber' | 'blue' | 'green' | 'red' | 'purple';
  type StatusBadgeConfig = {
    color: BadgeColor;
    border?: boolean;
    className?: string;
  };

  type StatusBadgeProps = {
    status: BudgetStatus;
    label?: string;
  };

  const STATUS_COPY: Record<BudgetStatus, string> = {
    draft: 'Borrador',
    ready_to_send: 'Listo para enviar',
    sent: 'Enviado',
    accepted: 'Aceptado',
    rejected: 'Rechazado',
    expired: 'Expirado',
    discarded: 'Descartado',
    closed: 'Cerrado'
  };

  const STATUS_CONFIG: Record<BudgetStatus, StatusBadgeConfig> = {
    draft: { color: 'gray' },
    ready_to_send: { color: 'amber' },
    sent: { color: 'blue' },
    accepted: { color: 'green' },
    rejected: { color: 'red' },
    expired: {
      color: 'gray',
      border: true,
      className: 'border-gray-300 bg-white text-gray-700'
    },
    discarded: { color: 'gray' },
    closed: { color: 'purple' }
  };

  let { status, label }: StatusBadgeProps = $props();

  const resolvedLabel = $derived(label ?? STATUS_COPY[status]);
  const badgeConfig = $derived(STATUS_CONFIG[status]);
</script>

<Badge
  color={badgeConfig.color}
  border={badgeConfig.border ?? false}
  class={badgeConfig.className}
  rounded
>
  {resolvedLabel}
</Badge>
