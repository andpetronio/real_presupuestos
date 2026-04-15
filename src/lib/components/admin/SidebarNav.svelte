<script lang="ts">
  import { resolve } from '$app/paths';
  import type { NavItem } from '$lib/constants/navigation';

  type SidebarNavProps = {
    items: ReadonlyArray<NavItem>;
    activeHref?: string;
    onNavigate?: (item: NavItem) => void;
  };

  let { items, activeHref = '', onNavigate }: SidebarNavProps = $props();
</script>

<nav aria-label="Módulos administrativos">
  <ul class="list">
    {#each items as item (item.key)}
      {@const isActive = activeHref === item.href}
      <li>
        <a
          href={resolve(item.href)}
          aria-current={isActive ? 'page' : undefined}
          class:active={isActive}
          onclick={() => onNavigate?.(item)}
        >
          <item.icon size={20} weight="duotone" aria-hidden="true" />
          <span>{item.label}</span>
        </a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: var(--space-2);
  }

  a {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    border-radius: var(--radius-md);
    text-decoration: none;
    color: var(--color-gray-700);
  }

  a:hover,
  a.active {
    background: var(--color-primary-100);
    color: var(--color-primary-700);
  }

  a[aria-current='page'] {
    box-shadow: inset 0 0 0 2px var(--color-primary-500);
  }
</style>
