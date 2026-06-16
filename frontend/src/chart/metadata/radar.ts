/**
 * Radar Chart Registration
 */
import { registerChart } from '../core/registry'
import {
  ChartType,
  ChartCategory,
  ChartPurpose,
  CoordinateSystem,
} from '../types'
import type { ChartConfig, RadarChartConfig, EChartsOptionInYWL } from '../types'
import {
  BASE_CONFIG_ITEMS,
  LEGEND_CONFIG_ITEMS,
  LABEL_CONFIG_ITEMS,
  RADAR_CONFIG_ITEMS,
} from '../configItems'

// ============================================================
// Data Mapping Meta
// ============================================================

const RADAR_DATA_MAPPING_META = {
  fields: [
    {
      key: 'dimension',
      label: '系列名称 (维度)',
      required: true,
      fieldType: 'single' as const,
    },
    {
      key: 'metrics',
      label: '雷达轴 (度量)',
      required: true,
      fieldType: 'multiple' as const,
      showAlias: true,
      extras: [
        {
          key: 'max',
          type: 'number' as const,
          props: {
            placeholder: '最大值 (为空则自动计算)',
            className: 'w-full',
          },
        },
      ],
    },
  ],
}

// ============================================================
// Config Meta
// ============================================================

const RADAR_FULL_CONFIG_META = [
  ...BASE_CONFIG_ITEMS,
  ...LEGEND_CONFIG_ITEMS,
  ...LABEL_CONFIG_ITEMS,
  ...RADAR_CONFIG_ITEMS,
]

// ============================================================
// Transformer
// ============================================================

function radarToEChartsOption(
  config: RadarChartConfig,
  data: any[][],
  baseOption: EChartsOptionInYWL
): EChartsOptionInYWL {
  const { dimension, metrics } = config.dataMapping
  const { shape, areaStyle, radius = 75 } = config.chartSetting || {}

  // 1. Prepare Data
  const header = data[0] as string[]
  const dimIdx = header.indexOf(dimension)

  if (dimIdx === -1) return baseOption

  // Identify metric indices
  const metricIndices = metrics
    .map((m) => header.indexOf(m.field))
    .filter((i) => i !== -1)
  if (metricIndices.length === 0) return baseOption

  // 2. Prepare Data Rows (skip header)
  const dataRows = data.slice(1)

  // 3. Calculate Max Values (Auto or User Defined)
  const indicatorMaxValues: number[] = new Array(metrics.length).fill(0)

  metrics.forEach((metric, i) => {
    // Priority: User defined max > Auto calculated max
    if (metric.max != null && metric.max > 0) {
      indicatorMaxValues[i] = metric.max
    } else {
      // Auto calculate from data
      const colIdx = header.indexOf(metric.field)
      if (colIdx !== -1) {
        let max = 0
        dataRows.forEach((row) => {
          const val = Number(row[colIdx]) || 0
          if (val > max) max = val
        })
        // Add a small buffer for aesthetics if desired,
        // or keep strict max. ECharts default is usually max * 1.something if undefined.
        // Here we want "current axis max" as default.
        indicatorMaxValues[i] = max
      }
    }
  })

  // 4. Build Indicators
  const indicator = metrics.map((m, i) => ({
    name: m.alias || m.field,
    max: indicatorMaxValues[i] || undefined, // undefined if 0, though we calculated it.
  }))

  // 5. Build Series Data
  const seriesData = dataRows.map((row) => ({
    name: String(row[dimIdx]),
    value: metricIndices.map((colIdx) => Number(row[colIdx]) || 0),
  }))

  // 6. Construct Option
  // Remove Cartesian components
  delete baseOption.xAxis
  delete baseOption.yAxis
  // delete baseOption.grid

  baseOption.radar = {
    indicator,
    shape: shape || 'polygon',
    center: ['50%', '50%'],
    radius: `${radius}%`,
    axisName: {
      fontSize: config.fontSize ?? 12,
    },
  }

  baseOption.series = [
    {
      type: 'radar',
      data: seriesData,
      areaStyle: areaStyle ? {} : undefined,
    },
  ]

  return baseOption
}

// ============================================================
// Demo Data
// ============================================================

const RADAR_DEMO_DATA = [
  [
    'name',
    'Sales',
    'Marketing',
    'Development',
    'Customer Support',
    'IT',
    'Administration',
  ],
  ['Allocated Budget', 4200, 3000, 20000, 35000, 50000, 18000],
  ['Actual Spending', 5000, 14000, 28000, 26000, 42000, 21000],
]

// ============================================================
// Radar Chart
// ============================================================

registerChart({
  type: ChartType.RADAR,
  name: '雷达图',
  enName: 'Radar Chart',
  category: [ChartCategory.RADAR],
  purpose: [ChartPurpose.COMPARISON, ChartPurpose.DISTRIBUTION],
  description:
    '雷达图用于比较多个定量变量, 可显示多维数据的变量值, 适合展示性能分析或能力评估。',
  coordinateSystem: CoordinateSystem.RADAR,

  dataMappingMeta: RADAR_DATA_MAPPING_META,
  configMeta: RADAR_FULL_CONFIG_META,

  defaultConfig: {
    version: 'v2',
    type: 'radar',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'bottom' },
    label: { show: false },
    chartSetting: {
      shape: 'polygon',
      areaStyle: true,
      radius: 75,
    },
  },

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_RADAR_1',
      chartName: '预算 vs 开销',
      chartConfig: {
        version: 'v2',
        type: 'radar',
        dataMapping: {
          dimension: 'name',
          metrics: [
            { field: 'Sales', alias: '销售', max: 6000 }, // Demo custom max
            { field: 'Marketing', alias: '市场' }, // Auto max
            { field: 'Development', alias: '研发' },
            { field: 'Customer Support', alias: '客服' },
            { field: 'IT', alias: '信息技术' },
            { field: 'Administration', alias: '行政' },
          ],
        },
        title: { text: '预算 vs 开销', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'bottom' },
        chartSetting: {
          shape: 'polygon',
          areaStyle: true,
          radius: 75,
        },
      } as RadarChartConfig,
      chartFile: { content: RADAR_DEMO_DATA },
    },
  ],

  toEChartsOption: radarToEChartsOption,
})
