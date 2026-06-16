/**
 * Chord Chart Registration
 *
 * 注册 chord (和弦图).
 * 基于 ECharts 6.0+ 新增的 type='chord' 支持。
 */
import { registerChart } from '../core/registry'
import { ChartType, ChartCategory, ChartPurpose, CoordinateSystem } from '../types'
import type { ChordChartConfig, DataTable, EChartsOptionInYWL } from '../types'
import {
  BASE_CONFIG_ITEMS,
  LEGEND_CONFIG_ITEMS,
  LABEL_CONFIG_ITEMS,
  NAME_LABEL_CONFIG_ITEMS
} from '../configItems'
import type { TConfigItem } from '../types/schema'
import { formatValue } from '../utils'

// ============================================================
// Data Mapping Meta
// ============================================================

const CHORD_DATA_MAPPING_META = {
  fields: [
    { key: 'sourceField', label: '来源节点', required: true, fieldType: 'single' as const },
    { key: 'targetField', label: '目标节点', required: true, fieldType: 'single' as const },
    { key: 'valueField', label: '关系权重', required: true, fieldType: 'single' as const },
  ],
}

// ============================================================
// Config Meta
// ============================================================

// 增加 clockwise 配置
const CHORD_CONFIG_ITEMS: TConfigItem[] = [
  // {
  //   key: 'chartSetting.clockwise',
  //   label: '顺时针排列',
  //   type: 'switch',
  //   group: 'other',
  // },
  {
    key: 'chartSetting.radius',
    label: '外半径',
    type: 'slider',
    range: [10, 100],
    group: 'style',
  },
  {
    key: 'chartSetting.innerRadius',
    label: '内半径',
    type: 'slider',
    range: [0, 99],
    group: 'style',
  },
  {
    key: 'chartSetting.colorFrom',
    label: '颜色来源',
    type: 'select',
    group: 'style',
    options: [
      { label: '源节点', value: 'source' },
      { label: '目标节点', value: 'target' },
    ],
  },
  {
    key: 'chartSetting.opacity',
    label: '透明度',
    type: 'slider',
    group: 'style',
    range: [0.1, 1],
    props: {
      step: 0.1
    }
  },
]

const CHORD_FULL_CONFIG_META = [
  ...BASE_CONFIG_ITEMS,
  ...LEGEND_CONFIG_ITEMS,
  ...LABEL_CONFIG_ITEMS,
  ...NAME_LABEL_CONFIG_ITEMS,
  ...CHORD_CONFIG_ITEMS,
]

function buildChordLabelOption(config: ChordChartConfig): Record<string, unknown> {
  const showName = config.chartSetting?.showLabelName ?? false
  const showValue = config.label?.show ?? false
  const position = config.label?.position ?? 'outside'
  const format = config.label?.format

  // 都不显示 → 隐藏标签
  if (!showName && !showValue) {
    return { show: false }
  }

  // 构建 formatter
  const formatter = (params: { name?: string; value?: number; percent?: number }) => {
    const parts: string[] = []
    if (showName && params.name) {
      parts.push(params.name)
    }
    if (showValue && params.value != null) {
      parts.push(formatValue(Number(params.value), format))
    }
    return parts.join(' ')
  }

  return {
    show: true,
    position,
    distance: 5,
    color: position === 'inside' ? '#fff' : undefined,
    formatter,
    fontSize: config.fontSize ?? 12,
  }
}

// ============================================================
// Transformer
// ============================================================

function chordToEChartsOption(
  config: ChordChartConfig,
  data: DataTable,
  baseOption: EChartsOptionInYWL,
): EChartsOptionInYWL {
  const chordConfig = config
  const { sourceField, targetField, valueField } = chordConfig.dataMapping
  const { opacity, colorFrom, radius = 80, innerRadius = 70 } = chordConfig.chartSetting || {}

  // Clean Cartesian
  delete baseOption.xAxis
  delete baseOption.yAxis
  delete baseOption.grid

  // 半径
  const radiusConfig = innerRadius > 0
    ? [`${innerRadius}%`, `${radius}%`]
    : `${radius}%`

  // 1. Prepare Data
  const header = data[0] as string[]
  const sourceIdx = header.indexOf(sourceField)
  const targetIdx = header.indexOf(targetField)
  const valIdx = header.indexOf(valueField)

  if (sourceIdx === -1 || targetIdx === -1) return baseOption

  const nodesSet = new Set<string>()
  const links: { source: string; target: string; value: number }[] = []

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const s = String(row[sourceIdx])
    const t = String(row[targetIdx])
    const v = valIdx !== -1 ? (Number(row[valIdx]) || 1) : 1

    if (s) nodesSet.add(s)
    if (t) nodesSet.add(t)

    if (s && t) {
      links.push({ source: s, target: t, value: v })
    }
  }

  const nodes = Array.from(nodesSet).map(name => ({ name }))

  // 2. Build Series
  baseOption.series = [
    {
      type: 'chord',
      sort: 'descending',
      sortSub: 'descending',
      nodeGap: 20,
      radius: radiusConfig,
      lineStyle: {
        color: colorFrom ?? 'source',
        opacity: opacity ?? 0.3,
      },
      label: buildChordLabelOption(config),
      data: nodes,
      links: links,
    },
  ]

  // Legend
  if (baseOption.legend && !Array.isArray(baseOption.legend)) {
    baseOption.legend.data = nodes.map(n => n.name)
  }

  return baseOption
}

// ============================================================
// Demo Data
// ============================================================

const CHORD_DEMO_DATA = [
  ['source', 'target', 'value'],
  ['北京', '上海', 100],
  ['北京', '广州', 50],
  ['上海', '广州', 80],
  ['广州', '深圳', 120],
  ['深圳', '北京', 60],
  ['杭州', '上海', 150],
  ['杭州', '北京', 40],
  ['成都', '北京', 70],
  ['成都', '广州', 30],
  ['武汉', '上海', 90],
  ['武汉', '深圳', 45],
]

// ============================================================
// Chord Chart
// ============================================================

registerChart<ChordChartConfig>({
  type: ChartType.CHORD,
  name: '和弦图',
  enName: 'Chord Diagram',
  category: [ChartCategory.CHORD],
  purpose: [ChartPurpose.RELATIONSHIP, ChartPurpose.DISTRIBUTION],
  description: '和弦图用于展示多个节点之间的连接关系（流量、权重等），通过连线连接圆周上的节点。',
  coordinateSystem: CoordinateSystem.NONE,

  dataMappingMeta: CHORD_DATA_MAPPING_META,
  configMeta: CHORD_FULL_CONFIG_META,

  defaultConfig: {
    version: 'v2',
    type: 'chord',
    title: { text: '', show: false },
    size: { width: 640, height: 640 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: false },
    chartSetting: {
      colorFrom: 'source',
      opacity: 0.3,
      showLabelName: true,
      radius: 80,
      innerRadius: 70,
    },
  },

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_CHORD_1',
      chartName: '城市流动和弦图',
      chartConfig: {
        version: 'v2',
        type: 'chord',
        dataMapping: {
          sourceField: 'source',
          targetField: 'target',
          valueField: 'value',
        },
        title: { text: '城市流动和弦图', show: true },
        size: { width: 640, height: 640 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
        chartSetting: {
          colorFrom: 'source',
          opacity: 0.3,
          showLabelName: true,
          radius: 80,
          innerRadius: 70,
        },
      } as ChordChartConfig,
      chartFile: { content: CHORD_DEMO_DATA },
    },
  ],

  toEChartsOption: chordToEChartsOption,
})
