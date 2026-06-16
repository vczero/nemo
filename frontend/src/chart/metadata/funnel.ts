/**
 * Funnel Chart Family Registration
 *
 * 注册 funnel (基础漏斗图), pyramid (金字塔图) 和 compare_funnel (对比漏斗图).
 */
import { registerChart } from '../core/registry'
import {
  ChartType,
  ChartCategory,
  ChartPurpose,
  CoordinateSystem,
} from '../types'
import type {
  ChartConfig,
  FunnelChartConfig,
  CompareFunnelChartConfig,
  DataTable,
  EChartsOptionInYWL,
} from '../types'
import {
  BASE_CONFIG_ITEMS,
  LEGEND_CONFIG_ITEMS,
  LABEL_CONFIG_ITEMS,
  FUNNEL_CONFIG_ITEMS,
  FUNNEL_BASIC_CONFIG_ITEMS,
  GRID_CONFIG_ITEMS,
} from '../configItems'
import { formatValue } from '../utils'

// ============================================================
// Data Mapping Meta
// ============================================================

const FUNNEL_DATA_MAPPING_META = {
  fields: [
    {
      key: 'nameField',
      label: '名称字段',
      required: true,
      fieldType: 'single' as const,
    },
    {
      key: 'valueField',
      label: '数值字段',
      required: true,
      fieldType: 'single' as const,
    },
  ],
}

const COMPARE_FUNNEL_DATA_MAPPING_META = {
  fields: [
    {
      key: 'dimension',
      label: '维度',
      required: true,
      fieldType: 'single' as const,
    },
    {
      key: 'metrics',
      label: '度量',
      required: true,
      fieldType: 'multiple' as const,
      maxFields: 2,
      showAlias: true,
    },
  ],
}

// ============================================================
// Config Meta
// ============================================================

const FUNNEL_FULL_CONFIG_META = [
  ...BASE_CONFIG_ITEMS,
  ...LEGEND_CONFIG_ITEMS,
  ...LABEL_CONFIG_ITEMS,
  ...FUNNEL_CONFIG_ITEMS,
  ...GRID_CONFIG_ITEMS,
]

const COMPARE_FUNNEL_CONFIG_META = [
  ...BASE_CONFIG_ITEMS,
  ...LEGEND_CONFIG_ITEMS,
  ...LABEL_CONFIG_ITEMS,
  ...FUNNEL_BASIC_CONFIG_ITEMS,
  ...GRID_CONFIG_ITEMS,
]

// ============================================================
// Utils
// ============================================================

/**
 * 构建漏斗图标签配置
 */
function buildFunnelLabelOption(config: ChartConfig): Record<string, unknown> {
  const showValue = config.label?.show ?? false
  const format = config.label?.format

  if (!showValue) {
    return { show: false }
  }

  return {
    show: true,
    position: 'inside',
    formatter: (params: { name: string; value: number }) => {
      const parts: string[] = []
      if (params.name) {
        parts.push(params.name)
      }
      if (params.value != null) {
        parts.push(formatValue(params.value, format))
      }
      return parts.join('\n')
    },
    fontSize: config.fontSize ?? 12,
  }
}

/**
 * 构建带转化率的漏斗图配置
 */
// function buildConversionRateOptions(
//   data: { name: string; value: number }[],
//   options: EChartsOption,
//   config: ChartConfig,
//   show: boolean,
// ) {
//   if (!show || data.length === 0) return

//   // 1. Overall Rate (Graphic)
//   const firstVal = data[0].value
//   const lastVal = data[data.length - 1].value
//   const overallRate = firstVal ? (lastVal / firstVal) * 100 : 0
//   const overallText = `整体转化率\n${overallRate.toFixed(2)}%`

//   options.graphic = [
//     {
//       type: 'text',
//       left: '10%',
//       top: 'middle',
//       style: {
//         text: overallText,
//         fill: '#666',
//         fontSize: config.fontSize,
//         fontWeight: 'bold',
//       },
//     },
//   ]

//   // 2. Step Rate (Ghost Series)
//   const stepData = data.map((item, index) => {
//     if (index === 0) return { ...item, rate: 0, showRate: false }
//     const prev = data[index - 1].value
//     const rate = prev ? (item.value / prev) * 100 : 0
//     return {
//       ...item,
//       rate,
//       showRate: true,
//     }
//   })

//   if (!options.series) options.series = []
//   ;(options.series as any[]).push({
//     type: 'funnel',
//     sort: 'descending',
//     gap: 2,
//     label: {
//       show: true,
//       position: 'right',
//       formatter: (params: any) => {
//         if (params.data && params.data.showRate) {
//           return `转化率\n${params.data.rate.toFixed(2)}%`
//         }
//         return ''
//       },
//       color: '#333',
//     },
//     labelLine: {
//       show: true,
//       length: 20, // Increased length for better visibility
//       lineStyle: {
//         width: 1,
//         type: 'solid'
//       }
//     },
//     itemStyle: {
//       color: 'transparent',
//       // borderWidth: 0,
//     },
//     data: stepData,
//     top: 60,
//     bottom: 60,
//     left: '15%',
//     // width: '50%',
//     tooltip: { show: false },
//     z: 20,
//     silent: true,
//     labelLayout: { hideOverlap: false },
//   })
// }

// ============================================================
// Transformer
// ============================================================

function funnelToEChartsOption(
  config: ChartConfig,
  data: DataTable,
  baseOption: EChartsOptionInYWL
): EChartsOptionInYWL {
  const funnelConfig = config as FunnelChartConfig
  const { nameField, valueField } = funnelConfig.dataMapping
  const { sort, gap, minSize } = funnelConfig.chartSetting || {}
  const isPyramid = config.type === 'pyramid'

  // 1. Prepare Data
  const header = data[0] as string[]
  const nameIdx = header.indexOf(nameField)
  const valIdx = header.indexOf(valueField)

  if (nameIdx === -1 || valIdx === -1) return baseOption

  const seriesData = []
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    seriesData.push({
      name: String(row[nameIdx]),
      value: Number(row[valIdx]) || 0,
    })
  }

  // const { top, right, left, bottom } = calculateGridOffset(config, baseOption)

  // 2. Build Series
  const labelOption = buildFunnelLabelOption(config)
  const mainSeries = {
    type: 'funnel',
    sort: sort || (isPyramid ? 'ascending' : 'descending'),
    gap: gap || 0,
    minSize: minSize ? `${minSize}%` : '0%',
    label: labelOption,
    data: seriesData,
    top: baseOption.grid?.top || 60,
    bottom: baseOption.grid?.bottom || 60,
    left: baseOption.grid?.left || '10%',
    right: baseOption.grid?.right || '10%',
  }

  // Clean Cartesian
  delete baseOption.xAxis
  delete baseOption.yAxis
  delete baseOption.grid

  baseOption.series = [mainSeries]

  // 3. Conversion Rate
  //   if (showConversionRate) {
  //     buildConversionRateOptions(seriesData, baseOption, config, true)

  //     // Ensure ghost series properties sync with main series
  //     if ((baseOption.series as any[])[1]) {
  //        const ghost = (baseOption.series as any[])[1]
  //        ghost.sort = mainSeries.sort
  //        ghost.gap = mainSeries.gap
  //        ghost.minSize = mainSeries.minSize
  //     }
  //   }

  return baseOption
}

function compareFunnelToEChartsOption(
  config: ChartConfig,
  data: DataTable,
  baseOption: EChartsOptionInYWL
): EChartsOptionInYWL {
  const compareConfig = config as CompareFunnelChartConfig
  const { dimension, metrics } = compareConfig.dataMapping
  const { gap, sort, minSize } = compareConfig.chartSetting || {}

  if (metrics.length < 2) return baseOption

  const header = data[0] as string[]
  const dimIdx = header.indexOf(dimension)
  const m1Idx = header.indexOf(metrics[0].field)
  const m2Idx = header.indexOf(metrics[1].field)

  if (dimIdx === -1 || m1Idx === -1 || m2Idx === -1) return baseOption

  const data1 = []
  const data2 = []

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const name = String(row[dimIdx])
    data1.push({ name, value: Number(row[m1Idx]) || 0 })
    data2.push({ name, value: Number(row[m2Idx]) || 0 })
  }

  const labelOption = buildFunnelLabelOption(config)

  const left =
    typeof baseOption.grid?.left === 'string'
      ? Number(baseOption.grid?.left.replace('%', ''))
      : 2
  const right =
    typeof baseOption.grid?.right === 'string'
      ? Number(baseOption.grid?.right.replace('%', ''))
      : 2
  const top = baseOption.grid?.top || 60
  const bottom = baseOption.grid?.bottom || 60

  console.log(left)

  const commonProps = {
    top,
    bottom,
    gap: gap ?? 1, // Default to 1px
    minSize: minSize ? `${minSize}%` : '0%',
    sort: sort || 'descending',
    label: labelOption,
  }

  const width = (100 - (left+right)) / 2 - 0.5

  baseOption.series = [
    {
      type: 'funnel',
      name: metrics[0].alias || metrics[0].field,
      width: `${width}%`,
      left: `${left}%`,
      funnelAlign: 'right',
      data: data1,
      ...commonProps,
    },
    {
      type: 'funnel',
      name: metrics[1].alias || metrics[1].field,
      width: `${width}%`,
      left: `${width + left + 0.2}%`, // 0.2 用于增加中间的间距
      funnelAlign: 'left',
      data: data2,
      ...commonProps,
    },
  ] as any

  // Update Legend
  if (baseOption.legend && !Array.isArray(baseOption.legend)) {
    baseOption.legend.data = [
      metrics[0].alias || metrics[0].field,
      metrics[1].alias || metrics[1].field,
    ]
  }

  // Clean Cartesian
  delete baseOption.xAxis
  delete baseOption.yAxis
  delete baseOption.grid

  return baseOption
}

// ============================================================
// Demo Data
// ============================================================

const FUNNEL_DEMO_DATA = [
  ['stage', 'count'],
  ['展现', 100],
  ['点击', 80],
  ['访问', 60],
  ['咨询', 40],
  ['订单', 20],
]

const COMPARE_FUNNEL_DEMO_DATA = [
  ['stage', 'actual', 'expected'],
  ['展现', 100, 100],
  ['点击', 80, 80],
  ['访问', 60, 60],
  ['咨询', 40, 40],
  ['订单', 20, 20],
]

// ============================================================
// Funnel Chart (Conversion / Inverted Pyramid)
// ============================================================

registerChart({
  type: ChartType.FUNNEL,
  name: '转化漏斗图',
  enName: 'Conversion Funnel',
  category: [ChartCategory.FUNNEL],
  purpose: [ChartPurpose.PROPORTION, ChartPurpose.TREND],
  description:
    '转化漏斗图展示从一个阶段到下一个阶段的转化情况，通常用于销售或用户行为分析。',
  coordinateSystem: CoordinateSystem.NONE,

  dataMappingMeta: FUNNEL_DATA_MAPPING_META,
  configMeta: FUNNEL_FULL_CONFIG_META,

  defaultConfig: {
    version: 'v2',
    type: 'funnel',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true },
    label: { show: true },
    chartSetting: {
      sort: 'descending',
      gap: 2,
      minSize: 0,
    },
  },

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_FUNNEL_1',
      chartName: '销售转化漏斗',
      chartConfig: {
        version: 'v2',
        type: 'funnel',
        dataMapping: {
          nameField: 'stage',
          valueField: 'count',
        },
        title: { text: '销售转化漏斗', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'bottom' },
        label: { show: true, format: 'decimal' },
        chartSetting: {
          sort: 'descending',
          gap: 2,
          minSize: 0,
        },
      } as FunnelChartConfig,
      chartFile: { content: FUNNEL_DEMO_DATA },
    },
  ],

  toEChartsOption: funnelToEChartsOption,
})

// ============================================================
// Pyramid Chart (Positive)
// ============================================================

registerChart({
  type: ChartType.PYRAMID,
  name: '金字塔图',
  enName: 'Pyramid Chart',
  category: [ChartCategory.FUNNEL],
  purpose: [ChartPurpose.HIERARCHY, ChartPurpose.PROPORTION],
  description: '金字塔图是底座宽顶部窄的漏斗图，常用于展示层级结构或累积过程。',
  coordinateSystem: CoordinateSystem.NONE,

  dataMappingMeta: FUNNEL_DATA_MAPPING_META,
  configMeta: FUNNEL_FULL_CONFIG_META,

  defaultConfig: {
    version: 'v2',
    type: 'pyramid',
    title: { text: '金字塔层级', show: true },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'bottom' },
    label: { show: true },
    chartSetting: {
      sort: 'ascending',
      gap: 2,
      minSize: 0,
    },
  },

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_PYRAMID_1',
      chartName: '用户层级金字塔',
      chartConfig: {
        version: 'v2',
        type: 'pyramid',
        dataMapping: {
          nameField: 'stage',
          valueField: 'count',
        },
        title: { text: '用户层级金字塔', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'bottom' },
        label: { show: true, format: 'decimal' },
        chartSetting: {
          sort: 'ascending',
          gap: 2,
          minSize: 0,
        },
      } as FunnelChartConfig,
      chartFile: { content: FUNNEL_DEMO_DATA },
    },
  ],

  toEChartsOption: funnelToEChartsOption,
})

// ============================================================
// Compare Funnel (Contrast)
// ============================================================

registerChart({
  type: ChartType.COMPARE_FUNNEL,
  name: '对比漏斗图',
  enName: 'Compare Funnel',
  category: [ChartCategory.FUNNEL],
  purpose: [ChartPurpose.COMPARISON, ChartPurpose.PROPORTION],
  description:
    '对比漏斗图通过左右并列的漏斗，对比两个不同指标（如预期与实际）在各个阶段的转化情况。',
  coordinateSystem: CoordinateSystem.NONE,

  dataMappingMeta: COMPARE_FUNNEL_DATA_MAPPING_META,
  configMeta: COMPARE_FUNNEL_CONFIG_META,

  defaultConfig: {
    version: 'v2',
    type: 'compare_funnel',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'bottom' },
    label: { show: true },
    chartSetting: {
      sort: 'descending',
      gap: 1, // Default to 1px
      minSize: 0,
    },
  },

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_COMPARE_FUNNEL_1',
      chartName: '转化对比',
      chartConfig: {
        version: 'v2',
        type: 'compare_funnel',
        dataMapping: {
          dimension: 'stage',
          metrics: [
            { field: 'actual', alias: '实际' },
            { field: 'expected', alias: '预期' },
          ],
        },
        title: { text: '转化漏斗对比', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'bottom' },
        label: { show: true, format: 'decimal' },
        chartSetting: {
          sort: 'descending',
          gap: 1,
          minSize: 0,
        },
      } as CompareFunnelChartConfig,
      chartFile: { content: COMPARE_FUNNEL_DEMO_DATA },
    },
  ],

  toEChartsOption: compareFunnelToEChartsOption,
})
