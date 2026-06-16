/**
 * Boxplot Chart Registration
 *
 * 注册 boxplot (基础箱线图) 和 horizontal_boxplot (横向箱线图).
 */
import { registerChart } from '../core/registry'
import {
  ChartType,
  ChartCategory,
  ChartPurpose,
  CoordinateSystem,
} from '../types'
import type { BoxplotChartConfig, DataTable, EChartsOptionInYWL } from '../types'
import {
  BASE_CONFIG_ITEMS,
  CARTESIAN_CONFIG_ITEMS,
  LEGEND_CONFIG_ITEMS,
} from '../configItems'
import { THEMES } from '../theme'
import { hexToRgba } from '../utils'

// ============================================================
// Data Mapping Meta
// ============================================================

const BOXPLOT_DATA_MAPPING_META = {
  fields: [
    {
      key: 'dimension',
      label: '维度',
      required: true,
      fieldType: 'single' as const,
    },
    {
      key: 'metrics',
      label: '数值',
      required: true,
      fieldType: 'multiple' as const,
      showAlias: true,
    },
  ],
}

// ============================================================
// Config Meta
// ============================================================

const BOXPLOT_CONFIG_ITEMS = [
  ...BASE_CONFIG_ITEMS,
  ...CARTESIAN_CONFIG_ITEMS,
  ...LEGEND_CONFIG_ITEMS,
  // ...LABEL_CONFIG_ITEMS,
  {
    key: 'chartSetting.boxWidth',
    label: '箱体宽度',
    type: 'slider',
    group: 'style',
    range: [5, 100],
    props: {
      range: true,
    },
  },
  {
    key: 'chartSetting.splitArea',
    label: '背景条纹',
    type: 'switch',
    group: 'style',
  },
  {
    key: 'chartSetting.showOutliers',
    label: '显示异常点',
    type: 'switch',
    group: 'display_element',
  },
  {
    key: 'chartSetting.showDataPoints',
    label: '显示数据点',
    type: 'switch',
    group: 'display_element',
  },
] // ============================================================
// Boxplot Helper (Manual Implementation)
// ============================================================

function quantile(ascSortedData: number[], p: number): number {
  const H = (ascSortedData.length - 1) * p + 1
  const h = Math.floor(H)
  const v = +ascSortedData[h - 1]
  const e = H - h
  return e ? v + e * (ascSortedData[h] - v) : v
}

function prepareBoxplotData(rawData: number[][]) {
  const boxData: number[][] = []
  const outliers: number[][] = []

  rawData.forEach((data, i) => {
    if (data.length === 0) {
      boxData.push([])
      return
    }
    const sorted = data.slice().sort((a, b) => a - b)
    const Q1 = quantile(sorted, 0.25)
    const Q2 = quantile(sorted, 0.5)
    const Q3 = quantile(sorted, 0.75)
    const IQR = Q3 - Q1
    const minLimit = Q1 - 1.5 * IQR
    const maxLimit = Q3 + 1.5 * IQR

    // Find adjacent values within fences
    const validData = sorted.filter((v) => v >= minLimit && v <= maxLimit)

    // ECharts boxplot: [min, Q1, median, Q3, max]
    const min = validData.length > 0 ? validData[0] : Q1
    const max = validData.length > 0 ? validData[validData.length - 1] : Q3

    boxData.push([min, Q1, Q2, Q3, max])

    sorted.forEach((v) => {
      if (v < minLimit || v > maxLimit) {
        outliers.push([i, v])
      }
    })
  })

  return { boxData, outliers }
}

// ============================================================
// Transformer
// ============================================================

function boxplotToEChartsOption(
  config: BoxplotChartConfig,
  data: DataTable,
  baseOption: EChartsOptionInYWL
): EChartsOptionInYWL {
  const boxConfig = config
  const { dimension, metrics } = boxConfig.dataMapping
  const { boxWidth, showOutliers, splitArea, showDataPoints } =
    boxConfig.chartSetting || {}
  const isHorizontal = config.type === 'horizontal_boxplot'

  // 1. Prepare Data
  const header = data[0] as string[]
  const dimIdx = header.indexOf(dimension)

  if (dimIdx === -1 || metrics.length === 0) return baseOption

  // Collect data for each metric group by dimension
  const xAxisData: string[] = [] // Unique dimension values
  const seriesList: any[] = []

  // First, extract all unique dimension values to ensure consistent axis order
  const dimValuesSet = new Set<string>()
  // Skip header
  for (let i = 1; i < data.length; i++) {
    dimValuesSet.add(String(data[i][dimIdx]))
  }
  xAxisData.push(...Array.from(dimValuesSet))

  // Resolve Theme Colors
  let colors: string[] = []
  if (baseOption.color && Array.isArray(baseOption.color)) {
    colors = baseOption.color as string[]
  } else {
    // Fallback: look up in THEMES if config.theme is a key
    const themeKey = config.theme || 'academy'
    const themeDef = THEMES[themeKey as keyof typeof THEMES]
    if (themeDef) {
      colors = themeDef.color
    } else {
      colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666'] // Default fallback
    }
  }

  // Helper to generate deterministic pseudo-random jitter
  const seedRandom = (seed: number) => {
    let x = Math.sin(seed++) * 10000
    return x - Math.floor(x)
  }

  metrics.forEach((metric, index) => {
    const metricIdx = header.indexOf(metric.field)
    if (metricIdx === -1) return

    const groupedValues: number[][] = xAxisData.map(() => [])
    const rawPoints: number[][] = []

    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      const dVal = String(row[dimIdx])
      const mVal = Number(row[metricIdx])

      if (!isNaN(mVal)) {
        const xIndex = xAxisData.indexOf(dVal)
        if (xIndex !== -1) {
          groupedValues[xIndex].push(mVal)

          if (showDataPoints) {
            // Calculate jitter: Range [-0.25, 0.25] to stay within category width
            // Use index + i to make it look random but deterministic
            // const jitter = (seedRandom(i + index * 1000) - 0.5) * 0.5
            const jitter = 0
            if (isHorizontal) {
              // Horizontal: [value, categoryIndex + jitter]
              rawPoints.push([mVal, xIndex + jitter])
            } else {
              // Vertical: [categoryIndex + jitter, value]
              rawPoints.push([xIndex + jitter, mVal])
            }
          }
        }
      }
    }

    // Calculate stats manually
    const result = prepareBoxplotData(groupedValues)

    const color = colors[index % colors.length]
    const fillColor = hexToRgba(color, 0.5)
    const borderColor = color // Use full color for border
    const isShowDataPoints = showDataPoints && rawPoints.length > 0

    // Add Boxplot Series
    seriesList.push({
      name: metric.alias || metric.field,
      type: 'boxplot',
      data: result.boxData,
      boxWidth: boxWidth || [7, 50],
      itemStyle: {
        color: isShowDataPoints ? 'rgba(0,0,0,0)' : fillColor,
        borderColor: borderColor,
        borderWidth: 1.5,
      },
    })

    // Add Data Points (Jitter) Series
    if (isShowDataPoints) {
      seriesList.push({
        name: metric.alias || metric.field,
        type: 'scatter',
        data: rawPoints,
        xAxisIndex: isHorizontal ? 0 : 1, // Vertical: Scatter uses X-Axis 1 (Value)
        yAxisIndex: isHorizontal ? 1 : 0, // Horizontal: Scatter uses Y-Axis 1 (Value)
        symbolSize: 6,
        symbol: 'circle',
        itemStyle: {
          color: fillColor,
          borderColor: borderColor,
          borderWidth: 0,
          // opacity: 0.8,
        },
      })
    }

    // Add Outliers Series
    if (
      !showDataPoints &&
      showOutliers !== false &&
      result.outliers &&
      result.outliers.length > 0
    ) {
      let outliers = result.outliers
      if (isHorizontal) {
        // Swap [index, value] to [value, index]
        outliers = outliers.map((p: any[]) => [p[1], p[0]])
      }

      seriesList.push({
        name: metric.alias || metric.field,
        type: 'scatter',
        symbol: 'circle',
        data: outliers,
        itemStyle: { color: fillColor, borderWidth: 0 },
      })
    }
  })

  // The hidden axis for jitter alignment (Range: -0.5 to Length - 0.5)
  // Corresponds to category indices 0, 1, 2...
  const jitterAxis = {
    type: 'value',
    min: -0.5,
    max: xAxisData.length - 0.5,
    interval: 1,
    show: false, // Hidden
  }

  if (isHorizontal) {
    // Horizontal:
    // X: Value Axis (Main)
    // Y: Category Axis (Main) + Jitter Axis (Hidden)
    baseOption.xAxis = {
      ...baseOption.xAxis,
      type: 'value',
      splitArea: { show: !!splitArea },
      axisLine: { onZero: false },
    } as any
    baseOption.yAxis = [
      { ...baseOption.yAxis, type: 'category', data: xAxisData },
      jitterAxis,
    ] as any

    // x 轴是 value 轴, 使用 xAxis.interval 配置, 而不是 axisTick.interval
    // 因为 axisTick.interval 是用于 category 轴的, 而 value 轴的刻度间隔是根据数据值的间隔计算的
    // 但是xAxis.interval 和 axisTick.interval 行为不一致, 当 axisTick.interval = 0 时, tick 直接
    // 没有间隔, 而 xAxis.interval = 0 时, 不再显示 tick, 因为此时两个 value 之间的差值 = 0.
    if (Number.isInteger(config.xAxis?.tick?.interval)) {
      ;(baseOption.xAxis as any).interval = config.xAxis?.tick?.interval === 0 ? undefined : config.xAxis?.tick?.interval
    }

  } else {
    baseOption.yAxis = {
      ...baseOption.yAxis,
      type: 'value',
      splitArea: { show: !!splitArea },
      axisLine: { onZero: false },
    } as any
    baseOption.xAxis = [
      { ...baseOption.xAxis, type: 'category', data: xAxisData },
      jitterAxis,
    ] as any
  }

  baseOption.series = seriesList

  return baseOption
}

// ============================================================
// Demo Data
// ============================================================

const BOXPLOT_DEMO_DATA = [
  ['Department', 'Salary'],
  ['Marketing', 4200],
  ['Marketing', 4500],
  ['Marketing', 4300],
  ['Marketing', 3900],
  ['Marketing', 12000], // outlier
  ['Sales', 5000],
  ['Sales', 5200],
  ['Sales', 4800],
  ['Sales', 5100],
  ['Sales', 4900],
  ['Tech', 8000],
  ['Tech', 8500],
  ['Tech', 8200],
  ['Tech', 7800],
  ['Tech', 15000], // outlier
  ['HR', 4000],
  ['HR', 4100],
  ['HR', 3950],
  ['HR', 4050],
]

// ============================================================
// Boxplot Chart
// ============================================================

registerChart<BoxplotChartConfig>({
  type: ChartType.BOXPLOT,
  name: '基础箱线图',
  enName: 'Boxplot',
  category: [ChartCategory.BOXPLOT],
  purpose: [ChartPurpose.DISTRIBUTION, ChartPurpose.COMPARISON],
  description:
    '箱线图用于展示一组数据的分布情况（最小值、第一四分位数、中位数、第三四分位数、最大值）以及异常值。',
  coordinateSystem: CoordinateSystem.CARTESIAN,

  dataMappingMeta: BOXPLOT_DATA_MAPPING_META,
  configMeta: BOXPLOT_CONFIG_ITEMS as any,

  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'boxplot',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: false },
    grid: { show: true },
    xAxis: { name: { show: true, text: dataMapping.dimension as string }, tick: { show: true } },
    yAxis: { name: { show: true, text: dataMapping.metrics?.[0]?.alias ?? '' }, tick: { show: true } },
    chartSetting: {
      showOutliers: false,
      showDataPoints: false,
      splitArea: false,
      boxWidth: [7, 50],
    },
  }),

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_BOXPLOT_1',
      chartName: '部门薪资分布',
      chartConfig: {
        version: 'v2',
        type: 'boxplot',
        dataMapping: {
          dimension: 'Department',
          metrics: [{ field: 'Salary', alias: '薪资' }],
        },
        title: { text: '各部门薪资分布', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
        xAxis: { name: { show: true, text: '部门' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '薪资' }, tick: { show: true } },
        chartSetting: {
          showOutliers: false,
          showDataPoints: false,
          splitArea: false,
          boxWidth: [7, 50],
        },
      } as BoxplotChartConfig,
      chartFile: { content: BOXPLOT_DEMO_DATA },
    },
  ],

  toEChartsOption: boxplotToEChartsOption,
})

// ============================================================
// Horizontal Boxplot Chart
// ============================================================

registerChart<BoxplotChartConfig>({
  type: ChartType.HORIZONTAL_BOXPLOT,
  name: '横向箱线图',
  enName: 'Horizontal Boxplot',
  category: [ChartCategory.BOXPLOT],
  purpose: [ChartPurpose.DISTRIBUTION, ChartPurpose.COMPARISON],
  description: '横向展示的箱线图，适合类别名称较长的情况。',
  coordinateSystem: CoordinateSystem.CARTESIAN,

  dataMappingMeta: BOXPLOT_DATA_MAPPING_META,
  configMeta: BOXPLOT_CONFIG_ITEMS as any,

  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'horizontal_boxplot',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: false },
    grid: { show: true },
    xAxis: { name: { show: true, text: dataMapping.dimension as string }, tick: { show: true } },
    yAxis: { name: { show: true, text: dataMapping.metrics?.[0]?.alias ?? '' }, tick: { show: true } },
    chartSetting: {
      showOutliers: false,
      showDataPoints: false,
      splitArea: false,
      boxWidth: [7, 50],
    },
  }),

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_BOXPLOT_H_1',
      chartName: '部门薪资分布 (横向)',
      chartConfig: {
        version: 'v2',
        type: 'horizontal_boxplot',
        dataMapping: {
          dimension: 'Department',
          metrics: [{ field: 'Salary', alias: '薪资' }],
        },
        title: { text: '各部门薪资分布', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
        grid: { show: true },
        xAxis: { name: { show: true, text: '薪资' }, tick: { show: true, interval: 2000 } },
        yAxis: { name: { show: true, text: '部门' }, tick: { show: true } },
        chartSetting: {
          showOutliers: false,
          showDataPoints: false,
          splitArea: false,
          boxWidth: [7, 50],
        },
      },
      chartFile: { content: BOXPLOT_DEMO_DATA },
    },
  ],

  toEChartsOption: boxplotToEChartsOption,
})
