/**
 * Matrix Heatmap Chart Registration
 *
 * 矩阵热力图 — 宽表模式, X/Y 轴标签一致, 适合展示方阵数据 (如城市间距离、相关性矩阵).
 */
import { registerChart } from '../core/registry'
import {
  ChartType,
  ChartCategory,
  ChartPurpose,
  CoordinateSystem,
} from '../types'
import type { ChartConfig, MatrixHeatmapChartConfig, DataTable, EChartsOptionInYWL } from '../types'
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

// ============================================================
// Config Meta
// ============================================================

const MATRIX_HEATMAP_FULL_CONFIG_META = [
  ...BASE_CONFIG_ITEMS,
  ...CARTESIAN_CONFIG_ITEMS,
  ...LABEL_CONFIG_ITEMS,
  ...HEATMAP_CONFIG_ITEMS,
]

// ============================================================
// Transformer
// ============================================================

function matrixHeatmapToEChartsOption(
  config: ChartConfig,
  data: DataTable,
  baseOption: EChartsOptionInYWL
): EChartsOptionInYWL {
  const matrixConfig = config as MatrixHeatmapChartConfig
  const { visualMapMin, visualMapMax } = matrixConfig.chartSetting || {}
  const labelFormat = config.label?.format

  // 1. Parse wide-table data
  const header = data[0] as string[]
  const labelIdx = 0

  // X-axis labels: column headers excluding the label column
  const xAxisData = header.slice(1)
  // Build label → yAxisData index lookup
  const labelToYIndex = new Map(data.slice(1).map((row, i) => [row[labelIdx], i]))
  const seriesData: [number, number, number][] = []
  let minVal = Infinity
  let maxVal = -Infinity

  for (let i = 0; i < xAxisData.length; i++) {
    const xIndex = i

    for (let j = 0; j < xAxisData.length; j++) {
      const yLabel = xAxisData[j]
      const yIndex = labelToYIndex.get(yLabel)
      if (yIndex === undefined) continue
      const val = Number(data[yIndex + 1][xIndex + 1])
      if (!isNaN(val)) {
        seriesData.push([xIndex, j, val])
        if (val < minVal) minVal = val
        if (val > maxVal) maxVal = val
      }
    }
  }

  // 2. Setup Axes (both category)
  if (baseOption.xAxis) {
    ;(baseOption.xAxis as any).type = 'category'
    ;(baseOption.xAxis as any).data = xAxisData
    ;(baseOption.xAxis as any).splitArea = { show: !!config.grid?.show, areaStyle: {color: 'rgba(0,0,0,0)'} }
    ;(baseOption.xAxis as any).z = 20
    ;(baseOption.xAxis as any).axisTick.alignWithLabel = false
  }
  if (baseOption.yAxis) {
    ;(baseOption.yAxis as any).type = 'category'
    ;(baseOption.yAxis as any).data = xAxisData
    ;(baseOption.yAxis as any).splitArea = { show: !!config.grid?.show, areaStyle: {color: 'rgba(0,0,0,0)'} }
    ;(baseOption.yAxis as any).z = 20
  }

  baseOption.grid = baseOption.grid || {}
  baseOption.grid.right = typeof baseOption.grid.right === 'string' ? baseOption.grid.right : 80

  // 3. Setup VisualMap
  const inRange = isColorString(config.theme)
    ? { color: generateLighterColors(config.theme as string, 2, 0.9, false) }
    : undefined

  const valueRange = [
    visualMapMin ?? minVal,
    visualMapMax ?? maxVal
  ]

  baseOption.visualMap = {
    min: valueRange[0],
    max: valueRange[1],
    calculable: true,
    orient: 'vertical',
    right: 0,
    top: 'center',
    textStyle: {
      fontSize: config.fontSize ?? 12,
    },
    inRange,
  } as any

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
  ] as any

  return baseOption
}

// ============================================================
// Demo Data (宽表形式)
// ============================================================

const MATRIX_HEATMAP_DEMO_DATA: DataTable = [
  ['城市', '杭州', '宁波', '温州', '金华', '绍兴', '嘉兴', '湖州'],
  ['绍兴', 272, 81, 35, 31, 0, 25, 20],
  ['杭州', 0, 118, 91, 94, 106, 68, 79],
  ['宁波', 275, 0, 32, 29, 41, 22, 17],
  ['温州', 271, 56, 0, 49, 30, 25, 29],
  ['金华', 438, 121, 92, 0, 39, 30, 28],
  ['嘉兴', 315, 110, 47, 42, 50, 0, 59],
  ['湖州', 286, 36, 35, 28, 34, 45, 0],
]

// ============================================================
// Matrix Heatmap Chart
// ============================================================

registerChart<MatrixHeatmapChartConfig>({
  type: ChartType.MATRIX_HEATMAP,
  name: '矩阵热力图',
  enName: 'Matrix Heatmap',
  category: [ChartCategory.HEATMAP],
  purpose: [ChartPurpose.DISTRIBUTION, ChartPurpose.RELATIONSHIP],
  description:
    '矩阵热力图用于展示方阵数据，X/Y轴标签一致，适合展示城市间距离、相关性矩阵等对称数据。支持宽表格式。',
  coordinateSystem: CoordinateSystem.CARTESIAN,
  dataMappingMeta: null,
  configMeta: MATRIX_HEATMAP_FULL_CONFIG_META,

  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'matrix_heatmap',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: false },
    label: { show: true },
    xAxis: { name: { show: false, text: '' }, tick: { show: true } },
    yAxis: { name: { show: false, text: '' }, tick: { show: true } },
    grid: { show: true },
  }),

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_MATRIX_HEATMAP_1',
      chartName: '城市间客流矩阵',
      chartConfig: {
        version: 'v2',
        type: 'matrix_heatmap',
        title: { text: '城市间客流矩阵', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        label: { show: true, format: 'decimal' },
        xAxis: { name: { show: false, text: '' }, tick: { show: true } },
        yAxis: { name: { show: false, text: '' }, tick: { show: true } },
        legend: { show: false },
        grid: { show: true },
      } as MatrixHeatmapChartConfig,
      chartFile: { content: MATRIX_HEATMAP_DEMO_DATA },
    },
  ],

  toEChartsOption: matrixHeatmapToEChartsOption,
})
