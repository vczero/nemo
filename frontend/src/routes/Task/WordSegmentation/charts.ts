import type { ReportDefinition } from '@/types/mlApp'
import type { WordCloudChartConfig, BarChartConfig } from '@/chart'

export const wordSegmentationReport: ReportDefinition = {
  charts: [
    {
      key: 'wordcloud',
      chartName: '词云分布图',
      chartType: 'wordcloud',
      getDefaultConfig: (): WordCloudChartConfig => ({
        version: 'v2',
        type: 'wordcloud',
        dataMapping: {
          nameField: 'word',
          valueField: 'frequency',
        },
        title: { text: '', show: false },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
        chartSetting: {
          shape: 'circle',
          sizeRange: [10, 48],
          rotationRange: [-45, 45],
          rotationStep: 45,
        },
      }),
    },
    {
      key: 'horizontal_bar',
      chartName: '高频词统计 TOP 10',
      chartType: 'horizontal_bar',
      getDefaultConfig: (): BarChartConfig => ({
        version: 'v2',
        type: 'horizontal_bar',
        dataMapping: {
          dimension: 'word',
          metrics: [{ field: 'frequency', alias: '出现次数' }],
        },
        title: { text: '', show: false },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
        label: { show: true },
        xAxis: { name: { show: false, text: '' }, tick: { show: true } },
        yAxis: { name: { show: false, text: '' }, tick: { show: true } },
        grid: { show: false },
      }),
    },
  ],
  tables: [
    { key: 'table' },
  ],
}
