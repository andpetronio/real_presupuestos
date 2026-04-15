<script lang="ts">
  import ChartRenderer from './ChartRenderer.svelte';
  import { formatArs } from '$lib/shared/currency';

  type AmountChartProps = {
    data: { bucket: string; value: number }[];
    label?: string;
    color?: string;
    height?: number;
  };

  let { data, label, color = '#01646d', height = 200 }: AmountChartProps = $props();

  const series = $derived([{ name: label ?? 'Monto', data: data.map((d) => d.value) }]);

  const options = $derived({
    colors: [color],
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
        formatter: (val: number) => formatArs(val)
      }
    },
    tooltip: {
      y: { formatter: (val: number) => formatArs(val) }
    }
  });
</script>

<ChartRenderer type="bar" {series} {options} {height} id="amount-chart" />
