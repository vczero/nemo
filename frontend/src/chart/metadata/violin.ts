/**
 * Violin Chart Registration
 */
import * as echarts from 'echarts'
// import violin from '@echarts-x/custom-violin'
import violin from '../vendors/violin'
import { registerChart } from '../core/registry'
import {
  ChartType,
  ChartCategory,
  ChartPurpose,
  CoordinateSystem,
} from '../types'
import type { ViolinChartConfig, DataTable, EChartsOptionInYWL } from '../types'
import {
  BASE_CONFIG_ITEMS,
  CARTESIAN_CONFIG_ITEMS,
  LEGEND_CONFIG_ITEMS,
} from '../configItems'
import type { TConfigItem } from '../types/schema'

echarts.use(violin as any)

// ============================================================
// Data Mapping Meta
// ============================================================

const VIOLIN_DATA_MAPPING_META = {
  fields: [
    {
      key: 'dimension',
      label: '维度 (X轴)',
      required: true,
      fieldType: 'single' as const,
    },
    {
      key: 'metrics',
      label: '数值 (Y轴)',
      required: true,
      fieldType: 'single' as const,
      showAlias: true,
    },
  ],
}

// ============================================================
// Config Meta
// ============================================================

const VIOLIN_CONFIG_ITEMS: TConfigItem[] = [
  {
    key: 'chartSetting.bandWidthScale',
    label: '带宽缩放',
    type: 'slider',
    group: 'style',
    range: [0.1, 10],
    props: { step: 0.1 },
  },
  {
    key: 'chartSetting.areaOpacity',
    label: '透明度',
    type: 'slider',
    group: 'style',
    range: [0.1, 1],
    props: { step: 0.1 },
  },
  {
    key: 'chartSetting.binCount',
    label: '采样精度',
    type: 'slider',
    group: 'other',
    range: [50, 500],
    props: { step: 50 },
  },
]

const VIOLIN_FULL_CONFIG_META = [
  ...BASE_CONFIG_ITEMS,
  ...CARTESIAN_CONFIG_ITEMS,
  ...LEGEND_CONFIG_ITEMS,
  // ...LABEL_CONFIG_ITEMS,
  ...VIOLIN_CONFIG_ITEMS,
]

// ============================================================
// Transformer
// ============================================================

function violinToEChartsOption(
  config: ViolinChartConfig,
  data: DataTable,
  baseOption: EChartsOptionInYWL
): EChartsOptionInYWL {
  const violinConfig = config
  const { dimension, metrics } = violinConfig.dataMapping
  const { bandWidthScale, areaOpacity, binCount } =
    violinConfig.chartSetting || {}

  const header = data[0] as string[]
  const dimIdx = header.indexOf(dimension)
  const metricIdx = header.indexOf(metrics)

  if (dimIdx === -1 || metricIdx === -1) return baseOption

  const xAxisData = new Set<string>()
  const seriesDataMap: Record<string, any[]> = {}

  // Pre-scan to get categories
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const dVal = String(row[dimIdx])
    xAxisData.add(dVal)
    if (!seriesDataMap[dVal]) {
      seriesDataMap[dVal] = []
    }

    if (isNaN(Number(row[metricIdx]))) {
      continue
    }

    seriesDataMap[dVal].push([dVal, Number(row[metricIdx])])
  }

  const xAxisList = Array.from(xAxisData)

  // Configure Axes
  if (baseOption.xAxis) {
    ;(baseOption.xAxis as any).type = 'category'
    ;(baseOption.xAxis as any).data = xAxisList
  }
  if (baseOption.yAxis) {
    ;(baseOption.yAxis as any).type = 'value'
    ;(baseOption.yAxis as any).scale = true
  }

  // Build Series
  baseOption.series = Object.keys(seriesDataMap).map((key) => ({
    type: 'custom',
    renderItem: 'violin',
    name: key,
    data: seriesDataMap[key],
    itemPayload: {
      bandWidthScale: bandWidthScale ?? 1,
      binCount: binCount ?? 100,
      symbolSize: 4,
      areaOpacity: areaOpacity ?? 0.6,
    },
    encode: {
      x: 0,
      y: 1,
    },
  })) as any

  return baseOption
}
// ============================================================
// Demo Data
// ============================================================

const VIOLIN_DEMO_DATA = [["职业", "薪资"],["FrontEnd",17.8],["FrontEnd",15],["FrontEnd",16.7],["FrontEnd",18.3],["FrontEnd",14.8],["FrontEnd",12.3],["FrontEnd",18.6],["FrontEnd",10.9],["FrontEnd",17.2],["FrontEnd",18.4],["FrontEnd",17.2],["FrontEnd",14.2],["FrontEnd",10.9],["FrontEnd",17.5],["FrontEnd",17.5],["FrontEnd",27.6],["FrontEnd",22.1],["FrontEnd",13.2],["FrontEnd",20.9],["FrontEnd",15],["FrontEnd",18.4],["FrontEnd",20.8],["FrontEnd",17.4],["FrontEnd",22.6],["FrontEnd",14.3],["FrontEnd",29.2],["FrontEnd",18.5],["FrontEnd",18.8],["FrontEnd",23.4],["FrontEnd",16.3],["FrontEnd",15.2],["FrontEnd",18.8],["FrontEnd",23.8],["FrontEnd",20.4],["FrontEnd",24.6],["FrontEnd",16.9],["FrontEnd",18.8],["FrontEnd",14.1],["FrontEnd",17.8],["FrontEnd",21.4],["FrontEnd",19.7],["FrontEnd",15.6],["FrontEnd",22.3],["FrontEnd",10.7],["FrontEnd",14],["FrontEnd",14.4],["FrontEnd",23.2],["FrontEnd",22.6],["FrontEnd",25.5],["FrontEnd",13.6],["BackEnd",14.2],["BackEnd",27.6],["BackEnd",27.3],["BackEnd",24.2],["BackEnd",19.3],["BackEnd",21.8],["BackEnd",23.9],["BackEnd",21.3],["BackEnd",13.3],["BackEnd",26.5],["BackEnd",21.6],["BackEnd",28.1],["BackEnd",24.3],["BackEnd",30.4],["BackEnd",19.9],["BackEnd",18.8],["BackEnd",29.8],["BackEnd",20.4],["BackEnd",25.2],["BackEnd",14.1],["BackEnd",18.2],["BackEnd",23.8],["BackEnd",19.4],["BackEnd",18.3],["BackEnd",17.6],["BackEnd",17.4],["BackEnd",17.9],["BackEnd",27.8],["BackEnd",21.3],["BackEnd",25.7],["BackEnd",20.8],["BackEnd",23.5],["BackEnd",18.8],["BackEnd",24.2],["BackEnd",24.9],["BackEnd",24.9],["BackEnd",17.5],["BackEnd",24.5],["BackEnd",20.7],["BackEnd",28.5],["BackEnd",21.9],["BackEnd",19.6],["BackEnd",24.7],["BackEnd",23],["BackEnd",21.3],["BackEnd",28.3],["BackEnd",20.7],["BackEnd",27.3],["BackEnd",14.5],["BackEnd",18],["Algorithm",24],["Algorithm",35.2],["Algorithm",27.1],["Algorithm",27.2],["Algorithm",20.8],["Algorithm",12.1],["Algorithm",28.2],["Algorithm",31.5],["Algorithm",17.4],["Algorithm",24],["Algorithm",15.1],["Algorithm",25.1],["Algorithm",30.6],["Algorithm",27.3],["Algorithm",24],["Algorithm",25.3],["Algorithm",15.5],["Algorithm",37.8],["Algorithm",24.9],["Algorithm",36.5],["Algorithm",16.8],["Algorithm",20.6],["Algorithm",21.4],["Algorithm",17.9],["Algorithm",33.6],["Algorithm",27.8],["Algorithm",36],["Algorithm",26.5],["Algorithm",27.6],["Algorithm",27],["Algorithm",21.5],["Algorithm",15.6],["Algorithm",18.3],["Algorithm",27.7],["Algorithm",34.4],["Algorithm",34.7],["Algorithm",26.4],["Algorithm",20.1],["Algorithm",25.2],["Algorithm",25.2],["Algorithm",34.7],["Algorithm",32.9],["Algorithm",41],["Algorithm",28.3],["Algorithm",31.7],["Algorithm",25.3],["Algorithm",28.8],["Algorithm",29.3],["Algorithm",30.2],["Algorithm",32.9],["Operation",17.7],["Operation",13.8],["Operation",16.2],["Operation",20],["Operation",16.8],["Operation",18.6],["Operation",14.7],["Operation",15],["Operation",11.6],["Operation",16.6],["Operation",17.5],["Operation",14.8],["Operation",20.2],["Operation",14],["Operation",9.8],["Operation",12.8],["Operation",12.9],["Operation",12.4],["Operation",21],["Operation",15.1],["Operation",20],["Operation",19.1],["Operation",15.4],["Operation",16.1],["Operation",15.4],["Operation",17.3],["Operation",14.4],["Operation",19.4],["Operation",16.8],["Operation",11.4],["Operation",15.3],["Operation",19.2],["Operation",17],["Operation",15],["Operation",14.2],["Operation",14.6],["Operation",16.3],["Operation",19.9],["Operation",18.2],["Operation",16],["Operation",13],["Operation",13.3],["Operation",16.2],["Operation",20.9],["Operation",14.6],["Operation",16.6],["Operation",15.5],["Operation",17.9],["Operation",13.8],["Operation",17.2]]
// ============================================================
// Violin Chart Registration
// ============================================================

registerChart<ViolinChartConfig>({
  type: ChartType.VIOLIN,
  name: '小提琴图',
  enName: 'Violin Plot',
  category: [ChartCategory.VIOLIN],
  purpose: [ChartPurpose.DISTRIBUTION, ChartPurpose.COMPARISON],
  description:
    '小提琴图结合了箱线图和核密度估计图，用于展示数据的分布形状和概率密度。',
  coordinateSystem: CoordinateSystem.CARTESIAN,

  dataMappingMeta: VIOLIN_DATA_MAPPING_META,
  configMeta: VIOLIN_FULL_CONFIG_META,

  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'violin',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'bottom' },
    xAxis: { name: { show: true, text: dataMapping.dimension ?? '' as string }, tick: { show: true } },
    yAxis: { name: { show: true, text: dataMapping.metrics ?? '' as string }, tick: { show: true } },
    grid: { show: true },
    chartSetting: {
      bandWidthScale: 1,
      areaOpacity: 0.5,
      binCount: 100,
    },
  }),

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_VIOLIN_1',
      chartName: '互联网平均薪资',
      chartConfig: {
        version: 'v2',
        type: 'violin',
        dataMapping: {
          dimension: '职业',
          metrics: '薪资',
        },
        title: { text: '互联网平均年薪分布(单位:万元)', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'right' },
        xAxis: { name: { show: true, text: '职业' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '薪资(单位:万元)' }, tick: { show: true } },
        chartSetting: {
          bandWidthScale: 5,
          areaOpacity: 0.5,
          binCount: 100,
        },
      },
      chartFile: { content: VIOLIN_DEMO_DATA },
    },
  ],

  toEChartsOption: violinToEChartsOption,
})
