<script lang="ts">
  import ChartRenderer from './ChartRenderer.svelte';

  type DualBarChartProps = {
    data: { bucket: string; sent: number; responded: number }[];
    height?: number;
  };

  let { data, height = 220 }: DualBarChartProps = $props();

  const series = $derived([
    { name: 'Enviados', data: data.map((d) => d.sent) },
    { name: 'Respondidos', data: data.map((d) => d.responded) }
  ]);

  const options = $derived({
    colors: ['#01646d', '#81923d'],
    plotOptions: {
      bar: { columnWidth: '60%', borderRadius: 4 }
    },
    dataLabels: { enabled: false },
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
      labels: {
        style: { colors: '#6b7280', fontSize: '11px' },
        formatter: (val: number) => String(Math.round(val))
      }
    }
  });
</script>

<ChartRenderer type="bar" {series} {options} {height} id="dual-bar-chart" />
