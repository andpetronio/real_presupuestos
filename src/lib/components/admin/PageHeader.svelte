<script lang="ts">
  import type { Snippet } from 'svelte';

  type BreadcrumbItem = { href: string; label: string };

  type PageHeaderProps = {
    title: string;
    breadcrumbs: ReadonlyArray<BreadcrumbItem>;
    actions?: Snippet;
  };

  let { title, breadcrumbs, actions }: PageHeaderProps = $props();
</script>

<header class="mb-5 flex flex-wrap items-end justify-between gap-3">
  <div class="min-w-0">
    <nav aria-label="Ruta de navegación" class="mb-1.5">
      <ol class="flex flex-wrap items-center gap-x-1.5 text-xs text-gray-500">
        {#each breadcrumbs as crumb, index (`${crumb.href}-${index}`)}
          <li class="flex items-center gap-x-1.5">
            {#if index > 0}
              <span aria-hidden="true" class="text-gray-300">/</span>
            {/if}
            {#if index === breadcrumbs.length - 1}
              <span aria-current="page" class="font-medium text-gray-700">{crumb.label}</span>
            {:else}
              <a href={crumb.href} class="hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">
                {crumb.label}
              </a>
            {/if}
          </li>
        {/each}
      </ol>
    </nav>
    <h1 class="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">{title}</h1>
  </div>

  {#if actions}
    <div class="flex items-center gap-2">
      {@render actions()}
    </div>
  {/if}
</header>
