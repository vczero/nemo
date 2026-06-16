/**
 * Treemap Chart Registration
 */
import { registerChart } from '../core/registry'
import {
  ChartType,
  ChartCategory,
  ChartPurpose,
  CoordinateSystem,
} from '../types'
import type { TreemapChartConfig, DataTable, EChartsOptionInYWL } from '../types'
import { BASE_CONFIG_ITEMS, LABEL_CONFIG_ITEMS } from '../configItems'
import type { TConfigItem } from '../types/schema'
import { formatValue } from '../utils/format'

// ============================================================
// Data Mapping Meta
// ============================================================

const TREEMAP_DATA_MAPPING_META = {
  fields: [
    {
      key: 'idField',
      label: '节点ID',
      required: true,
      fieldType: 'single' as const,
    },
    {
      key: 'parentField',
      label: '父节点ID',
      required: true,
      fieldType: 'single' as const,
    },
    {
      key: 'nameField',
      label: '节点名称',
      required: true,
      fieldType: 'single' as const,
    },
    {
      key: 'valueField',
      label: '数值',
      required: true,
      fieldType: 'single' as const,
    },
  ],
}

// ============================================================
// Config Meta
// ============================================================

const TREEMAP_CONFIG_ITEMS: TConfigItem[] = [
  {
    key: 'chartSetting.labelColor',
    label: '文字颜色',
    type: 'color',
    group: 'style',
    props: {
      defaultColor: '#fff',
    },
  },
]

const TREEMAP_FULL_CONFIG_META = [
  ...BASE_CONFIG_ITEMS,
  ...LABEL_CONFIG_ITEMS,
  ...TREEMAP_CONFIG_ITEMS,
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
  const rootNodes: TreeNode[] = []

  // 1. Create all nodes
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const id = String(row[idIdx])
    const name = String(row[nameIdx])
    const val = valIdx !== -1 ? Number(row[valIdx]) : undefined

    const node: TreeNode = {
      name,
      id,
      value: isNaN(val as number) ? undefined : val,
    }
    nodeMap.set(id, node)
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

function treemapToEChartsOption(
  config: TreemapChartConfig,
  data: DataTable,
  baseOption: EChartsOptionInYWL
): EChartsOptionInYWL {
  const treemapConfig = config
  const { idField, parentField, nameField, valueField } =
    treemapConfig.dataMapping
  const { labelColor = '#fff' } = treemapConfig.chartSetting ?? {}
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
      type: 'treemap',
      data: rootNodes,
      roam: true,
      nodeClick: false,
      label: {
        show: true,
        color: labelColor,
        formatter:  (params: any) => {
          const data = params.data || {}
          const valueStr = formatValue(data.value, config.label?.format)
          return config.label?.show ? `${data.name} ${valueStr}` : data.name
        } ,
      },
      itemStyle: {
        borderColor: '#fff',
      },
      levels: [
        {
          itemStyle: {
            borderWidth: 0,
            gapWidth: 5,
          },
        },
        {
          itemStyle: {
            gapWidth: 1,
          },
        },
        {
          colorSaturation: [0.35, 0.5],
          itemStyle: {
            gapWidth: 1,
            borderColorSaturation: 0.6,
          },
        },
      ],
    },
  ] as any

  return baseOption
}

// ============================================================
// Demo Data
// ============================================================

const TREEMAP_DEMO_DATA = [
  ['id', 'parentId', 'name', 'value'],
  ['2', , 'Asia', 100],
  ['3', , 'Europe', 80],
  ['4', , 'America', 60],
  ['5', '2', 'China', 50],
  ['51', '5', 'Beijing', 25],
  ['52', '5', 'Shanghai', 25],
  ['521', '52', 'Changning District', 10],
  ['522', '52', 'Xuhui District', 15],
  ['5221', '521', 'Xianxia Street', 5],
  ['5222', '521', 'Weining Street', 5],
  ['6', '2', 'Japan', 30],
  ['7', '2', 'India', 20],
  ['8', '3', 'Germany', 40],
  ['9', '3', 'France', 20],
  ['10', '3', 'UK', 20],
  ['11', '4', 'USA', 40],
  ['12', '4', 'Canada', 10],
  ['13', '4', 'Brazil', 10],
]

// ============================================================
// Treemap Chart Registration
// ============================================================

registerChart<TreemapChartConfig>({
  type: ChartType.TREEMAP,
  name: '矩形树图',
  enName: 'Treemap',
  category: [ChartCategory.HIERARCHY],
  purpose: [
    ChartPurpose.HIERARCHY,
    ChartPurpose.PROPORTION,
    ChartPurpose.DISTRIBUTION,
  ],
  description: '矩形树图用于展示层级数据的占比，通过矩形面积大小表示数值。',
  coordinateSystem: CoordinateSystem.NONE,

  dataMappingMeta: TREEMAP_DATA_MAPPING_META,
  configMeta: TREEMAP_FULL_CONFIG_META,

  defaultConfig: {
    version: 'v2',
    type: 'treemap',
    title: { text: '', show: false },
    size: { width: 1000, height: 600 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: false },
    chartSetting: {},
  },

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_TREEMAP_1',
      chartName: '区域数据分布',
      chartConfig: {
        version: 'v2',
        type: 'treemap',
        dataMapping: {
          idField: 'id',
          parentField: 'parentId',
          nameField: 'name',
          valueField: 'value',
        },
        // title: { text: '区域数据分布', show: true },
        size: { width: 1000, height: 600 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
        chartSetting: {},
      },
      chartFile: { content: TREEMAP_DEMO_DATA },
    },
  ],

  toEChartsOption: treemapToEChartsOption,
})
