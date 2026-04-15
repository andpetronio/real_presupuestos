<script lang="ts">
  import type { Snippet } from 'svelte';

  type ChartRendererProps = {
    type: 'bar' | 'line' | 'area';
    series: { name: string; data: (number | null)[] }[];
    options?: Record<string, unknown>;
    height?: number;
    width?: string | number;
    title?: string;
    id?: string;
  };

  let {
    type,
    series,
    options = {},
    height = 220,
    width = '100%',
    title,
    id = 'chart'
  }: ChartRendererProps = $props();

  // Base options shared across all charts
  const baseOptions = $derived<Record<string, unknown>>({
    chart: {
      background: 'transparent',
      animations: { enabled: true },
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'inherit',
      id
    },
    theme: { mode: 'light' },
    colors: ['#01646d', '#81923d', '#ffa45d', '#e16a3d'],
    grid: {
      borderColor: '#f3f4f6',
      strokeDashArray: 0,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: 0, right: 0, bottom: 0, left: 0 }
    },
    tooltip: {
      theme: 'light',
      x: { show: true },
      y: { formatter: (val: number) => String(val) },
      style: { fontSize: '12px' }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '12px',
      markers: { radius: 4 }
    },
    xaxis: {
      labels: {
        style: { colors: '#6b7280', fontSize: '11px' },
        rotate: 0
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: { colors: '#6b7280', fontSize: '11px' },
        formatter: (val: number) => {
          if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
          if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
          return String(val);
        }
      }
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          chart: { height: 200 },
          legend: { fontSize: '10px' }
        }
      }
    ]
  });

  const mergedOptions = $derived({ ...baseOptions, ...options });
</script>

{#if title}
  <p class="mb-2 text-xs uppercase tracking-wide text-gray-500">{title}</p>
{/if}

<div role="img" aria-label={title ?? 'Gráfico'}>
  {#await import('svelte-apexcharts') then { default: VueApexCharts }}
    <VueApexCharts
      {type}
      {series}
      options={mergedOptions}
      {height}
      {width}
    />
  {/await}
</div>
