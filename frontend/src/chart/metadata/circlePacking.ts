import type { EChartsOption } from 'echarts'
import * as echarts from 'echarts'
import { registerChart } from '../core/registry'
import {
  ChartType,
  ChartCategory,
  ChartPurpose,
  CoordinateSystem,
} from '../types'
import type { DataTable, EChartsOptionInYWL } from '../types'
import { BASE_CONFIG_ITEMS } from '../configItems'
import type { TConfigItem } from '../types/schema'
import circlePacking from '../vendors/circlePacking'
import type { CirclePackingChartConfig } from '../types/config'

// 注册自定义系列
echarts.use(circlePacking as any)

// ============================================================
// Data Mapping Meta
// ============================================================

const CIRCLE_PACKING_DATA_MAPPING_META = {
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
      required: false,
      fieldType: 'single' as const,
    },
  ],
}

// ============================================================
// Config Meta
// ============================================================

const CIRCLE_PACKING_CONFIG_ITEMS: TConfigItem[] = [{
  key: 'chartSetting.labelColor',
  label: '文字颜色',
  type: 'color',
  group: 'style',
  props: {
    defaultColor: '#fff'
  },
}]

const CIRCLE_PACKING_FULL_CONFIG_META = [
  ...BASE_CONFIG_ITEMS,
  ...CIRCLE_PACKING_CONFIG_ITEMS,
]

// ============================================================
// Transformer
// ============================================================

function circlePackingToEChartsOption(
  config: CirclePackingChartConfig,
  data: DataTable,
  baseOption: EChartsOptionInYWL
): EChartsOptionInYWL {
  const { idField, parentField, nameField, valueField } = config.dataMapping
  const { labelColor } = config.chartSetting ?? {}

  // Clean Cartesian
  delete baseOption.xAxis
  delete baseOption.yAxis

  baseOption.grid = {
    show: false,
    top: baseOption.title?.show ? 35 : 0,
    bottom: 0,
  }

  // 1. Prepare Data
  const header = data[0] as string[]
  const idIdx = header.indexOf(idField)
  const pIdx = header.indexOf(parentField)
  const nameIdx = header.indexOf(nameField)
  const vIdx = valueField ? header.indexOf(valueField) : -1

  if (idIdx === -1 || pIdx === -1 || nameIdx === -1) return baseOption

  // 构建原始数据对象列表
  const rawData: any[] = []

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const id = String(row[idIdx])
    const parentId = String(row[pIdx])
    const name = String(row[nameIdx])
    const val = vIdx !== -1 ? Number(row[vIdx]) || 0 : 0

    rawData.push([
      id,
      !parentId || parentId === '' ? undefined : parentId,
      val,
      name,
    ])
  }

  if (rawData.length === 0) return baseOption

  // 3. Build Series
  baseOption.series = [
    {
      type: 'custom',
      renderItem: 'circle_packing',
      name: 'circle_packing',
      data: rawData,
      coordinateSystem: 'none',
      encode: {
        itemName: 3,
      },
      itemPayload: {
        grid: baseOption.grid,
        fontSize: config.fontSize ?? 12,
        labelColor: labelColor,
      },
    },
  ]
  baseOption.hoverLayerThreshold = Infinity

  return baseOption
}

// ============================================================
// Demo Data
// ============================================================

const CIRCLE_PACKING_DEMO_DATA = [
  ['id', 'parentId', 'Region/Country', 'GDP (Billion USD)'],
  ['world', '', 'World GDP', 0],

  // Asia
  ['asia', 'world', 'Asia', 0],
  ['eas', 'asia', 'Eastern Asia', 0],
  ['cn', 'eas', 'China', 17730],
  ['jp', 'eas', 'Japan', 4940],
  ['kr', 'eas', 'South Korea', 1810],
  ['sas', 'asia', 'Southern Asia', 0],
  ['in', 'sas', 'India', 3170],
  ['seas', 'asia', 'South-eastern Asia', 0],
  ['id', 'seas', 'Indonesia', 1180],
  ['th', 'seas', 'Thailand', 506],
  ['was', 'asia', 'Western Asia', 0],
  ['sa', 'was', 'Saudi Arabia', 833],
  ['tr', 'was', 'Turkey', 815],

  // Americas
  ['americas', 'world', 'Americas', 0],
  ['nam', 'americas', 'North America', 0],
  ['us', 'nam', 'United States', 23320],
  ['ca', 'nam', 'Canada', 1988],
  ['lac', 'americas', 'Latin America', 0],
  ['br', 'lac', 'Brazil', 1608],
  ['mx', 'lac', 'Mexico', 1290],
  ['ar', 'lac', 'Argentina', 491],

  // Europe
  ['europe', 'world', 'Europe', 0],
  ['weu', 'europe', 'Western Europe', 0],
  ['de', 'weu', 'Germany', 4260],
  ['fr', 'weu', 'France', 2958],
  ['nl', 'weu', 'Netherlands', 1018],
  ['neu', 'europe', 'Northern Europe', 0],
  ['gb', 'neu', 'United Kingdom', 3180],
  ['se', 'neu', 'Sweden', 635],
  ['seu', 'europe', 'Southern Europe', 0],
  ['it', 'seu', 'Italy', 2100],
  ['es', 'seu', 'Spain', 1425],
  ['eeu', 'europe', 'Eastern Europe', 0],
  ['ru', 'eeu', 'Russia', 1776],
  ['pl', 'eeu', 'Poland', 674],

  // Oceania
  ['oceania', 'world', 'Oceania', 0],
  ['au', 'oceania', 'Australia', 1553],

  // Africa
  ['africa', 'world', 'Africa', 0],
  ['ng', 'africa', 'Nigeria', 440],
  ['eg', 'africa', 'Egypt', 404],
  ['za', 'africa', 'South Africa', 419],
]

// ============================================================
// Registration
// ============================================================

// 这里需要扩展 ChartConfig 类型, 暂时用 any 绕过 TS 检查, 后续在 types 中添加
registerChart<CirclePackingChartConfig>({
  type: ChartType.CIRCLE_PACKING,
  name: '圆形打包图',
  enName: 'Circle Packing',
  category: [ChartCategory.HIERARCHY],
  purpose: [ChartPurpose.HIERARCHY, ChartPurpose.PROPORTION],
  description: '圆形打包图使用圆形嵌套来展示层级数据的包含关系和数值大小。',
  coordinateSystem: CoordinateSystem.NONE,

  dataMappingMeta: CIRCLE_PACKING_DATA_MAPPING_META,
  configMeta: CIRCLE_PACKING_FULL_CONFIG_META,

  defaultConfig: {
    version: 'v2',
    type: ChartType.CIRCLE_PACKING,
    title: { text: '', show: false },
    size: { width: 640, height: 640 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: false },
  },

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_CIRCLE_PACKING_1',
      chartName: '全球 GDP 分布',
      chartConfig: {
        version: 'v2',
        type: ChartType.CIRCLE_PACKING,
        dataMapping: {
          idField: 'id',
          parentField: 'parentId',
          nameField: 'Region/Country',
          valueField: 'GDP (Billion USD)',
        },
        title: { text: '2023 全球 GDP 分布', show: true },
        size: { width: 640, height: 640 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
      },
      chartFile: { content: CIRCLE_PACKING_DEMO_DATA },
    },
  ],

  toEChartsOption: circlePackingToEChartsOption,
})
