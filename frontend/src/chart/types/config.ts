import type { ChartType } from './chart'

// ============================================================
// MetricField (度量字段)
// ============================================================

export interface MetricField {
  /** 数据列名 */
  field: string
  /** 显示名 / 图例标签 */
  alias?: string
  /** 系列类型, 仅 mixed 图表使用 */
  seriesType?: 'bar' | 'line' | 'scatter'
  /** 堆叠组标识, 相同 stack 值的度量会堆叠在一起 */
  stack?: string
  /** 聚合方式 */
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'
  /** 是否显示柱子背景 (仅 bar 系列) */
  showBackground?: boolean
  /** 柱子背景颜色, showBackground 为 true 时生效 */
  backgroundColor?: string
  /** 其他图表自定义的配置项 */
  [key: string]: any
}

// ============================================================
// BaseChartConfig (所有图表共享的基础配置)
// ============================================================

export interface BaseChartConfig {
  // ── Meta ──
  version: 'v2'
  type: ChartType

  /** 在计算任务中对应的报告图表 key */
  reportKey?: string

  // ── Feature: base ──
  title?: {
    text?: string
    show?: boolean
  }
  size?: { width: number; height: number }
  fontSize?: number
  theme?: string

  // ── Feature: legend ──
  legend?: {
    show?: boolean
    position?: 'top' | 'bottom' | 'left' | 'right'
  }

  // ── Feature: label ──
  label?: {
    show?: boolean
    position?: 'inside' | 'outside' | 'top' | 'bottom' | 'left' | 'right' | 'center'
    format?: string
  }

  // ── Feature: cartesian (xAxis, yAxis, grid) ──
  xAxis?: {
    name?: { show?: boolean; text?: string }
    tick?: { show?: boolean, interval?: number }
    labelRotate?: number
  }
  yAxis?: {
    name?: { show?: boolean; text?: string }
    tick?: { show?: boolean }
  }
  grid?: {
    show?: boolean
    /** 手动布局: 上/右/下/左 边距 (px), undefined 时使用自动计算值 */
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
}

// ============================================================
// Bar 家族 (vertical + horizontal, stacked, grouped, percent)
// ============================================================

export interface BarChartConfig extends BaseChartConfig {
  type:
    | 'bar'
    | 'background_bar'
    | 'highlighted_bar'
    | 'stacked_bar'
    | 'grouped_bar'
    | 'percent_bar'
    | 'horizontal_bar'
    | 'stacked_horizontal_bar'
    | 'grouped_horizontal_bar'
    | 'percent_horizontal_bar'
    | 'tornado'
  dataMapping: {
    dimension: string
    metrics: MetricField[]
    /** 分组字段 (颜色), 按此字段的不同值拆分为多个系列 — 长表模式 */
    stackBy?: string
  }
  chartSetting?: {
    barWidth?: number | string
    barGap?: string
    barCategoryGap?: string
    /** 高亮柱 — 高亮指定索引的柱子 */
    highlightedBar?: {
      enabled?: boolean
      /** 要高亮的柱子序号 (从 1 开始, 更符合普通人习惯) */
      index?: number
      /** 高亮颜色 (如 '#FF6B6B') */
      color?: string
    }
  }
}

// ============================================================
// Line 家族 (line, area)
// ============================================================

export interface LineChartConfig extends BaseChartConfig {
  type: 'line' | 'smooth_line' | 'area' | 'multi_line' | 'stacked_line' | 'stacked_area' | 'step_line'
  dataMapping: {
    dimension: string
    metrics: MetricField[]
    /** 分组字段 (颜色), 按此字段的不同值拆分为多个系列 — 长表模式 */
    stackBy?: string
  }
  chartSetting?: {
    smooth?: boolean
    areaStyle?: boolean
    step?: 'start' | 'middle' | 'end' | false
    symbol?: boolean
  }
}

// ============================================================
// Mixed Bar + Line
// ============================================================

export interface MixedBarLineChartConfig extends BaseChartConfig {
  type: 'mixed_bar_line'
  dataMapping: {
    dimension: string
    /** 每个 metric 通过 seriesType 指定是 bar 还是 line */
    metrics: MetricField[]
    /** 分组字段 (颜色), 按此字段的不同值拆分为多个系列 — 长表模式 */
    stackBy?: string
  }
  chartSetting?: {
    barWidth?: number | string
  }
}

// ============================================================
// Scatter (散点图)
// ============================================================

export interface ScatterChartConfig extends BaseChartConfig {
  type: 'scatter' | 'scatter_linear' | 'scatter_exponential' | 'scatter_logarithmic' | 'scatter_polynomial'
  dataMapping: {
    xField: string
    yField: string
    /** 气泡大小字段 (数值) */
    sizeField?: string
    /** 分组/颜色字段 (分类) */
    colorField?: string
  }
  chartSetting?: {
    /** 基础点大小 (当未配置 sizeField 时生效) */
    symbolSize?: number
    /** 气泡大小范围 [min, max] (当配置了 sizeField 时生效) */
    bubbleSizeRange?: [number, number]
    /** 回归分析配置 (scatter_linear 等类型会自动预设此配置) */
    regression?: {
      type: 'none' | 'linear' | 'exponential' | 'logarithmic' | 'polynomial'
      /** 多项式阶数 */
      order?: number
    }
  }
}

// ============================================================
// Boxplot (箱线图)
// ============================================================

export interface BoxplotChartConfig extends BaseChartConfig {
  type: 'boxplot' | 'horizontal_boxplot'
  dataMapping: {
    dimension: string
    metrics: MetricField[]
    /** 分组字段 (颜色), 按此字段的不同值拆分为多个系列 — 长表模式 */
    stackBy?: string
  }
  chartSetting?: {
    /** 箱体宽度 [min, max] or number */
    boxWidth?: number[] | number
    /** 是否显示异常点 */
    showOutliers?: boolean
    /** 是否显示原始数据点 (散点/抖动图) */
    showDataPoints?: boolean
    /** 是否显示间隔条纹 */
    splitArea?: boolean
  }
}

// ============================================================
// Violin (小提琴图)
// ============================================================

export interface ViolinChartConfig extends BaseChartConfig {
  type: 'violin'
  dataMapping: {
    dimension: string
    metrics: string
  }
  chartSetting?: {
    /** 带宽缩放因子 (影响平滑度) */
    bandWidthScale?: number
    /** 采样点数量 */
    binCount?: number
    /** 区域透明度 */
    areaOpacity?: number
  }
}

// ============================================================
// Heatmap (热力图)
// ============================================================

export interface HeatmapChartConfig extends BaseChartConfig {
  type: 'heatmap'
  dataMapping: {
    xField: string
    yField: string
    valueField: string
  }
  chartSetting?: {
    visualMapMin?: number
    visualMapMax?: number
  }
}

// ============================================================
// Matrix Heatmap (矩阵热力图)
// ============================================================

export interface MatrixHeatmapChartConfig extends BaseChartConfig {
  type: 'matrix_heatmap'
  dataMapping: null
  chartSetting?: {
    visualMapMin?: number
    visualMapMax?: number
  }
}

// ============================================================
// Pie 家族 (pie, donut)
// ============================================================

export interface PieChartConfig extends BaseChartConfig {
  type: 'pie' | 'donut' | 'rounded_donut'
  dataMapping: {
    nameField: string
    valueField: string
  }
  chartSetting?: {
    /** 外半径百分比 0-100 */
    radius?: number
    /** 内半径百分比 0-100, >0 即环形图 */
    innerRadius?: number
    roseType?: 'radius' | 'area' | false
    /** 标签是否显示数据名称 */
    showLabelName?: boolean
    /** 是否显示扇区边框 */
    showBorder?: boolean
    /** 标题显示位置: top 顶部 (默认), center 圆环中心 (仅环形图) */
    titlePosition?: 'center' | 'top'
  }
}

// ============================================================
// Radar (雷达图)
// ============================================================

export interface RadarChartConfig extends BaseChartConfig {
  type: 'radar'
  dataMapping: {
    dimension: string
    metrics: MetricField[]
  }
  chartSetting?: {
    shape?: 'polygon' | 'circle'
    areaStyle?: boolean
    radius?: number
  }
}

// ============================================================
// Funnel (漏斗图)
// ============================================================

export interface FunnelChartConfig extends BaseChartConfig {
  type: 'funnel' | 'pyramid'
  dataMapping: {
    nameField: string
    valueField: string
  }
  chartSetting?: {
    sort?: 'ascending' | 'descending' | 'none'
    gap?: number
    minSize?: number
  }
}

export interface CompareFunnelChartConfig extends BaseChartConfig {
  type: 'compare_funnel'
  dataMapping: {
    dimension: string
    metrics: MetricField[]
  }
  chartSetting?: {
    sort?: 'ascending' | 'descending' | 'none'
    gap?: number
    minSize?: number
  }
}

// ============================================================
// Hierarchy (sunburst)
// ============================================================

export interface HierarchyChartConfig extends BaseChartConfig {
  type: 'sunburst'
  dataMapping: {
    idField: string
    parentField?: string
    nameField: string
    valueField: string
  }
  chartSetting?: Record<string, never>
}

// ============================================================
// Treemap (矩形树图)
// ============================================================

export interface TreemapChartConfig extends BaseChartConfig {
  type: 'treemap'
  dataMapping: {
    idField: string
    parentField: string
    nameField: string
    valueField: string
  }
  chartSetting?: {
    labelColor?: string
  }
}

// ============================================================
// Tree Chart (树图)
// ============================================================

export interface TreeChartConfig extends BaseChartConfig {
  type: 'tree'
  dataMapping: {
    idField: string
    parentField: string
    nameField: string
    valueField?: string
  }
  chartSetting?: {
    layout?: 'orthogonal' | 'radial'
    orient?: 'LR' | 'RL' | 'TB' | 'BT'
    symbolSize?: number
    symbol?: string
    initialTreeDepth?: number,
    lineColor?: string
  }
}

// ============================================================
// Circle Packing Chart (圆形打包图)
// ============================================================

export interface CirclePackingChartConfig extends BaseChartConfig {
  type: 'circle_packing'
  dataMapping: {
    idField: string
    parentField: string
    nameField: string
    valueField: string
  }
  chartSetting?: {
    labelColor?: string
  }
}

// ============================================================
// WordCloud (词云)
// ============================================================

export interface WordCloudChartConfig extends BaseChartConfig {
  type: 'wordcloud'
  dataMapping: {
    nameField: string
    valueField: string
    nameField2?: string
    valueField2?: string
    /** For translated words, if translation is enabled */
    translatedNameField?: string
  }
  chartSetting?: {
    shape?: 'square' | 'circle' | 'triangle' | 'star' | 'image'
    sizeRange?: [number, number]
    rotationRange?: [number, number]
    rotationStep?: number
    /** Base64 image data for custom mask */
    maskImage?: string
  }
}

// ============================================================
// Map (地图)
// ============================================================

export interface MapChartConfig extends BaseChartConfig {
  type: 'map'
  dataMapping: {
    nameField: string
    valueField: string
  }
  chartSetting?: {
    /** 地图范围 ID: 'world' | 'china' (100000) | province adcode */
    mapId?: string | number
    /** 显示层级: 'country' | 'province' | 'city' | 'county' */
    mapLevel?: 'country' | 'province' | 'city' | 'county'
    /** 父级 Adcode (用于 children 查找) */
    adcodes?: number[]
    /** 视觉映射最小值 */
    visualMapMin?: number
    /** 视觉映射最大值 */
    visualMapMax?: number
    /** 视觉映射颜色 */
    visualMapColor?: { color: string, percent: number }[]
    /** 是否显示标签 */
    showLabel?: boolean
    /** 标签语言 */
    labelLanguage?: 'zh' | 'en'
  }
}

// ============================================================
// Gauge (仪表盘)
// ============================================================

export interface GaugeChartConfig extends BaseChartConfig {
  type: 'gauge'
  dataMapping: {
    valueField: string
  }
  chartSetting?: {
    min?: number
    max?: number
    splitNumber?: number
  }
}

// ============================================================
// Single Axis Scatter (单轴散点图)
// ============================================================

export interface SingleAxisScatterChartConfig extends BaseChartConfig {
  type: 'single_axis_scatter'
  dataMapping: {
    /** 分组字段 (生成多个轴) */
    groupBy: string
    /** 维度 (轴) */
    dimension: string
    /** 数值 (气泡大小) */
    valueField: string
  }
  chartSetting?: {
    symbolSize?: number
    bubbleSizeRange?: [number, number]
    axisGap?: number
    axisHeight?: number
  }
}

// ============================================================
// Slope Chart (斜率图)
// ============================================================

export interface SlopeChartConfig extends BaseChartConfig {
  type: 'slope'
  dataMapping: {
    dimension: string
    valueField: string
    /** 分组字段 (颜色), 按此字段的不同值拆分为多个系列 — 长表模式 */
    stackBy?: string
  }
  chartSetting?: {
    /** 是否显示数据点标记 */
    showSymbol?: boolean
    /** 线条宽度 */
    lineWidth?: number
    /** 标记大小 */
    symbolSize?: number
    /** 内容宽度百分比 (10-100), 用于控制两条轴之间的距离 */
    slopeWidth?: number,
    /** 进行排序 */
    sort?: 'ascending' | 'descending'
  }
}

// ============================================================
// Graph Chart (关系图)
// ============================================================

export interface GraphChartConfig extends BaseChartConfig {
  type: 'force_graph' | 'flow_graph' | 'relationship_graph'
  dataMapping: {
    sourceField: string
    targetField: string
    valueField?: string
    categoryField?: string
  }
  chartSetting?: {
    force?: {
      repulsion?: number
      edgeLength?: number
      gravity?: number
    }
    lineCurveness?: number
    /** 是否显示箭头 */
    showArrow?: boolean
    /** 连线颜色: source | target | color (fixed) */
    colorFrom?: 'source' | 'target' | string
    lineColor?: string
    /** 连线宽度是否随权重变化 */
    edgeWidthByWeight?: boolean
    /** 节点大小是否随权重(度/流量)变化 */
    nodeSizeByWeight?: boolean
    /** 节点大小范围 */
    nodeSizeRange?: [number, number]
    /** 标签防重叠 */
    hideOverlap?: boolean
  }
}

// ============================================================
// Chord Chart (和弦图)
// ============================================================

export interface ChordChartConfig extends BaseChartConfig {
  type: 'chord'
  dataMapping: {
    sourceField: string
    targetField: string
    valueField: string
  }
  chartSetting?: {
    colorFrom?: 'source' | 'target'
    opacity?: number
    showLabelName?: boolean
    radius?: number
    innerRadius?: number
  }
}

// ============================================================
// Sankey Chart (桑基图)
// ============================================================

export interface SankeyChartConfig extends BaseChartConfig {
  type: 'sankey'
  dataMapping: {
    sourceField: string
    targetField: string
    valueField: string
  }
  chartSetting?: {
    nodeWidth?: number
    showLabelName?: boolean
  }
}

// ============================================================
// Histogram Chart (直方图)
// ============================================================

export interface HistogramChartConfig extends BaseChartConfig {
  type: 'histogram'
  dataMapping: {
    valueField: string
  }
  chartSetting?: {
    binningAlgorithm?: 'squareRoot' | 'scott' | 'freedmanDiaconis' | 'sturges'
  }
}

// ============================================================
// Timeline Chart (时间线图)
// ============================================================
export interface TimelineChartConfig extends BaseChartConfig {
  type: 'timeline'
  dataMapping: {
    titleField: string
    subtitleField?: string
    labelField?: string
  }
  chartSetting?: {
    arrowHeight?: number
    arrowDepth?: number
    gap?: number
  }
}

// ============================================================
// ChartConfig (判别联合类型, 通过 type 字段判别)
// ============================================================

export type ChartConfig =
  | BarChartConfig
  | LineChartConfig
  | MixedBarLineChartConfig
  | ScatterChartConfig
  | SingleAxisScatterChartConfig
  | BoxplotChartConfig
  | ViolinChartConfig
  | HeatmapChartConfig
  | MatrixHeatmapChartConfig
  | PieChartConfig
  | RadarChartConfig
  | FunnelChartConfig
  | CompareFunnelChartConfig
  | HierarchyChartConfig
  | TreemapChartConfig
  | WordCloudChartConfig
  | MapChartConfig
  | GaugeChartConfig
  | SlopeChartConfig
  | ChordChartConfig
  | GraphChartConfig
  | SankeyChartConfig
  | HistogramChartConfig
  | TreeChartConfig
  | CirclePackingChartConfig
  | TimelineChartConfig

