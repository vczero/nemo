/**
 * Sankey Chart Registration
 */
import { registerChart } from '../core/registry'
import { ChartType, ChartCategory, ChartPurpose, CoordinateSystem } from '../types'
import type { SankeyChartConfig, DataTable, EChartsOptionInYWL } from '../types'
import {
  BASE_CONFIG_ITEMS,
  LABEL_CONFIG_ITEMS,
  // LEGEND_CONFIG_ITEMS,
} from '../configItems'
import type { TConfigItem } from '../types/schema'
import { formatValue } from '../utils'

// ============================================================
// Data Mapping Meta
// ============================================================

const SANKEY_DATA_MAPPING_META = {
  fields: [
    { key: 'sourceField', label: '来源节点', required: true, fieldType: 'single' as const },
    { key: 'targetField', label: '目标节点', required: true, fieldType: 'single' as const },
    { key: 'valueField', label: '流转值', required: true, fieldType: 'single' as const },
  ],
}

// ============================================================
// Config Meta
// ============================================================

const SANKEY_CONFIG_ITEMS: TConfigItem[] = [
  {
    key: 'chartSetting.nodeWidth',
    label: '节点宽度',
    type: 'slider',
    group: 'style',
    range: [5, 100],
  },
]

const SANKEY_FULL_CONFIG_META: TConfigItem[] = [
  {
    key: 'chartSetting.showLabelName',
    label: '名称标签',
    type: 'switch',
    group: 'other',
  },
  ...BASE_CONFIG_ITEMS,
  // ...LEGEND_CONFIG_ITEMS,
  ...LABEL_CONFIG_ITEMS,
  ...SANKEY_CONFIG_ITEMS,
]

// ============================================================
// Transformer
// ============================================================

function sankeyToEChartsOption(
  config: SankeyChartConfig,
  data: DataTable,
  baseOption: EChartsOptionInYWL,
): EChartsOptionInYWL {
  const sankeyConfig = config
  const { sourceField, targetField, valueField } = sankeyConfig.dataMapping
  const { nodeWidth, showLabelName } = sankeyConfig.chartSetting || {}

  // Clean Cartesian
  delete baseOption.xAxis
  delete baseOption.yAxis
  delete baseOption.grid

  // 1. Prepare Data
  const header = data[0] as string[]
  const sourceIdx = header.indexOf(sourceField)
  const targetIdx = header.indexOf(targetField)
  const valIdx = header.indexOf(valueField)

  if (sourceIdx === -1 || targetIdx === -1 || valIdx === -1) return baseOption

  const nodesSet = new Set<string>()
  const links: { source: string; target: string; value: number }[] = []

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const s = String(row[sourceIdx])
    const t = String(row[targetIdx])
    const v = Number(row[valIdx]) || 0

    if (s && t && v > 0) {
        nodesSet.add(s)
        nodesSet.add(t)
        links.push({ source: s, target: t, value: v })
    }
  }

  const nodes = Array.from(nodesSet).map(name => ({ name }))

  // 2. Build Series
  baseOption.series = [
    {
      type: 'sankey',
      data: nodes,
      links: links,
      nodeAlign: 'justify',
      orient: 'horizontal',
      nodeWidth: nodeWidth ?? 20,
      draggable: true,
      roam: true,
      label: {
        show: (config.label?.show || showLabelName) ?? true,
        position: 'right',
        fontSize: config.fontSize ?? 12,
        formatter: (params: any) => {
          let labelStr = ''
          if (showLabelName) {
            labelStr += params.name + '\n'
          }
          if (config.label?.show) {
            labelStr += formatValue(Number(params.value) || '', config.label?.format)
          }

          return labelStr
        }
      },
      lineStyle: {
        color: 'source',
        curveness: 0.3,
      },
    },
  ]

  return baseOption
}

// ============================================================
// Demo Data
// ============================================================

const SANKEY_DEMO_DATA = [
  ['source', 'target', 'value'],
  ['Homepage', 'Product Page', 5000],
  ['Homepage', 'Search', 2000],
  ['Homepage', 'Blog', 1000],
  ['Product Page', 'Cart', 3000],
  ['Product Page', 'Wishlist', 1000],
  ['Search', 'Product Page', 1500],
  ['Blog', 'Product Page', 500],
  ['Cart', 'Checkout', 2500],
  ['Wishlist', 'Cart', 500],
  ['Checkout', 'Purchase', 2000],
]

// ============================================================
// Sankey Chart Registration
// ============================================================

registerChart<SankeyChartConfig>({
  type: ChartType.SANKEY,
  name: '桑基图',
  enName: 'Sankey Diagram',
  category: [ChartCategory.SANKEY],
  purpose: [ChartPurpose.RELATIONSHIP, ChartPurpose.PROPORTION],
  description: '桑基图用于展示数据的流向和流量分布，通过连线的粗细展示权重。',
  coordinateSystem: CoordinateSystem.NONE,

  dataMappingMeta: SANKEY_DATA_MAPPING_META,
  configMeta: SANKEY_FULL_CONFIG_META,

  defaultConfig: {
    version: 'v2',
    type: 'sankey',
    title: { text: '', show: false },
    size: { width: 800, height: 500 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: false },
    chartSetting: {
      nodeWidth: 20,
      showLabelName: true
    },
  },

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_SANKEY_1',
      chartName: '电商用户路径',
      chartConfig: {
        version: 'v2',
        type: 'sankey',
        dataMapping: {
          sourceField: 'source',
          targetField: 'target',
          valueField: 'value',
        },
        title: { text: '电商用户路径流转', show: true },
        size: { width: 800, height: 500 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
        chartSetting: {
          nodeWidth: 20,
          showLabelName: true
        },
      } as SankeyChartConfig,
      chartFile: { content: SANKEY_DEMO_DATA },
    },
  ],

  toEChartsOption: sankeyToEChartsOption,
})
