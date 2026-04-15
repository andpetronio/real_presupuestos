declare module 'svelte-apexcharts' {
  import type { Component } from 'svelte';
  const VueApexCharts: Component<{
    type?: string;
    height?: string | number;
    options?: Record<string, unknown>;
    series?: unknown[];
    width?: string | number;
    [key: string]: unknown;
  }>;
  export default VueApexCharts;
}
