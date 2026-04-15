<script lang="ts">
  import ChartRenderer from './ChartRenderer.svelte';

  type LineChartProps = {
    data: { bucket: string; acceptanceRate: number }[];
    height?: number;
    showArea?: boolean;
  };

  let { data, height = 180, showArea = false }: LineChartProps = $props();

  const series = $derived([
    { name: 'Tasa de aceptación', data: data.map((d) => +(d.acceptanceRate * 100).toFixed(1)) }
  ]);

  const options = $derived({
    stroke: { curve: 'smooth', width: 2.5 },
    fill: showArea
      ? {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.3,
            opacityTo: 0,
            stops: [0, 100]
          }
        }
      : undefined,
    colors: ['#81923d'],
    xaxis: {
      categories: data.map((d) => d.bucket),
      labels: {
        style: { colors: '#6b7280', fontSize: '11px' },
        rotate: 0
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      min: 0,
      max: 100,
      labels: {
        style: { colors: '#6b7280', fontSize: '11px' },
        formatter: (val: number) => `${val}%`
      }
    },
    tooltip: {
      y: { formatter: (val: number) => `${val}%` }
    }
  });
</script>

<ChartRenderer type={showArea ? 'area' : 'line'} {series} {options} {height} id="line-chart" />
