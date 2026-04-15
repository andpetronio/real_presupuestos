<script lang="ts">
  type TopbarAction = {
    id: string;
    label: string;
    onClick: () => void;
  };

  type TopbarProps = {
    title: string;
    subtitle?: string;
    actions?: ReadonlyArray<TopbarAction>;
  };

  let { title, subtitle, actions = [] }: TopbarProps = $props();
</script>

<div class="topbar-wrap">
  <div class="context">
    <h1>{title}</h1>
    {#if subtitle}
      <p>{subtitle}</p>
    {/if}
  </div>

  <div class="actions" aria-label="Acciones globales">
    {#each actions as action (action.id)}
      <button type="button" onclick={action.onClick}>{action.label}</button>
    {/each}
  </div>
</div>

<style>
  .topbar-wrap {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .context h1 {
    margin: 0;
    font-size: 1.25rem;
  }

  .context p {
    margin: var(--space-1) 0 0;
    color: var(--color-gray-600);
  }

  .actions {
    display: flex;
    gap: var(--space-2);
  }

  button {
    border: 0;
    border-radius: var(--radius-sm);
    background: var(--color-secondary-600);
    color: #ffffff;
    padding: var(--space-2) var(--space-3);
    cursor: pointer;
  }
</style>
