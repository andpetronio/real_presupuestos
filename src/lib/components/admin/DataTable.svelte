<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Table } from 'flowbite-svelte';

  type DataTableProps = {
    ariaLabel: string;
    scrollable?: boolean;
    children: Snippet;
  };

  let { ariaLabel, scrollable = true, children }: DataTableProps = $props();
</script>

<Table
  hoverable
  aria-label={ariaLabel}
  class="admin-data-table text-sm text-gray-600"
  classes={{ div: scrollable ? 'overflow-x-auto' : 'overflow-visible' }}
>
  {@render children()}
</Table>

<style>
  :global(.admin-data-table thead th) {
    background-color: rgb(249 250 251);
    padding: 0.625rem 1rem;
    color: rgb(107 114 128);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.025em;
    text-transform: uppercase;
  }

  :global(.admin-data-table tbody tr) {
    border-color: rgb(243 244 246);
    background-color: white;
  }

  :global(.admin-data-table tbody tr:hover) {
    background-color: rgb(249 250 251);
  }

  :global(.admin-data-table tbody td) {
    padding: 0.625rem 1rem;
  }

  :global(.admin-data-table th:last-child) {
    text-align: right;
  }

  :global(.admin-data-table td:last-child .flex) {
    justify-content: flex-end;
  }
</style>
