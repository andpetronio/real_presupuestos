<script lang="ts">
  import { Badge } from 'flowbite-svelte';
  import type { BudgetStatus } from '$lib/types/budget';

  type BadgeTone = 'neutral' | 'warning' | 'info' | 'success' | 'danger' | 'dark';
  type BadgeColor = 'primary' | 'secondary' | 'amber' | 'green' | 'gray';

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
    discarded: 'Descartado'
  };

  const STATUS_TONE: Record<BudgetStatus, BadgeTone> = {
    draft: 'neutral',
    ready_to_send: 'warning',
    sent: 'info',
    accepted: 'success',
    rejected: 'danger',
    expired: 'dark',
    discarded: 'dark'
  };

  let { status, label }: StatusBadgeProps = $props();

  const resolvedLabel = $derived(label ?? STATUS_COPY[status]);
  const tone = $derived(STATUS_TONE[status]);
  const badgeColor = $derived<BadgeColor>(
    tone === 'success'
      ? 'green'
      : tone === 'danger'
        ? 'secondary'
        : tone === 'warning'
          ? 'amber'
          : tone === 'dark'
            ? 'gray'
            : 'primary'
  );
  const bordered = $derived(tone === 'neutral');
</script>

<Badge color={badgeColor} border={bordered} rounded>
  {resolvedLabel}
</Badge>
