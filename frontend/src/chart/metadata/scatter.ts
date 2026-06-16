/**
 * Scatter Chart Registration
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
import type { ChartConfig, ScatterChartConfig, DataTable, EChartsOptionInYWL } from '../types'
import {
  BASE_CONFIG_ITEMS,
  CARTESIAN_CONFIG_ITEMS,
  LEGEND_CONFIG_ITEMS,
  LABEL_CONFIG_ITEMS,
  SCATTER_CONFIG_ITEMS,
} from '../configItems'

// Register ecStat transform
echarts.registerTransform((eStat as any).transform.regression)

// ============================================================
// Data Mapping Meta
// ============================================================

const SCATTER_DATA_MAPPING_META = {
  fields: [
    {
      key: 'xField',
      label: 'X轴 (数值)',
      required: true,
      fieldType: 'single' as const,
    },
    {
      key: 'yField',
      label: 'Y轴 (数值)',
      required: true,
      fieldType: 'single' as const,
    },
    {
      key: 'sizeField',
      label: '气泡大小 (数值)',
      required: false,
      fieldType: 'single' as const,
    },
    {
      key: 'colorField',
      label: '分组/颜色 (分类)',
      required: false,
      fieldType: 'single' as const,
    },
  ],
}

// ============================================================
// Config Meta
// ============================================================

const SCATTER_FULL_CONFIG_META = [
  ...BASE_CONFIG_ITEMS,
  ...CARTESIAN_CONFIG_ITEMS,
  ...LEGEND_CONFIG_ITEMS,
  ...LABEL_CONFIG_ITEMS,
  ...SCATTER_CONFIG_ITEMS,
]

// ============================================================
// Transformer
// ============================================================

function scatterToEChartsOption(
  config: ChartConfig,
  data: any[][],
  baseOption: EChartsOptionInYWL
): EChartsOptionInYWL {
  const scatterConfig = config as ScatterChartConfig
  const { xField, yField, sizeField, colorField } = scatterConfig.dataMapping
  const { symbolSize, bubbleSizeRange, regression } =
    scatterConfig.chartSetting || {}

  const header = data[0] as string[]
  const xIdx = header.indexOf(xField)
  const yIdx = header.indexOf(yField)
  const sizeIdx = sizeField ? header.indexOf(sizeField) : -1
  const colorIdx = colorField ? header.indexOf(colorField) : -1

  if (xIdx === -1 || yIdx === -1) return baseOption

  // Dataset Setup
  const datasets: any[] = [
    {
      id: 'raw_data',
      source: data,
    },
  ]
  const series: any[] = []

  // Extract unique groups if colorField is present
  const groups = new Set<string>()
  if (colorIdx !== -1) {
    for (let i = 1; i < data.length; i++) {
      groups.add(String(data[i][colorIdx]))
    }
  } else {
    groups.add('default')
  }

  // Helper for size visual map (manual implementation via callback)
  // We need min/max of size column to map it
  let minSizeVal = Infinity
  let maxSizeVal = -Infinity
  if (sizeIdx !== -1) {
    for (let i = 1; i < data.length; i++) {
      const val = Number(data[i][sizeIdx])
      if (!isNaN(val)) {
        if (val < minSizeVal) minSizeVal = val
        if (val > maxSizeVal) maxSizeVal = val
      }
    }
  }
  const sizeRange = bubbleSizeRange || [5, 30]
  const baseSymbolSize = symbolSize || 10

  // Size mapper function
  const symbolSizeCallback = (val: any[]) => {
    if (sizeIdx === -1) return baseSymbolSize
    // val corresponds to the dataset dimensions.
    // Since we are using 'raw_data' or filtered 'raw_data', the structure matches 'data' columns.
    // val[sizeIdx] is the value.
    const sVal = Number(val[sizeIdx])
    if (isNaN(sVal)) return baseSymbolSize

    // Linear map
    if (maxSizeVal === minSizeVal) return (sizeRange[0] + sizeRange[1]) / 2
    return (
      sizeRange[0] +
      ((sVal - minSizeVal) / (maxSizeVal - minSizeVal)) *
        (sizeRange[1] - sizeRange[0])
    )
  }

  // Regression Settings
  const regressionType = regression?.type ?? 'none'
  const regressionOrder = regression?.order ?? 2

  groups.forEach((groupName, idx) => {
    const groupId = `group_${idx}`

    // 1. Filter Dataset (if grouped)
    // If no colorField, we just use raw_data. But consistent logic is better.
    // If colorField, we transform raw_data -> filter -> series data
    if (colorIdx !== -1) {
      datasets.push({
        id: groupId,
        fromDatasetId: 'raw_data',
        transform: {
          type: 'filter',
          config: { dimension: colorIdx, eq: groupName },
        },
      })
    } else {
      // Alias raw_data as group_0 for consistency if needed, or just use raw_data
      // But for regression transform 'fromDatasetId', it is easier if we have unique IDs
    }
    const sourceDatasetId = colorIdx !== -1 ? groupId : 'raw_data'

    // 2. Scatter Series
    series.push({
      type: 'scatter',
      name:
        groupName === 'default' ? config.title?.text || 'Scatter' : groupName,
      datasetId: sourceDatasetId,
      symbolSize: symbolSizeCallback,
      encode: {
        x: xIdx,
        y: yIdx,
        tooltip: [xIdx, yIdx, sizeIdx, colorIdx].filter((i) => i !== -1),
      },
    })

    // 3. Regression Series (if enabled)
    // REVISED LOGIC for Regression with Transform
    // Since we cannot easily "project" columns in ECharts transform chain (no built-in map/project transform),
    // we will generate specific sources for regression in JS for each group.

    // NOTE: We do this OUTSIDE the loop usually, but here inside loop is fine as we need group separation.
  })

  if (regressionType !== 'none') {
    // We need to re-scan data to build [x, y] arrays for each group
    const groupDataMap = new Map<string, number[][]>()

    for (let i = 1; i < data.length; i++) {
      const row = data[i]
      const gName = colorIdx !== -1 ? String(row[colorIdx]) : 'default'
      const x = Number(row[xIdx])
      const y = Number(row[yIdx])
      if (!isNaN(x) && !isNaN(y)) {
        if (!groupDataMap.has(gName)) groupDataMap.set(gName, [])
        groupDataMap.get(gName)!.push([x, y])
      }
    }

    groups.forEach((groupName, idx) => {
      const points = groupDataMap.get(groupName) || []
      const xyDatasetId = `xy_${idx}`
      const regDatasetId = `reg_${idx}`

      datasets.push({
        id: xyDatasetId,
        source: points, // [ [x1, y1], [x2, y2] ... ]
      })

      datasets.push({
        id: regDatasetId,
        fromDatasetId: xyDatasetId,
        transform: {
          type: 'ecStat:regression',
          config: { method: regressionType, order: regressionOrder },
        },
      })

      series.push({
        type: 'line',
        name: groupName === 'default' ? '趋势线' : `${groupName} 趋势线`,
        datasetId: regDatasetId,
        symbol: 'none',
        // Use encoded dimensions from regression result
        // result is [ [x, y] ... ] points
        encode: { x: 0, y: 1 },
        lineStyle: { type: 'dashed', opacity: 0.7 },
      })
    })
  }

  baseOption.dataset = datasets
  baseOption.series = series

  // Clean up axis types
  // Ensure xAxis and yAxis exist
  if (!baseOption.xAxis) baseOption.xAxis = {}
  if (!baseOption.yAxis) baseOption.yAxis = {}

  // Handle array case just in case, though our builder makes it an object usually
  const xAxis = Array.isArray(baseOption.xAxis)
    ? baseOption.xAxis[0]
    : baseOption.xAxis
  const yAxis = Array.isArray(baseOption.yAxis)
    ? baseOption.yAxis[0]
    : baseOption.yAxis

  ;(xAxis as any).type = 'value'
  ;(xAxis as any).scale = true
  ;(yAxis as any).type = 'value'
  ;(yAxis as any).scale = true

  // 对于散点图这样的 x 轴是 value 轴, 使用 xAxis.interval 配置, 而不是 axisTick.interval
  // 因为 axisTick.interval 是用于 category 轴的, 而 value 轴的刻度间隔是根据数据值的间隔计算的
  // 但是xAxis.interval 和 axisTick.interval 行为不一致, 当 axisTick.interval = 0 时, tick 直接
  // 没有间隔, 而 xAxis.interval = 0 时, 不再显示 tick, 因为此时两个 value 之间的差值 = 0.
  if (Number.isInteger(config.xAxis?.tick?.interval)) {
    xAxis.interval = config.xAxis?.tick?.interval === 0 ? undefined : config.xAxis?.tick?.interval
  }

  return baseOption
}

// ============================================================
// Real-world Demo Data
// ============================================================

// 0. 基础散点: 房价分布 (面积 vs 价格)
const DATA_HOUSE_PRICES = [
  ['商品价格', '用户评分', '总销量'],
  [45, 82, 5400],
  [280, 65, 1200],
  [150, 95, 3000],
  [580, 78, 450],
  [32, 55, 2100],
  [420, 92, 800],
  [120, 70, 1500],
  [85, 88, 3200],
  [210, 45, 600],
  [350, 85, 900],
  [65, 60, 1800],
  [900, 98, 120],
  [180, 75, 1100],
  [25, 90, 4200],
]

// 1. 线性回归: 广告投入 vs 销售额
const DATA_ADS_SALES = [
  ['ad_cost', 'sales', 'channel'],
  [10, 25, '线上推广'],
  [15, 38, '线上推广'],
  [20, 45, '线上推广'],
  [30, 62, '线上推广'],
  [40, 85, '线上推广'],
  [50, 95, '线上推广'],
  [60, 115, '线上推广'],
  [80, 155, '线上推广'],
  [100, 190, '线上推广'],
  [12, 20, '电视广告'],
  [18, 32, '电视广告'],
  [25, 40, '电视广告'],
  [35, 55, '电视广告'],
  [45, 75, '电视广告'],
  [55, 88, '电视广告'],
  [70, 120, '电视广告'],
  [90, 160, '电视广告'],
  [110, 195, '电视广告'],
]

// 2. 指数回归: 投资复利增长 (年化 10% vs 5%)
// A = P * (1+r)^t
const DATA_COMPOUND_INTEREST = [
  ['year', 'assets', 'strategy'],
  // Strategy A: 10%
  [0, 100000, '进取型 (10%)'],
  [2, 121000, '进取型 (10%)'],
  [4, 146410, '进取型 (10%)'],
  [6, 177156, '进取型 (10%)'],
  [8, 214358, '进取型 (10%)'],
  [10, 259374, '进取型 (10%)'],
  [12, 313842, '进取型 (10%)'],
  [15, 417724, '进取型 (10%)'],
  [18, 555991, '进取型 (10%)'],
  [20, 700000, '进取型 (10%)'],
  // Strategy B: 5%
  [0, 100000, '稳健型 (5%)'],
  [2, 110250, '稳健型 (5%)'],
  [4, 121550, '稳健型 (5%)'],
  [6, 134009, '稳健型 (5%)'],
  [8, 147745, '稳健型 (5%)'],
  [10, 162889, '稳健型 (5%)'],
  [12, 179585, '稳健型 (5%)'],
  [15, 207892, '稳健型 (5%)'],
  [18, 240661, '稳健型 (5%)'],
  [20, 265329, '稳健型 (5%)'],
]

// 3. 对数回归: 学习曲线 (练习时间 vs 技能评分)
// Logarithmic: fast start, slow finish
const DATA_LEARNING_CURVE = [
  ['hours', 'score', 'student'],
  [1, 20, '普通学员'],
  [2, 35, '普通学员'],
  [5, 55, '普通学员'],
  [10, 68, '普通学员'],
  [20, 78, '普通学员'],
  [30, 83, '普通学员'],
  [50, 88, '普通学员'],
  [80, 92, '普通学员'],
  [100, 94, '普通学员'],
  [150, 96, '普通学员'],
  // Another group slightly lower
  [1, 15, '入门困难'],
  [3, 28, '入门困难'],
  [6, 45, '入门困难'],
  [12, 60, '入门困难'],
  [25, 72, '入门困难'],
  [40, 79, '入门困难'],
  [60, 84, '入门困难'],
  [90, 89, '入门困难'],
  [120, 92, '入门困难'],
]

// 4. 多项式回归: 车速与油耗 (U型曲线)
const DATA_FUEL_CONSUMPTION = [
  ['speed', 'consumption', 'car_type'],
  [20, 12.5, '轿车'],
  [30, 10.0, '轿车'],
  [40, 8.5, '轿车'],
  [50, 7.2, '轿车'],
  [60, 6.5, '轿车'],
  [70, 6.0, '轿车'],
  [80, 5.8, '轿车'],
  [90, 6.2, '轿车'],
  [100, 7.0, '轿车'],
  [110, 8.2, '轿车'],
  [120, 9.8, '轿车'],
  [130, 11.5, '轿车'],
  // SUV consumes more
  [20, 15.0, 'SUV'],
  [35, 12.0, 'SUV'],
  [50, 9.5, 'SUV'],
  [65, 8.2, 'SUV'],
  [80, 7.8, 'SUV'],
  [95, 8.5, 'SUV'],
  [110, 10.0, 'SUV'],
  [125, 12.5, 'SUV'],
]

// ============================================================
// Scatter Chart (Basic / Linear)
// ============================================================

registerChart({
  type: ChartType.SCATTER,
  name: '散点图',
  enName: 'Scatter Chart',
  category: [ChartCategory.SCATTER],
  purpose: [ChartPurpose.DISTRIBUTION, ChartPurpose.RELATIONSHIP],
  description: '基础散点图，默认无回归线，用于展示数据的分布模式。',
  coordinateSystem: CoordinateSystem.CARTESIAN,
  dataMappingMeta: SCATTER_DATA_MAPPING_META,
  configMeta: SCATTER_FULL_CONFIG_META,
  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'scatter',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'bottom' },
    label: { show: false },
    xAxis: { name: { show: true, text: dataMapping.xField ?? '' as string }, tick: { show: true } },
    yAxis: { name: { show: true, text: dataMapping.yField ?? '' as string }, tick: { show: true } },
    grid: { show: true },
    chartSetting: {
      symbolSize: 10,
      bubbleSizeRange: [5, 30],
      regression: { type: 'none' },
    },
  }),
  demos: [
    {
      chartId: 'NAUTILAB_DEMO_SCATTER_BASIC',
      chartName: '电商商品分析',
      chartConfig: {
        version: 'v2',
        type: 'scatter',
        dataMapping: {
          xField: '商品价格',
          yField: '用户评分',
          sizeField: '总销量',
        },
        title: { text: '商品价格与评分分布 (气泡大小=销量)', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'bottom' },
        label: { show: false },
        xAxis: { name: { show: true, text: '价格(元)' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '评分' }, tick: { show: true } },
        grid: { show: true },
        chartSetting: {
          symbolSize: 10,
          regression: { type: 'none' },
        },
      } as ScatterChartConfig,
      chartFile: { content: DATA_HOUSE_PRICES },
    },
  ],
  toEChartsOption: scatterToEChartsOption,
})

registerChart({
  type: ChartType.SCATTER_LINEAR,
  name: '线性回归散点图',
  enName: 'Scatter (Linear)',
  category: [ChartCategory.SCATTER],
  purpose: [ChartPurpose.TREND, ChartPurpose.RELATIONSHIP],
  description: '带有线性回归分析的散点图，用于展示线性趋势。',
  coordinateSystem: CoordinateSystem.CARTESIAN,
  dataMappingMeta: SCATTER_DATA_MAPPING_META,
  configMeta: SCATTER_FULL_CONFIG_META,
  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'scatter_linear',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'bottom' },
    xAxis: { name: { show: true, text: dataMapping.xField ?? '' as string }, tick: { show: true } },
    yAxis: { name: { show: true, text: dataMapping.yField ?? '' as string }, tick: { show: true } },
    grid: { show: true },
    chartSetting: { symbolSize: 10, regression: { type: 'linear' } },
  }),
  demos: [
    {
      chartId: 'NAUTILAB_DEMO_SCATTER_LINEAR',
      chartName: '广告销售回报',
      chartConfig: {
        version: 'v2',
        type: 'scatter_linear',
        dataMapping: {
          xField: 'ad_cost',
          yField: 'sales',
          colorField: 'channel',
        },
        title: { text: '广告投入与销售额线性分析', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'bottom' },
        grid: { show: true },
        xAxis: {
          name: { show: true, text: '广告投入 (万元)' },
          tick: { show: true },
        },
        yAxis: {
          name: { show: true, text: '销售额 (万元)' },
          tick: { show: true },
        },
        chartSetting: { regression: { type: 'linear' } },
      } as ScatterChartConfig,
      chartFile: { content: DATA_ADS_SALES },
    },
  ],
  toEChartsOption: scatterToEChartsOption,
})

registerChart({
  type: ChartType.SCATTER_EXPONENTIAL,
  name: '指数回归散点图',
  enName: 'Scatter (Exponential)',
  category: [ChartCategory.SCATTER],
  purpose: [ChartPurpose.TREND],
  description: '带有指数回归分析的散点图，适合展示快速增长或衰减的数据。',
  coordinateSystem: CoordinateSystem.CARTESIAN,
  dataMappingMeta: SCATTER_DATA_MAPPING_META,
  configMeta: SCATTER_FULL_CONFIG_META,
  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'scatter_exponential',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'bottom' },
    xAxis: { name: { show: true, text: dataMapping.xField ?? '' as string }, tick: { show: true } },
    yAxis: { name: { show: true, text: dataMapping.yField ?? '' as string }, tick: { show: true } },
    grid: { show: true },
    chartSetting: { symbolSize: 10, regression: { type: 'exponential' } },
  }),
  demos: [
    {
      chartId: 'NAUTILAB_DEMO_SCATTER_EXP',
      chartName: '复利增长',
      chartConfig: {
        version: 'v2',
        type: 'scatter_exponential',
        dataMapping: {
          xField: 'year',
          yField: 'assets',
          colorField: 'strategy',
        },
        title: { text: '资产复利增长趋势', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'bottom' },
        grid: { show: true },
        xAxis: { name: { show: true, text: '年份' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '资产总额' }, tick: { show: true } },
        chartSetting: { regression: { type: 'exponential' } },
      } as ScatterChartConfig,
      chartFile: { content: DATA_COMPOUND_INTEREST },
    },
  ],
  toEChartsOption: scatterToEChartsOption,
})

registerChart({
  type: ChartType.SCATTER_LOGARITHMIC,
  name: '对数回归散点图',
  enName: 'Scatter (Logarithmic)',
  category: [ChartCategory.SCATTER],
  purpose: [ChartPurpose.TREND],
  description: '带有对数回归分析的散点图，适合展示增长逐渐放缓的数据。',
  coordinateSystem: CoordinateSystem.CARTESIAN,
  dataMappingMeta: SCATTER_DATA_MAPPING_META,
  configMeta: SCATTER_FULL_CONFIG_META,
  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'scatter_logarithmic',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'bottom' },
    xAxis: { name: { show: true, text: dataMapping.xField ?? '' as string }, tick: { show: true } },
    yAxis: { name: { show: true, text: dataMapping.yField ?? '' as string }, tick: { show: true } },
    grid: { show: true },
    chartSetting: { symbolSize: 10, regression: { type: 'logarithmic' } },
  }),
  demos: [
    {
      chartId: 'NAUTILAB_DEMO_SCATTER_LOG',
      chartName: '学习曲线',
      chartConfig: {
        version: 'v2',
        type: 'scatter_logarithmic',
        dataMapping: {
          xField: 'hours',
          yField: 'score',
          colorField: 'student',
        },
        title: { text: '学习曲线 (边际效应递减)', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'bottom' },
        grid: { show: true },
        xAxis: {
          name: { show: true, text: '练习时长 (小时)' },
          tick: { show: true },
        },
        yAxis: { name: { show: true, text: '技能评分' }, tick: { show: true } },
        chartSetting: { regression: { type: 'logarithmic' } },
      } as ScatterChartConfig,
      chartFile: { content: DATA_LEARNING_CURVE },
    },
  ],
  toEChartsOption: scatterToEChartsOption,
})

registerChart({
  type: ChartType.SCATTER_POLYNOMIAL,
  name: '多项式回归散点图',
  enName: 'Scatter (Polynomial)',
  category: [ChartCategory.SCATTER],
  purpose: [ChartPurpose.TREND],
  description: '带有多项式回归分析的散点图，适合展示复杂的曲线波动趋势。',
  coordinateSystem: CoordinateSystem.CARTESIAN,
  dataMappingMeta: SCATTER_DATA_MAPPING_META,
  configMeta: SCATTER_FULL_CONFIG_META,
  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'scatter_polynomial',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'bottom' },
    xAxis: { name: { show: true, text: dataMapping.xField ?? '' as string }, tick: { show: true } },
    yAxis: { name: { show: true, text: dataMapping.yField ?? '' as string }, tick: { show: true } },
    grid: { show: true },
    chartSetting: {
      symbolSize: 10,
      regression: { type: 'polynomial', order: 3 },
    },
  }),
  demos: [
    {
      chartId: 'NAUTILAB_DEMO_SCATTER_POLY',
      chartName: '最优经济时速',
      chartConfig: {
        version: 'v2',
        type: 'scatter_polynomial',
        dataMapping: {
          xField: 'speed',
          yField: 'consumption',
          colorField: 'car_type',
        },
        title: { text: '车速与油耗关系 (U型曲线)', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'bottom' },
        grid: { show: true },
        xAxis: {
          name: { show: true, text: '车速 (km/h)' },
          tick: { show: true },
        },
        yAxis: {
          name: { show: true, text: '油耗 (L/100km)' },
          tick: { show: true },
        },
        chartSetting: { regression: { type: 'polynomial', order: 2 } },
      } as ScatterChartConfig,
      chartFile: { content: DATA_FUEL_CONSUMPTION },
    },
  ],
  toEChartsOption: scatterToEChartsOption,
})
