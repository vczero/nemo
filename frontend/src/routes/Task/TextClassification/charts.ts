import type { ReportDefinition } from '@/types/mlApp'
import type { PieChartConfig } from '@/chart'

export const textClassificationReport: ReportDefinition = {
  charts: [
    {
      key: 'chart_pie',
      chartName: '分类结果概览',
      chartType: 'pie',
      getDefaultConfig: (): PieChartConfig => ({
        version: 'v2',
        type: 'pie',
        dataMapping: {
          nameField: 'category',
          valueField: 'count',
        },
        title: { text: '', show: false },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true },
        label: { show: true },
        chartSetting: {
          radius: 55,
          showLabelName: true,
        },
      }),
    },
  ],
  tables: [{ key: 'table' }],
}
