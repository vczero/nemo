/**
 * Tree Chart Registration
 */
import { registerChart } from '../core/registry'
import { ChartType, ChartCategory, ChartPurpose, CoordinateSystem } from '../types'
import type { TreeChartConfig, DataTable, EChartsOptionInYWL } from '../types'
import {
  BASE_CONFIG_ITEMS,
} from '../configItems'
import type { TConfigItem } from '../types/schema'
import { isColorString } from '@/utils/utils'

// ============================================================
// Data Mapping Meta
// ============================================================

const TREE_DATA_MAPPING_META = {
  fields: [
    { key: 'idField', label: '节点ID', required: true, fieldType: 'single' as const },
    { key: 'parentField', label: '父节点ID', required: true, fieldType: 'single' as const },
    { key: 'nameField', label: '节点名称', required: true, fieldType: 'single' as const },
    { key: 'valueField', label: '数值 (可选)', required: false, fieldType: 'single' as const },
  ],
}

// ============================================================
// Config Meta
// ============================================================

const TREE_CONFIG_ITEMS: TConfigItem[] = [
  {
    key: 'chartSetting.lineColor',
    label: '连线颜色',
    type: 'color',
    group: 'style',
    props: {
      defaultColor: '#cfd2d7',
    },
  },
  {
    key: 'chartSetting.layout',
    label: '布局方式',
    type: 'select',
    group: 'style',
    options: [
      { label: '正交布局', value: 'orthogonal' },
      { label: '径向布局', value: 'radial' },
    ],
  },
  {
    key: 'chartSetting.orient',
    label: '方向',
    type: 'select',
    group: 'style',
    options: [
      { label: '左到右 (LR)', value: 'LR' },
      { label: '右到左 (RL)', value: 'RL' },
      { label: '上到下 (TB)', value: 'TB' },
      { label: '下到上 (BT)', value: 'BT' },
    ],
    // Only show when layout is orthogonal
    // We don't have dynamic hiding yet in TConfigItem, but it's fine.
  },
  {
    key: 'chartSetting.symbolSize',
    label: '节点大小',
    type: 'slider',
    group: 'style',
    range: [5, 30],
  },
  {
    key: 'chartSetting.initialTreeDepth',
    label: '展开层级',
    type: 'number',
    group: 'display_element',
    props: { min: -1, placeholder: '-1 为全部展开' }
  },
]

const TREE_FULL_CONFIG_META = [
  ...BASE_CONFIG_ITEMS,
  ...TREE_CONFIG_ITEMS,
]

// ============================================================
// Utils: Build Tree
// ============================================================

interface TreeNode {
  name: string
  value?: number
  children?: TreeNode[]
  // internal use
  id?: string
}

function buildTreeFromTable(
  data: DataTable,
  idIdx: number,
  parentIdx: number,
  nameIdx: number,
  valIdx: number
): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>()
  const nodes: TreeNode[] = []
  const rootNodes: TreeNode[] = []

  // 1. Create all nodes
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const id = String(row[idIdx])
    const name = String(row[nameIdx])
    const val = valIdx !== -1 ? Number(row[valIdx]) : undefined

    const node: TreeNode = { name, id, value: isNaN(val as number) ? undefined : val }
    nodeMap.set(id, node)
    nodes.push(node)
  }

  // 2. Link parent-child
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const id = String(row[idIdx])
    const parentId = String(row[parentIdx])
    const node = nodeMap.get(id)

    if (node) {
      if (parentId && nodeMap.has(parentId)) {
        const parent = nodeMap.get(parentId)!
        if (!parent.children) parent.children = []
        parent.children.push(node)
      } else {
        // No parent found -> treat as root
        rootNodes.push(node)
      }
    }
  }

  return rootNodes
}

// ============================================================
// Transformer
// ============================================================

function treeToEChartsOption(
  config: TreeChartConfig,
  data: DataTable,
  baseOption: EChartsOptionInYWL,
): EChartsOptionInYWL {
  const treeConfig = config
  const { idField, parentField, nameField, valueField } = treeConfig.dataMapping
  const { layout, orient, symbolSize, initialTreeDepth, lineColor = '#cfd2d7' } = treeConfig.chartSetting || {}

  // Clean Cartesian
  delete baseOption.xAxis
  delete baseOption.yAxis
  delete baseOption.grid

  // 1. Prepare Data
  const header = data[0] as string[]
  const idIdx = header.indexOf(idField)
  const pIdx = header.indexOf(parentField)
  const nameIdx = header.indexOf(nameField)
  const vIdx = valueField ? header.indexOf(valueField) : -1

  if (idIdx === -1 || pIdx === -1 || nameIdx === -1) return baseOption

  const rootNodes = buildTreeFromTable(data, idIdx, pIdx, nameIdx, vIdx)

  if (rootNodes.length === 0) return baseOption

  // 2. Build Series
  baseOption.series = [
    {
      type: 'tree',
      data: rootNodes,
      layout: layout || 'orthogonal',
      orient: orient || 'LR',
      symbol: 'emptyCircle',
      symbolSize: symbolSize || 7,
      initialTreeDepth: initialTreeDepth ?? -1,
      lineStyle: {
        color: lineColor,
      },
      itemStyle: {
        color: isColorString(config.theme) ? config.theme : undefined,
      },
      label: {
        position: 'left',
        verticalAlign: 'middle',
        align: 'right',
        fontSize: config.fontSize ?? 12
      },

      leaves: {
        label: {
          position: 'right',
          verticalAlign: 'middle',
          align: 'left'
        }
      },
      expandAndCollapse: true,
      animationDuration: 550,
      animationDurationUpdate: 750
    },
  ] as any

  return baseOption
}

// ============================================================
// Demo Data
// ============================================================

const TREE_DEMO_DATA = [
  ['id', 'parentId', 'name', 'value'],
  ['1', '', 'CEO', 100],
  ['2', '1', 'VP Product', 80],
  ['3', '1', 'VP Sales', 80],
  ['4', '1', 'VP Engineering', 80],
  ['5', '2', 'Product Manager A', 40],
  ['6', '2', 'Product Manager B', 40],
  ['7', '3', 'Sales Lead A', 50],
  ['8', '3', 'Sales Lead B', 50],
  ['9', '4', 'Backend Lead', 60],
  ['10', '4', 'Frontend Lead', 60],
  ['11', '9', 'Dev A', 30],
  ['12', '9', 'Dev B', 30],
  ['13', '10', 'Dev C', 30],
]

// ============================================================
// Tree Chart Registration
// ============================================================

registerChart<TreeChartConfig>({
  type: ChartType.TREE,
  name: '树图',
  enName: 'Tree Chart',
  category: [ChartCategory.HIERARCHY],
  purpose: [ChartPurpose.HIERARCHY, ChartPurpose.RELATIONSHIP],
  description: '树图用于展示层级关系，支持正交和径向布局。',
  coordinateSystem: CoordinateSystem.NONE,

  dataMappingMeta: TREE_DATA_MAPPING_META,
  configMeta: TREE_FULL_CONFIG_META,

  defaultConfig: {
    version: 'v2',
    type: 'tree',
    title: { text: '', show: false },
    size: { width: 800, height: 600 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: false },
    chartSetting: {
      layout: 'orthogonal',
      orient: 'LR',
      symbolSize: 10,
      initialTreeDepth: -1,
    },
  },

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_TREE_1',
      chartName: '公司组织架构',
      chartConfig: {
        version: 'v2',
        type: 'tree',
        dataMapping: {
          idField: 'id',
          parentField: 'parentId',
          nameField: 'name',
          valueField: 'value',
        },
        title: { text: '公司组织架构', show: true },
        size: { width: 800, height: 600 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
        chartSetting: {
          layout: 'orthogonal',
          orient: 'LR', // Left to Right
          symbolSize: 10,
          initialTreeDepth: -1,
        },
      } as TreeChartConfig,
      chartFile: { content: TREE_DEMO_DATA },
    },
    {
      chartId: 'NAUTILAB_DEMO_TREE_2',
      chartName: '公司组织架构 (上下)',
      chartConfig: {
        version: 'v2',
        type: 'tree',
        dataMapping: {
          idField: 'id',
          parentField: 'parentId',
          nameField: 'name',
          valueField: 'value',
        },
        title: { text: '公司组织架构 (TB)', show: true },
        size: { width: 800, height: 600 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
        chartSetting: {
          layout: 'orthogonal',
          orient: 'TB', // Top to Bottom
          symbolSize: 10,
          initialTreeDepth: -1,
        },
      } as TreeChartConfig,
      chartFile: { content: TREE_DEMO_DATA },
    },
  ],

  toEChartsOption: treeToEChartsOption,
})
