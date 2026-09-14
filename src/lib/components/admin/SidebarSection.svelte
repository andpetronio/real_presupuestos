<script lang="ts">
  import type { Snippet } from 'svelte';

  type SidebarSectionProps = {
    label: string;
    collapsed?: boolean;
    children?: Snippet;
  };

  let { label, collapsed = false, children }: SidebarSectionProps = $props();
</script>

<section class="py-2" aria-label={label}>
  {#if !collapsed}
    <h2 class="mb-1 px-2 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-gray-400">{label}</h2>
  {:else}
    <div class="mx-2 mb-1 border-t border-gray-200" aria-hidden="true"></div>
  {/if}
  <ul class="space-y-0.5">
    {@render children?.()}
  </ul>
</section>
