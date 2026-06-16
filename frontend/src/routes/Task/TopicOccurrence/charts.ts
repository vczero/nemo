import type { ReportDefinition } from '@/types/mlApp'
import type { MatrixHeatmapChartConfig, GraphChartConfig } from '@/chart'

export const topicOccurrenceReport: ReportDefinition = {
  charts: [
    {
      key: 'matrix_heatmap',
      chartName: '主题共现矩阵',
      chartType: 'matrix_heatmap',
      getDefaultConfig: (): MatrixHeatmapChartConfig => ({
        version: 'v2',
        type: 'matrix_heatmap',
        dataMapping: null,
        title: { text: '', show: false },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
        grid: { show: true },
        xAxis: {
          tick: { show: true },
          labelRotate: 90,
        },
        label: {
          show: true,
        }
      }),
    },
    {
      key: 'force_directed_graph',
      chartName: '主题共现网络',
      chartType: 'force_graph',
      getDefaultConfig: (): GraphChartConfig => ({
        version: 'v2',
        type: 'force_graph',
        dataMapping: {
          sourceField: 'topic1',
          targetField: 'topic2',
          valueField: 'weight',
        },
        title: { text: '', show: false },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
        chartSetting: {
          force: {
            repulsion: 300,
            edgeLength: 150,
          },
          nodeSizeByWeight: true,
          nodeSizeRange: [10, 40],
          edgeWidthByWeight: true,
          showArrow: false,
          hideOverlap: true,
        },
      }),
    },
  ],
  tables: [
    { key: 'table' },
  ],
}
