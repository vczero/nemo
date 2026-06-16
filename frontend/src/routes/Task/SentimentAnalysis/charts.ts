import type { ReportDefinition } from '@/types/mlApp'
import type { PieChartConfig } from '@/chart'

export const sentimentReport: ReportDefinition = {
  charts: [
    {
      key: 'donut_chart',
      chartName: '情感占比',
      chartType: 'donut',
      getDefaultConfig: (): PieChartConfig => ({
        version: 'v2',
        type: 'donut',
        dataMapping: {
          nameField: 'category',
          valueField: 'ratio',
        },
        title: { text: '', show: false },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true },
        label: { show: true, format: 'percentage' },
        chartSetting: {
          radius: 45,
          innerRadius: 25,
          showLabelName: true,
        },
      }),
    },
  ],
  tables: [{ key: 'table' }],
}
