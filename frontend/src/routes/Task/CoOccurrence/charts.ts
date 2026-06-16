import type { ReportDefinition } from '@/types/mlApp'
import type { GraphChartConfig } from '@/chart'

export const coOccurrenceReport: ReportDefinition = {
  charts: [
    {
      key: 'force_directed_graph',
      chartName: '词共现网络',
      chartType: 'force_graph',
      getDefaultConfig: (): GraphChartConfig => ({
        version: 'v2',
        type: 'force_graph',
        dataMapping: {
          sourceField: 'word1',
          targetField: 'word2',
          valueField: 'frequency',
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
