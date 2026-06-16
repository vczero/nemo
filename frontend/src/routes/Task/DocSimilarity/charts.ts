import type { ReportDefinition } from '@/types/mlApp'
import type { MatrixHeatmapChartConfig } from '@/chart'

export const docSimilarityReport: ReportDefinition = {
  charts: [
    {
      key: 'matrix_heatmap',
      chartName: '相似度矩阵热力图',
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
        },
        label: {
          show: true,
        }
      }),
    },
  ],
  tables: [{ key: 'table' }],
}
