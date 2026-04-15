<script lang="ts">
  import { Card } from 'flowbite-svelte';
  import type { Snippet } from 'svelte';

  type SettingsSectionProps = {
    title: string;
    description: string;
    children?: Snippet;
  };

  let { title, description, children }: SettingsSectionProps = $props();
</script>

<Card class="w-full shadow-sm">
  <section class="settings-section">
    <header>
      <h3>{title}</h3>
      <p>{description}</p>
    </header>

    <div class="body">
      {@render children?.()}
    </div>
  </section>
</Card>

<style>
  .settings-section {
    display: grid;
    gap: var(--space-3);
  }

  h3 {
    margin: 0;
    font-size: 1rem;
  }

  p {
    margin: var(--space-1) 0 0;
    color: var(--color-gray-600);
    font-size: 0.9375rem;
  }

  .body {
    display: grid;
    gap: var(--space-3);
  }
</style>
