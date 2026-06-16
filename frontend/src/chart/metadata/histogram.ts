/**
 * Histogram Chart Registration
 */
import * as echarts from 'echarts'
import * as eStat from 'echarts-stat'
import { registerChart } from '../core/registry'
import {
  ChartType,
  ChartCategory,
  ChartPurpose,
  CoordinateSystem,
} from '../types'
import type { HistogramChartConfig, DataTable, EChartsOptionInYWL } from '../types'
import {
  BASE_CONFIG_ITEMS,
  CARTESIAN_CONFIG_ITEMS,
  LABEL_CONFIG_ITEMS,
} from '../configItems'
import type { TConfigItem } from '../types/schema'

// Register ecStat transform
echarts.registerTransform((eStat as any).transform.histogram)

// ============================================================
// Data Mapping Meta
// ============================================================

const HISTOGRAM_DATA_MAPPING_META = {
  fields: [
    {
      key: 'valueField',
      label: '数值字段',
      required: true,
      fieldType: 'single' as const,
    },
  ],
}

// ============================================================
// Config Meta
// ============================================================

const HISTOGRAM_CONFIG_ITEMS: TConfigItem[] = [
  {
    key: 'chartSetting.binningAlgorithm',
    label: '分箱算法',
    type: 'select',
    group: 'other',
    options: [
      { label: 'Square Root', value: 'squareRoot' },
      { label: "Scott's normal reference rule", value: 'scott' },
      { label: 'Freedman–Diaconis rule', value: 'freedmanDiaconis' },
      { label: "Sturges's formula", value: 'sturges' },
    ],
  },
]

const HISTOGRAM_FULL_CONFIG_META = [
  ...BASE_CONFIG_ITEMS,
  ...CARTESIAN_CONFIG_ITEMS,
  ...LABEL_CONFIG_ITEMS,
  ...HISTOGRAM_CONFIG_ITEMS,
]

// ============================================================
// Transformer
// ============================================================

function histogramToEChartsOption(
  config: HistogramChartConfig,
  data: DataTable,
  baseOption: EChartsOptionInYWL
): EChartsOptionInYWL {
  const histogramConfig = config
  const { valueField } = histogramConfig.dataMapping
  const { binningAlgorithm } = histogramConfig.chartSetting || {}

  const header = data[0] as string[]
  const valueIdx = header.indexOf(valueField)

  if (valueIdx === -1) return baseOption

  // Prepare data for echarts-stat, it expects a flat array of numbers
  const rawValues: number[] = []
  for (let i = 1; i < data.length; i++) {
    const val = Number(data[i][valueIdx])
    if (!isNaN(val)) {
      rawValues.push(val)
    }
  }

  const result = eStat.histogram(rawValues, binningAlgorithm || 'squareRoot')
  const bins = result.data

  // Override xAxis type for histogram
  if (baseOption.xAxis) {
    baseOption.xAxis.type = 'category'
  }

  // Override yAxis type for histogram (count)
  if (baseOption.yAxis) {
    baseOption.yAxis.type = 'value'
  }

  baseOption.series = [
    {
      type: 'bar',
      name: valueField,
      data: bins,
      encode: {
        x: 0, // Bin start value
        y: 1, // Count
      },
      barWidth: '99.3%', // Nearly full width to show bins touching
      itemStyle: {
        borderWidth: 0,
      },
    },
  ]

  return baseOption
}

// ============================================================
// Demo Data
// ============================================================

const HISTOGRAM_DEMO_DATA = [
  ['Score'],
  [85],
  [92],
  [78],
  [88],
  [95],
  [70],
  [81],
  [89],
  [90],
  [83],
  [76],
  [87],
  [91],
  [84],
  [79],
  [86],
  [93],
  [75],
  [80],
  [94],
  [65],
  [72],
  [98],
  [60],
  [100],
  [55],
  [73],
  [82],
  [96],
  [68],
  [77],
  [85],
  [90],
  [81],
  [74],
  [89],
  [97],
  [63],
  [71],
  [84],
]

// ============================================================
// Histogram Chart Registration
// ============================================================

registerChart<HistogramChartConfig>({
  type: ChartType.HISTOGRAM,
  name: '直方图',
  enName: 'Histogram',
  category: [ChartCategory.HISTOGRAM], // Can be under Bar or a new Distribution category
  purpose: [ChartPurpose.DISTRIBUTION],
  description:
    '直方图通过柱状图展示数据的分布情况，显示数据点在不同区间内的频率。',
  coordinateSystem: CoordinateSystem.CARTESIAN,

  dataMappingMeta: HISTOGRAM_DATA_MAPPING_META,
  configMeta: HISTOGRAM_FULL_CONFIG_META,

  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'histogram',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: false }, // Histograms typically don't have legends for a single series
    label: { show: true },
    xAxis: { name: { show: true, text: '区间' }, tick: { show: true } },
    yAxis: { name: { show: true, text: '频数' }, tick: { show: true } },
    grid: { show: false },
    chartSetting: {
      binningAlgorithm: 'squareRoot',
    },
  }),

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_HISTOGRAM_1',
      chartName: '学生分数直方图',
      chartConfig: {
        version: 'v2',
        type: 'histogram',
        dataMapping: {
          valueField: 'Score',
        },
        title: { text: '学生分数分布直方图', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
        label: { show: true, format: 'decimal' },
        xAxis: { name: { show: true, text: '分数区间' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '频数' }, tick: { show: true } },
        grid: { show: false },
        chartSetting: {
          binningAlgorithm: 'squareRoot',
        },
      },
      chartFile: { content: HISTOGRAM_DEMO_DATA },
    },
  ],

  toEChartsOption: histogramToEChartsOption,
})
