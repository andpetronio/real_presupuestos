<script lang="ts">
  import type { Snippet } from 'svelte';

  type AppShellProps = {
    sidebar?: Snippet;
    topbar?: Snippet;
    children?: Snippet;
  };

  let { sidebar, topbar, children }: AppShellProps = $props();
</script>

<div class="app-shell">
  <aside class="sidebar" aria-label="Navegación interna">
    {@render sidebar?.()}
  </aside>

  <div class="workspace">
    <header class="topbar">
      {@render topbar?.()}
    </header>

    <main class="content" id="main-content">
      {@render children?.()}
    </main>
  </div>
</div>

<style>
  .app-shell {
    display: grid;
    min-height: 100vh;
    grid-template-columns: 17.5rem minmax(0, 1fr);
    background: var(--color-gray-50);
  }

  .sidebar {
    background: #ffffff;
    color: var(--color-gray-900);
    padding: var(--space-5) var(--space-4);
    border-right: 1px solid var(--color-gray-200);
  }

  .workspace {
    display: grid;
    grid-template-rows: auto 1fr;
    min-width: 0;
  }

  .topbar {
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--color-gray-200);
    background: #ffffff;
  }

  .content {
    padding: var(--space-5);
  }

  @media (max-width: 960px) {
    .app-shell {
      grid-template-columns: 1fr;
    }

    .sidebar {
      padding: var(--space-4);
    }
  }
</style>
