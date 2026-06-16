/**
 * Single Axis Scatter Chart Registration
 */
import { registerChart } from '../core/registry'
import {
  ChartType,
  ChartCategory,
  ChartPurpose,
  CoordinateSystem,
} from '../types'
import type { SingleAxisScatterChartConfig, EChartsOptionInYWL } from '../types'
import {
  BASE_CONFIG_ITEMS,
  LEGEND_CONFIG_ITEMS,
  LABEL_CONFIG_ITEMS,
  SINGLE_AXIS_SCATTER_CONFIG_ITEMS,
} from '../configItems'
import { formatValue } from '../utils'

// ============================================================
// Data Mapping Meta
// ============================================================

const SINGLE_AXIS_SCATTER_DATA_MAPPING_META = {
  fields: [
    {
      key: 'groupBy',
      label: '分组字段 (生成多个轴)',
      required: true,
      fieldType: 'single' as const,
    },
    {
      key: 'dimension',
      label: '维度 (轴)',
      required: true,
      fieldType: 'single' as const,
    },
    {
      key: 'valueField',
      label: '数值 (气泡大小)',
      required: true,
      fieldType: 'single' as const,
    },
  ],
}

// ============================================================
// Config Meta
// ============================================================

const SINGLE_AXIS_SCATTER_FULL_CONFIG_META = [
  ...BASE_CONFIG_ITEMS,
  ...LEGEND_CONFIG_ITEMS,
  ...LABEL_CONFIG_ITEMS,
  ...SINGLE_AXIS_SCATTER_CONFIG_ITEMS,
]

// ============================================================
// Utils
// ============================================================

function linearMap(
  val: number,
  domain: [number, number],
  range: [number, number]
): number {
  const [dMin, dMax] = domain
  const [rMin, rMax] = range
  if (dMax === dMin) return (rMin + rMax) / 2
  return rMin + ((val - dMin) / (dMax - dMin)) * (rMax - rMin)
}

// ============================================================
// Transformer
// ============================================================

function singleAxisScatterToEChartsOption(
  config: SingleAxisScatterChartConfig,
  data: any[][],
  baseOption: EChartsOptionInYWL
): EChartsOptionInYWL {
  const scatterConfig = config
  const { groupBy, dimension, valueField } = scatterConfig.dataMapping
  const { symbolSize, bubbleSizeRange, axisGap = 40, axisHeight = 40 } = scatterConfig.chartSetting || {}

  const header = data[0] as string[]
  const groupByIdx = header.indexOf(groupBy)
  const dimIdx = header.indexOf(dimension)
  const valIdx = header.indexOf(valueField)

  if (groupByIdx === -1 || valIdx === -1) return baseOption

  // 1. Group Data
  const groups = new Map<string, [string, number][]>()
  const groupNames: string[] = [] // maintain order

  let minSizeVal = Infinity
  let maxSizeVal = -Infinity

  const dimensionData = new Set<string | number>()

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const groupName = String(row[groupByIdx])
    const dimVal = String(row[dimIdx])
    const sVal = valIdx !== -1 ? Number(row[valIdx]) || 0 : 0

    dimensionData.add(dimVal)
    if (!groups.has(groupName)) {
      groups.set(groupName, [])
      groupNames.push(groupName)
    }
    if (dimVal) {
      groups.get(groupName)!.push([dimVal, sVal]) // [value, size]
    }
    if (valIdx !== -1) {
      if (sVal < minSizeVal) minSizeVal = sVal
      if (sVal > maxSizeVal) maxSizeVal = sVal
    }
  }

  // 2. Build Single Axes & Series
  delete baseOption.xAxis
  delete baseOption.yAxis
  // delete baseOption.grid

  baseOption.singleAxis = []
  baseOption.series = []

  const topMargin = baseOption.grid?.top ? (baseOption.grid?.top as number) + 15 : 60

  const sizeRange = bubbleSizeRange || [5, 30]
  const baseSymbolSize = symbolSize || 10

  const getSymbolSize = (val: any[]) => {
    if (valIdx === -1) return baseSymbolSize
    return linearMap(val[1], [minSizeVal, maxSizeVal], sizeRange)
  }
  groupNames.forEach((groupName, idx) => {
    const top = (topMargin + idx * (axisHeight + axisGap)) as number

    ;(baseOption.singleAxis as any[]).push({
      type: 'category',
      boundaryGap: false,
      top: top,
      height: axisHeight,
      axisLabel: {
        fontSize: config.fontSize,
      },
      data: Array.from(dimensionData),
      name: groupName,
      nameLocation: 'middle',
      nameGap: -50, // Move title up
      nameTextStyle: {
        fontWeight: 'bold',
        fontSize: config.fontSize,
      },
    })

    ;(baseOption.series as any[]).push({
      singleAxisIndex: idx,
      coordinateSystem: 'singleAxis',
      type: 'scatter',
      data: groups.get(groupName),
      symbolSize: getSymbolSize,
      name: groupName,
      label: {
        show: config.label?.show,
        position: config.label?.position,
        fontSize: config.fontSize,
        formatter: (params: any) => {
          return formatValue(params.value[1], config.label?.format)
        },
      },
    } as any)
  })
  return baseOption
}

// Convert time to decimal hours for demo purpose simpler numeric handling
const SINGLE_AXIS_DEMO_DATA_NUMERIC = [
  ['hour', 'intensity', 'city'],
  [8.0, 20, 'Beijing'],
  [9.0, 50, 'Beijing'],
  [10.0, 15, 'Beijing'],
  [18.0, 80, 'Beijing'],
  [19.0, 40, 'Beijing'],
  [20.0, 10, 'Beijing'],
  [8.0, 30, 'Shanghai'],
  [9.0, 60, 'Shanghai'],
  [10.0, 25, 'Shanghai'],
  [18.0, 50, 'Shanghai'],
  [19.0, 90, 'Shanghai'],
  [20.0, 20, 'Shanghai'],
  [8.0, 15, 'Guangzhou'],
  [9.0, 45, 'Guangzhou'],
  [10.0, 20, 'Guangzhou'],
  [18.0, 10, 'Guangzhou'],
  [19.0, 30, 'Guangzhou'],
  [20.0, 10, 'Guangzhou'],
  [8.0, 40, 'Shenzhen'],
  [9.0, 55, 'Shenzhen'],
  [10.0, 30, 'Shenzhen'],
  [18.0, 20, 'Shenzhen'],
  [19.0, 30, 'Shenzhen'],
  [20.0, 80, 'Shenzhen'],
]

// ============================================================
// Single Axis Scatter Chart
// ============================================================

registerChart({
  type: ChartType.SINGLE_AXIS_SCATTER,
  name: '单轴散点图',
  enName: 'Single Axis Scatter',
  category: [ChartCategory.SCATTER],
  purpose: [ChartPurpose.DISTRIBUTION, ChartPurpose.COMPARISON],
  description:
    '单轴散点图适用于展示一维数据在不同分类下的分布情况，常用于对比分析。',
  coordinateSystem: CoordinateSystem.SINGLE_AXIS,

  dataMappingMeta: SINGLE_AXIS_SCATTER_DATA_MAPPING_META,
  configMeta: SINGLE_AXIS_SCATTER_FULL_CONFIG_META,

  defaultConfig: {
    version: 'v2',
    type: 'single_axis_scatter',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'bottom' },
    label: { show: true },
    chartSetting: {
      symbolSize: 10,
      bubbleSizeRange: [10, 40],
    },
  },

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_SINGLE_AXIS_SCATTER',
      chartName: '城市高峰时段',
      chartConfig: {
        version: 'v2',
        type: 'single_axis_scatter',
        dataMapping: {
          groupBy: 'city',
          dimension: 'hour',
          valueField: 'intensity',
        },
        title: { text: '各城市高峰时段分布 (0-24h)', show: true },
        size: { width: 640, height: 400 },
        fontSize: 12,
        theme: 'academy',
        label: { show: true },
        legend: { show: true, position: 'bottom' },
        chartSetting: {
          bubbleSizeRange: [15, 50],
        },
      } as SingleAxisScatterChartConfig,
      chartFile: { content: SINGLE_AXIS_DEMO_DATA_NUMERIC },
    },
  ],

  toEChartsOption: singleAxisScatterToEChartsOption,
})
