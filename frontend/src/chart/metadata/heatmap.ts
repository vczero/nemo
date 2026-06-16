/**
 * Heatmap Chart Registration
 */
import { registerChart } from '../core/registry'
import {
  ChartType,
  ChartCategory,
  ChartPurpose,
  CoordinateSystem,
} from '../types'
import type { ChartConfig, HeatmapChartConfig, DataTable, EChartsOptionInYWL } from '../types'
import {
  BASE_CONFIG_ITEMS,
  CARTESIAN_CONFIG_ITEMS,
  LABEL_CONFIG_ITEMS,
  HEATMAP_CONFIG_ITEMS,
} from '../configItems'
import { formatValue, generateLighterColors } from '../utils'
import { isColorString } from '@/utils/utils'

// ============================================================
// Data Mapping Meta
// ============================================================

const HEATMAP_DATA_MAPPING_META = {
  fields: [
    {
      key: 'xField',
      label: 'X轴字段',
      required: true,
      fieldType: 'single' as const,
    },
    {
      key: 'yField',
      label: 'Y轴字段',
      required: true,
      fieldType: 'single' as const,
    },
    {
      key: 'valueField',
      label: '热力值 (度量)',
      required: true,
      fieldType: 'single' as const,
    },
  ],
}

// ============================================================
// Config Meta
// ============================================================

const HEATMAP_FULL_CONFIG_META = [
  ...BASE_CONFIG_ITEMS,
  ...CARTESIAN_CONFIG_ITEMS,
  // ...LEGEND_CONFIG_ITEMS,
  ...LABEL_CONFIG_ITEMS,
  ...HEATMAP_CONFIG_ITEMS,
]

// ============================================================
// Transformer
// ============================================================

function heatmapToEChartsOption(
  config: ChartConfig,
  data: DataTable,
  baseOption: EChartsOptionInYWL
): EChartsOptionInYWL {
  const heatmapConfig = config as HeatmapChartConfig
  const { xField, yField, valueField } = heatmapConfig.dataMapping
  const { visualMapMin, visualMapMax } =
    heatmapConfig.chartSetting || {}
  const labelFormat = config.label?.format

  // 1. Prepare Data
  const header = data[0] as string[]
  const xIdx = header.indexOf(xField)
  const yIdx = header.indexOf(yField)
  const metricField = valueField
  const vIdx = metricField ? header.indexOf(metricField) : -1

  if (xIdx === -1 || yIdx === -1 || vIdx === -1) return baseOption

  // Collect unique axis values
  const xData = new Set<string>()
  const yData = new Set<string>()
  const seriesDataRaw: { x: string; y: string; v: number }[] = []

  let minVal = Infinity
  let maxVal = -Infinity

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const xVal = String(row[xIdx])
    const yVal = String(row[yIdx])
    const val = Number(row[vIdx])

    if (!isNaN(val)) {
      xData.add(xVal)
      yData.add(yVal)
      seriesDataRaw.push({ x: xVal, y: yVal, v: val })

      if (val < minVal) minVal = val
      if (val > maxVal) maxVal = val
    }
  }

  const xAxisData = Array.from(xData)
  const yAxisData = Array.from(yData)

  // Map data to [xIndex, yIndex, value]
  const seriesData = seriesDataRaw.map((item) => {
    return [xAxisData.indexOf(item.x), yAxisData.indexOf(item.y), item.v]
  })

  // 2. Setup Axes
  // Force category axes
  if (baseOption.xAxis) {
    ;(baseOption.xAxis as any).type = 'category'
    ;(baseOption.xAxis as any).data = xAxisData
    ;(baseOption.xAxis as any).axisTick.alignWithLabel = false
    ;(baseOption.xAxis as any).splitArea = { show: !!config.grid?.show, areaStyle: {color: 'rgba(0,0,0,0)'} }
    ;(baseOption.xAxis as any).z = 20
  }
  if (baseOption.yAxis) {
    ;(baseOption.yAxis as any).type = 'category'
    ;(baseOption.yAxis as any).data = yAxisData
    ;(baseOption.yAxis as any).splitArea = { show: true }
  }

  baseOption.grid = baseOption.grid || {}
  baseOption.grid.right = typeof baseOption.grid.right === 'string' ? baseOption.grid.right : 80

  // 3. Setup VisualMap
  const inRange = isColorString(config.theme)
    ? { color: generateLighterColors(config.theme as string, 2, 0.9, false) }
    : undefined

  baseOption.visualMap = {
    min: visualMapMin ?? minVal,
    max: visualMapMax ?? maxVal,
    calculable: true,
    orient: 'vertical',
    right: 0,
    top: 'center',
    inRange,
    textStyle: {
      fontSize: config.fontSize ?? 12,
    },
  }

  // 4. Setup Series
  baseOption.series = [
    {
      type: 'heatmap',
      data: seriesData,
      label: {
        show: config.label?.show,
        fontSize: config.fontSize,
        formatter: (params: any) => {
          return formatValue(params.data[2], labelFormat)
        },
      },
    },
  ]

  return baseOption
}

// ============================================================
// Demo Data
// ============================================================

const HEATMAP_DEMO_DATA = [
  ['Time', 'Day', 'Sales'],
  ['12a', 'Saturday', 99],
  ['1a', 'Saturday', 2],
  ['2a', 'Saturday', 1],
  ['3a', 'Saturday', 0],
  ['4a', 'Saturday', 0],
  ['5a', 'Saturday', 0],
  ['6a', 'Saturday', 1],
  ['7a', 'Saturday', 2],
  ['8a', 'Saturday', 1],
  ['9a', 'Saturday', 5],
  ['10a', 'Saturday', 8],
  ['11a', 'Saturday', 12],
  ['12p', 'Saturday', 14],
  ['1p', 'Saturday', 15],
  ['2p', 'Saturday', 12],
  ['3p', 'Saturday', 16],
  ['4p', 'Saturday', 14],
  ['5p', 'Saturday', 11],
  ['6p', 'Saturday', 13],
  ['7p', 'Saturday', 10],
  ['8p', 'Saturday', 5],
  ['9p', 'Saturday', 4],
  ['10p', 'Saturday', 3],
  ['11p', 'Saturday', 2],
  ['12a', 'Friday', 2],
  ['1a', 'Friday', 1],
  ['2a', 'Friday', 0],
  ['3a', 'Friday', 0],
  ['4a', 'Friday', 0],
  ['5a', 'Friday', 1],
  ['6a', 'Friday', 2],
  ['7a', 'Friday', 4],
  ['8a', 'Friday', 2],
  ['9a', 'Friday', 4],
  ['10a', 'Friday', 5],
  ['11a', 'Friday', 10],
  ['12p', 'Friday', 12],
  ['1p', 'Friday', 14],
  ['2p', 'Friday', 12],
  ['3p', 'Friday', 14],
  ['4p', 'Friday', 16],
  ['5p', 'Friday', 18],
  ['6p', 'Friday', 15],
  ['7p', 'Friday', 12],
  ['8p', 'Friday', 8],
  ['9p', 'Friday', 5],
  ['10p', 'Friday', 3],
  ['11p', 'Friday', 1],
  ['12a', 'Thursday', 0],
  ['1a', 'Thursday', 0],
  ['2a', 'Thursday', 0],
  ['3a', 'Thursday', 0],
  ['4a', 'Thursday', 0],
  ['5a', 'Thursday', 0],
  ['6a', 'Thursday', 1],
  ['7a', 'Thursday', 3],
  ['8a', 'Thursday', 5],
  ['9a', 'Thursday', 3],
  ['10a', 'Thursday', 4],
  ['11a', 'Thursday', 8],
  ['12p', 'Thursday', 10],
  ['1p', 'Thursday', 12],
  ['2p', 'Thursday', 10],
  ['3p', 'Thursday', 12],
  ['4p', 'Thursday', 14],
  ['5p', 'Thursday', 15],
  ['6p', 'Thursday', 12],
  ['7p', 'Thursday', 10],
  ['8p', 'Thursday', 6],
  ['9p', 'Thursday', 4],
  ['10p', 'Thursday', 2],
  ['11p', 'Thursday', 1],
  ['12a', 'Wednesday', 0],
  ['1a', 'Wednesday', 0],
  ['2a', 'Wednesday', 10],
  ['3a', 'Wednesday', 12],
  ['4a', 'Wednesday', 14],
  ['5a', 'Wednesday', 15],
  ['6a', 'Wednesday', 12],
  ['7a', 'Wednesday', 10],
  ['8a', 'Wednesday', 6],
  ['9a', 'Wednesday', 4],
  ['10a', 'Wednesday', 2],
  ['11a', 'Wednesday', 1],
  ['12p', 'Wednesday', 0],
  ['1p', 'Wednesday', 0],
  ['2p', 'Wednesday', 0],
  ['3p', 'Wednesday', 0],
  ['4p', 'Wednesday', 0],
  ['5p', 'Wednesday', 0],
  ['6p', 'Wednesday', 1],
  ['7p', 'Wednesday', 3],
  ['8p', 'Wednesday', 5],
  ['9p', 'Wednesday', 3],
  ['10p', 'Wednesday', 4],
  ['11p', 'Wednesday', 8],
]

// ============================================================
// Heatmap Chart
// ============================================================

registerChart({
  type: ChartType.HEATMAP,
  name: '热力图',
  enName: 'Heatmap',
  category: [ChartCategory.HEATMAP],
  purpose: [ChartPurpose.DISTRIBUTION, ChartPurpose.RELATIONSHIP],
  description:
    '热力图通过颜色的深浅来展示二维数据的数值大小，适合展示数据的密度或频率分布。',
  coordinateSystem: CoordinateSystem.CARTESIAN,

  dataMappingMeta: HEATMAP_DATA_MAPPING_META,
  configMeta: HEATMAP_FULL_CONFIG_META,

  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'heatmap',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: false },
    label: { show: true },
    xAxis: { name: { show: true, text: dataMapping.xField as string }, tick: { show: true } },
    yAxis: { name: { show: true, text: dataMapping.yField as string }, tick: { show: true } },
    grid: { show: false },
  }),

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_HEATMAP_1',
      chartName: '时段销售热力',
      chartConfig: {
        version: 'v2',
        type: 'heatmap',
        dataMapping: {
          xField: 'Time',
          yField: 'Day',
          valueField: 'Sales',
        },
        title: { text: '每周各时段销售热力', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        label: { show: true, format: 'decimal' },
        xAxis: { name: { show: true, text: '时间' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '星期' }, tick: { show: true } },
        legend: { show: false },
        grid: { show: false },
        chartSetting: {
          visualMapMin: 0,
          visualMapMax: 20,
        },
      } as HeatmapChartConfig,
      chartFile: { content: HEATMAP_DEMO_DATA },
    },
  ],

  toEChartsOption: heatmapToEChartsOption,
})
