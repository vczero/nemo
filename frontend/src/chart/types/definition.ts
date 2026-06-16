import type {
  ChartType,
  ChartCategory,
  ChartPurpose,
  CoordinateSystem,
  EChartsOptionInYWL,
} from './chart'
import type { ChartConfig } from './config'
import type { TConfigItem } from './schema'

// ============================================================
// ChartInstance (图表实例数据 - API 返回 / Store 持有)
// ============================================================

export type DataTable = any[][]

export interface ChartInstance<T extends ChartConfig = ChartConfig> {
  chartId: string
  chartName?: string
  chartConfig?: T
  thumbnailUrl?: string
  purpose?: string
  interpretContent?: string
  interpretContentEn?: string
  chartFile?: {
    fileId?: string
    fileName?: string
    fileSize?: number
    url?: string
    /** 内联数据, 如果有值则优先使用, 不再请求 url */
    content?: DataTable
  }
}

// ============================================================
// DataMappingMeta (数据映射元信息 - 驱动数据面板 UI)
// ============================================================

export interface MetricControlDefinition {
  /** 对应 MetricField 中的字段名 */
  key: string
  /** UI 控件类型 */
  type: 'text' | 'number'
  /** UI 标签 (可选, 某些紧凑布局可能不需要) */
  label?: string
  /** 默认值 */
  defaultValue?: any
  /** 传递给 Antd 组件的 props */
  props?: Record<string, unknown>
  /** Select 选项 */
  options?: { label: string; value: string | number }[]
}

export interface DataMappingFieldMeta {
  /** DataMapping 中的字段名 (如 'dimension', 'metrics', 'nameField') */
  key: string
  /** UI 显示标签 */
  label: string
  /** 是否必填 */
  required: boolean
  /** 描述 */
  description?: string
  /** single: 选一个列; multiple: 选多个列 (MetricField[]) */
  fieldType: 'single' | 'multiple'
  /** For multiple: 最大可选列数 */
  maxFields?: number
  /** For multiple: 是否显示堆叠组输入 */
  showStack?: boolean
  /** For multiple: 是否显示别名输入 */
  showAlias?: boolean
  /** For multiple: 是否显示柱子背景配置 (showBackground + backgroundColor) */
  showBackground?: boolean
  /** For multiple: 额外的动态配置项列表 */
  extras?: MetricControlDefinition[]
  /** For multiple: 推断 dataMapping 时自动应用到每个 MetricField 的默认属性 */
  metricDefaults?: Record<string, unknown>
}

export interface DataMappingMeta {
  fields: DataMappingFieldMeta[]
}

// ============================================================
// ChartDefinition (图表类型定义 - 注册到 Registry)
// ============================================================

export interface ChartDefinition<T extends ChartConfig = ChartConfig> {
  /** 图表类型标识 */
  type: ChartType
  /** 中文名 */
  name: string
  /** 英文名 */
  enName: string
  /** 图标标识 */
  icon?: string
  /** 图表分类 */
  category: ChartCategory[]
  /** 图表用途 */
  purpose: ChartPurpose[]
  /** 描述 */
  description: string

  /** 在 config panel 中展示的公告信息,可能是版权说明 */
  announcement?: string

  /** 坐标系统 */
  coordinateSystem: CoordinateSystem

  // ── 数据映射元信息 (驱动 DataPanel 渲染) ──
  dataMappingMeta: DataMappingMeta | null

  // ── 配置元信息 (驱动 ConfigPanel 渲染) ──
  /** 该图表的完整配置项列表, ConfigPanel 根据此数组动态渲染 */
  configMeta: TConfigItem[]

  // ── 默认值 ──
  defaultConfig:
    | Partial<T>
    | ((data: DataTable, dataMapping: Record<string, unknown>) => Partial<T>)

  // ── Demo 示例 ──
  demos: ChartInstance<T>[]

  // ── Transformer ──
  /** 接收公共 baseOption, 就地修改并返回完整 ECharts option (公共配置已由 transformer.ts 预设) */
  toEChartsOption: (
    config: T,
    data: DataTable,
    baseOption: EChartsOptionInYWL
  ) => EChartsOptionInYWL | Promise<EChartsOptionInYWL>

  // ── 数据映射推断 (可选, 用于上传数据后自动生成 dataMapping) ──
  /** 根据上传的数据自动推断 dataMapping; 不提供则使用通用推断逻辑 */
  inferDataMapping?: (
    data: DataTable,
    meta: DataMappingMeta | null
  ) => Record<string, unknown>

  /** 销毁图表实例时调用的回调函数 */
  destroy?: () => void
}
