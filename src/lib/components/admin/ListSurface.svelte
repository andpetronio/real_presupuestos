<script lang="ts">
  import type { Snippet } from 'svelte';

  type ListSurfaceProps = {
    toolbar?: Snippet;
    content?: Snippet;
    footer?: Snippet;
  };

  let { toolbar, content, footer }: ListSurfaceProps = $props();
</script>

<section class="overflow-hidden rounded-lg border border-gray-200 bg-white" aria-live="polite">
  {#if toolbar}
    <div class="border-b border-gray-100 px-4 py-3">
      {@render toolbar()}
    </div>
  {/if}

  {@render content?.()}

  {#if footer}
    <div class="border-t border-gray-100 px-4 py-3">
      {@render footer()}
    </div>
  {/if}
</section>
