/**
 * Graph Chart Registration
 *
 * 注册 relationship_graph (关系图), force_graph (力引导图), flow_graph (流程图/路径图).
 */
import { registerChart } from '../core/registry'
import {
  ChartType,
  ChartCategory,
  ChartPurpose,
  CoordinateSystem,
} from '../types'
import type { GraphChartConfig, DataTable, EChartsOptionInYWL } from '../types'
import { BASE_CONFIG_ITEMS, LEGEND_CONFIG_ITEMS } from '../configItems'
import type { TConfigItem } from '../types/schema'
import { isColorString } from '@/utils/utils'

// ============================================================
// Data Mapping Meta
// ============================================================

const GRAPH_DATA_MAPPING_META = {
  fields: [
    {
      key: 'sourceField',
      label: '源节点',
      required: true,
      fieldType: 'single' as const,
    },
    {
      key: 'targetField',
      label: '目标节点',
      required: true,
      fieldType: 'single' as const,
    },
    {
      key: 'valueField',
      label: '权重/数值',
      required: false,
      fieldType: 'single' as const,
    },
    {
      key: 'categoryField',
      label: '节点分类',
      required: false,
      fieldType: 'single' as const,
    },
  ],
}

// ============================================================
// Config Meta
// ============================================================

const GRAPH_CONFIG_ITEMS: TConfigItem[] = [
  {
    key: 'chartSetting.force.repulsion',
    label: '斥力因子',
    type: 'slider',
    group: 'basic',
    range: [50, 2000],
    props: { step: 50 },
  },
  {
    key: 'chartSetting.force.edgeLength',
    label: '边长度',
    type: 'slider',
    group: 'basic',
    range: [10, 500],
    props: { step: 10 },
  },
  {
    key: 'chartSetting.nodeSizeRange',
    label: '节点大小范围',
    type: 'slider',
    group: 'style',
    range: [5, 100],
    props: { step: 5, range: true },
  },
  {
    key: 'chartSetting.nodeSizeByWeight',
    label: '大小随权重',
    type: 'switch',
    group: 'style',
  },
  {
    key: 'chartSetting.showArrow',
    label: '显示箭头',
    type: 'switch',
    group: 'style',
  },
  {
    key: 'chartSetting.edgeWidthByWeight',
    label: '线宽随权重',
    type: 'switch',
    group: 'style',
  },
  {
    key: 'chartSetting.colorFrom',
    label: '连线颜色',
    type: 'colorFrom',
    group: 'style',
  },
  {
    key: 'chartSetting.hideOverlap',
    label: '隐藏重叠标签',
    type: 'switch',
    group: 'display_element',
  },
]

const GRAPH_FULL_CONFIG_META = [
  ...BASE_CONFIG_ITEMS,
  ...LEGEND_CONFIG_ITEMS,
  ...GRAPH_CONFIG_ITEMS,
]

// ============================================================
// Transformer
// ============================================================

function graphToEChartsOption(
  config: GraphChartConfig,
  data: DataTable,
  baseOption: EChartsOptionInYWL
): EChartsOptionInYWL {
  const { type } = config
  const { sourceField, targetField, valueField, categoryField } =
    config.dataMapping
  const {
    force,
    showArrow,
    colorFrom,
    edgeWidthByWeight,
    nodeSizeByWeight,
    nodeSizeRange = [5, 30],
    hideOverlap,
    lineCurveness,
  } = config.chartSetting || {}

  // Clean Cartesian
  delete baseOption.xAxis
  delete baseOption.yAxis
  delete baseOption.grid

  // graph 如果节点没有提供固定的 x，y 坐标， 则需要通过 force 布局动态计算节点坐标，
  // 所以这里对于普通的 graph 都用了 force
  const layout = type === 'force_graph' ? 'force' : type === 'flow_graph' ? 'circular' : 'force'

  // 1. Prepare Data
  const header = data[0] as string[]
  const sourceIdx = header.indexOf(sourceField)
  const targetIdx = header.indexOf(targetField)
  const valIdx = valueField ? header.indexOf(valueField) : -1
  const catIdx = categoryField ? header.indexOf(categoryField) : -1

  if (sourceIdx === -1 || targetIdx === -1) return baseOption

  const nodesMap = new Map<
    string,
    { id: string; name: string; value: number; category?: string }
  >()
  const links: { source: string; target: string; value: number }[] = []
  const categoriesSet = new Set<string>()

  let minVal = Infinity
  let maxVal = -Infinity

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const s = String(row[sourceIdx])
    const t = String(row[targetIdx])
    const v = valIdx !== -1 ? Number(row[valIdx]) || 1 : 1
    const cat = catIdx !== -1 ? String(row[catIdx]) : undefined

    if (!s || !t) continue

    // Node accumulation (simple degree/weight sum)
    if (!nodesMap.has(s))
      nodesMap.set(s, { id: s, name: s, value: 0, category: cat,  })
    if (!nodesMap.has(t))
      nodesMap.set(t, { id: t, name: t, value: 0, category: cat, }) // Category from target might overwrite?

    nodesMap.get(s)!.value += v
    nodesMap.get(t)!.value += v // Undirected weight sum logic for node size? Or in-degree + out-degree

    links.push({ source: s, target: t, value: v })

    if (cat) categoriesSet.add(cat)

    if (v < minVal) minVal = v
    if (v > maxVal) maxVal = v
  }

  // Calculate Node Size Range if needed
  let minNodeVal = Infinity
  let maxNodeVal = -Infinity
  if (nodeSizeByWeight) {
    for (const node of nodesMap.values()) {
      if (node.value < minNodeVal) minNodeVal = node.value
      if (node.value > maxNodeVal) maxNodeVal = node.value
    }
  }

  const nodes = Array.from(nodesMap.values()).map((n) => {
    let size = nodeSizeRange[1]
    if (nodeSizeByWeight && maxNodeVal > minNodeVal) {
      // Linear map
      const ratio = (n.value - minNodeVal) / (maxNodeVal - minNodeVal)
      size = nodeSizeRange[0] + ratio * (nodeSizeRange[1] - nodeSizeRange[0])
    }

    return {
      id: n.id,
      name: n.name,
      value: n.value,
      symbolSize: size,
      category: n.category ?? (categoriesSet.size > 0 ? 'default' : undefined),
      draggable: true,
    }
  })

  // Edge Width Scale
  const getLineWidth = (val: number) => {
    if (!edgeWidthByWeight || maxVal === minVal) return 1
    // Map value to 1-5px
    return 1 + ((val - minVal) / (maxVal - minVal)) * 4
  }

  const formattedLinks = links.map((l) => ({
    ...l,
    lineStyle: {
      width: getLineWidth(l.value),
    },
  }))

  const categories = Array.from(categoriesSet).map((c) => ({ name: c }))
  let curveness = 0

  if (!isNaN(Number(lineCurveness))) {
    curveness = lineCurveness!
  }

  const forceConfig = layout === 'force' ? {
    layoutAnimation: true,
    repulsion: force?.repulsion ?? 100,
    edgeLength: force?.edgeLength ?? 50,
    gravity: force?.gravity ?? 0.1,
  } : undefined

  const itemColor = isColorString(config?.theme) ? config.theme : undefined;

  baseOption.series = [
    {
      type: 'graph',
      layout: layout,
      data: nodes,
      links: formattedLinks,
      categories: categories.length ? categories : undefined,
      roam: true,
      legendHoverLink: false,
      symbol: 'circle',
      label: {
        show: config.label?.show ?? true,
        position: 'right',
        formatter: '{b}',
        fontSize: config.fontSize ?? 12,
        color: '#666',
      },
      labelLayout: {
        hideOverlap: !!hideOverlap,
      },
      lineStyle: {
        color:colorFrom || '#999',
        curveness: curveness,
      },
      edgeSymbol: showArrow ? ['none', 'arrow'] : ['none', 'none'],
      edgeSymbolSize: showArrow ? 10 : 0,
      ...(forceConfig ? { force: forceConfig } : {}),
      ...(itemColor ? { itemStyle: { color: itemColor } } : {}),
    },
  ]

  // Legend
  if (baseOption.legend && !Array.isArray(baseOption.legend)) {
    if (categories.length > 0) {
      baseOption.legend.data = categories.map((c) => c.name)
    } else {
      baseOption.legend.show = false
    }
  }
  return baseOption
}

// ============================================================
// Demo Data
// ============================================================

const GRAPH_DEMO_DATA = [
  ['source', 'target', 'value'],
  ['NodeA', 'NodeB', 10],
  ['NodeA', 'NodeC', 5],
  ['NodeB', 'NodeD', 15],
  ['NodeC', 'NodeD', 8],
  ['NodeC', 'NodeE', 12],
  ['NodeD', 'NodeE', 6],
  ['NodeE', 'NodeF', 4],
  ['NodeF', 'NodeA', 3],
]

const FORCE_GRAPH_DEMO_DATA = [
  ['source', 'target', 'value', 'category'],
  ['Myriel', 'Napoleon', 1, 'Group1'],
  ['Myriel', 'Mlle.Baptistine', 1, 'Group1'],
  ['Myriel', 'Mme.Magloire', 1, 'Group1'],
  ['CountessdeLo', 'Myriel', 1, 'Group1'],
  ['Geborand', 'Myriel', 1, 'Group1'],
  ['Champtercier', 'Myriel', 1, 'Group1'],
  ['Cravatte', 'Myriel', 1, 'Group1'],
  ['Count', 'Myriel', 1, 'Group1'],
  ['OldMan', 'Myriel', 1, 'Group1'],
  ['Valjean', 'Labarre', 1, 'Group2'],
  ['Valjean', 'Mme.Magloire', 1, 'Group2'],
  ['Valjean', 'Mlle.Baptistine', 1, 'Group2'],
  ['Valjean', 'Myriel', 1, 'Group2'],
  ['Marguerite', 'Valjean', 1, 'Group2'],
  ['Mme.deR', 'Valjean', 1, 'Group2'],
  ['Isabeau', 'Valjean', 1, 'Group2'],
  ['Gervais', 'Valjean', 1, 'Group2'],
  ['Tholomyes', 'Fantine', 1, 'Group3'],
  ['Tholomyes', 'Mme.Thenardier', 1, 'Group3'],
  // ... Simplified Les Mis data
]

// ============================================================
// 1. Force Graph (力引导布局)
// ============================================================

registerChart<GraphChartConfig>({
  type: ChartType.FORCE_GRAPH,
  name: '力引导图',
  enName: 'Force Directed Graph',
  category: [ChartCategory.GRAPH],
  purpose: [ChartPurpose.RELATIONSHIP, ChartPurpose.NETWORK],
  description:
    '力引导图通过模拟物理斥力和引力来自动布局节点，适合展示复杂的网络关系聚类。',
  coordinateSystem: CoordinateSystem.NONE,

  dataMappingMeta: GRAPH_DATA_MAPPING_META,
  configMeta: GRAPH_FULL_CONFIG_META,

  defaultConfig: {
    version: 'v2',
    type: 'force_graph',
    title: { text: '', show: false },
    size: { width: 640, height: 640 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'bottom' },
    chartSetting: {
      force: { repulsion: 200, edgeLength: 50 },
      nodeSizeRange: [5, 30],
      showArrow: false,
      lineCurveness: 0,
      colorFrom: 'source',
      hideOverlap: true,
    },
  },

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_FORCE_GRAPH_1',
      chartName: '人物关系',
      chartConfig: {
        version: 'v2',
        type: 'force_graph',
        dataMapping: {
          sourceField: 'source',
          targetField: 'target',
          valueField: 'value',
          categoryField: 'category',
        },
        title: { text: '悲惨世界人物关系 (简化)', show: true },
        size: { width: 640, height: 640 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true },
        chartSetting: {
          force: { repulsion: 150, edgeLength: 80 },
          nodeSizeRange: [5, 10],
          nodeSizeByWeight: false,
          showArrow: false,
          lineCurveness: 0,
          colorFrom: 'source',
          hideOverlap: true,
        },
      },
      chartFile: { content: FORCE_GRAPH_DEMO_DATA },
    },
  ],

  toEChartsOption: graphToEChartsOption,
})

registerChart<GraphChartConfig>({
  type: ChartType.FLOW_GRAPH,
  name: '关系流向图',
  enName: 'Flow Graph',
  category: [ChartCategory.GRAPH],
  purpose: [ChartPurpose.RELATIONSHIP, ChartPurpose.DISTRIBUTION],
  description: '关系流向图通过连线的粗细和箭头方向展示节点间的流量大小和流向。',
  coordinateSystem: CoordinateSystem.NONE,

  dataMappingMeta: GRAPH_DATA_MAPPING_META,
  configMeta: GRAPH_FULL_CONFIG_META,

  defaultConfig: {
    version: 'v2',
    type: 'flow_graph',
    title: { text: '', show: false },
    size: { width: 640, height: 640 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: false },
    chartSetting: {
      nodeSizeRange: [5, 30],
      nodeSizeByWeight: false,
      showArrow: true,
      edgeWidthByWeight: true,
      colorFrom: 'source',
      hideOverlap: true,
      lineCurveness: 0.3,
    },
  },

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_FLOW_GRAPH_1',
      chartName: '节点流量',
      chartConfig: {
        version: 'v2',
        type: 'flow_graph',
        dataMapping: {
          sourceField: 'source',
          targetField: 'target',
          valueField: 'value',
        },
        title: { text: '节点流量分布', show: true },
        size: { width: 640, height: 640 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
        chartSetting: {
          nodeSizeRange: [5, 30],
          nodeSizeByWeight: false,
          showArrow: true,
          edgeWidthByWeight: true,
          colorFrom: 'source',
          hideOverlap: true,
          lineCurveness: 0.3,
        },
      },
      chartFile: { content: GRAPH_DEMO_DATA },
    },
  ],

  toEChartsOption: graphToEChartsOption,
})

// ============================================================
// 3. Relationship Graph (标准关系图 - 节点大小)
// ============================================================

registerChart<GraphChartConfig>({
  type: ChartType.RELATIONSHIP_GRAPH,
  name: '权重关系图',
  enName: 'Weighted Relationship Graph',
  category: [ChartCategory.GRAPH],
  purpose: [ChartPurpose.RELATIONSHIP, ChartPurpose.NETWORK, ChartPurpose.RANKING],
  description:
    '权重关系图通过节点的大小展示其在网络中的重要性（权重/连接数）。',
  coordinateSystem: CoordinateSystem.NONE,

  dataMappingMeta: GRAPH_DATA_MAPPING_META,
  configMeta: GRAPH_FULL_CONFIG_META,

  defaultConfig: {
    version: 'v2',
    type: 'relationship_graph',
    title: { text: '', show: false },
    size: { width: 640, height: 640 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'bottom' },
    chartSetting: {
      force: { repulsion: 300, edgeLength: 100 },
      nodeSizeByWeight: true,
      nodeSizeRange: [10, 40],
      showArrow: false,
      colorFrom: 'source',
      hideOverlap: true,
      lineCurveness: 0.3,
    },
  },

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_RELATIONSHIP_GRAPH_1',
      chartName: '悲惨世界人物关系 (简化)',
      chartConfig: {
        version: 'v2',
        type: 'relationship_graph',
        dataMapping: {
          sourceField: 'source',
          targetField: 'target',
          valueField: 'value',
          categoryField: 'category',
        },
        title: { text: '悲惨世界人物关系 (简化)', show: true },
        size: { width: 640, height: 640 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'bottom' },
        chartSetting: {
          force: { repulsion: 200, edgeLength: 60 },
          nodeSizeByWeight: true,
          nodeSizeRange: [10, 40],
          showArrow: false,
          colorFrom: 'source',
          hideOverlap: true,
          lineCurveness: 0.3,
        },
      },
      chartFile: { content: FORCE_GRAPH_DEMO_DATA },
    },
  ],

  toEChartsOption: graphToEChartsOption,
})
