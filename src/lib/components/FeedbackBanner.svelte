<script lang="ts">
  import { Alert } from 'flowbite-svelte';

  let {
    message,
    color = 'blue'
  }: {
    message: string;
    color?: 'red' | 'green' | 'blue';
  } = $props();
</script>

{#if message}
  <Alert color={color} class="mb-4">{message}</Alert>
{/if}
