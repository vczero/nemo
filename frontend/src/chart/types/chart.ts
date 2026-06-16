// ============================================================
// Chart Type System
// ============================================================
import type {
  EChartsOption,
  GridComponentOption,
  XAXisComponentOption,
  YAXisComponentOption,
  LegendComponentOption,
  TitleComponentOption,
  VisualMapComponentOption,
} from 'echarts'
/**
 * 所有支持的图表类型
 * 通过字符串字面量联合类型定义, 作为 ChartConfig 的 discriminant
 */
export const ChartType = {
  // Cartesian - Line family
  LINE: 'line',
  SMOOTH_LINE: 'smooth_line',
  AREA: 'area',
  MULTI_LINE: 'multi_line',
  STACKED_LINE: 'stacked_line',
  STACKED_AREA: 'stacked_area',
  STEP_LINE: 'step_line',

  // Cartesian - Bar family (vertical)
  BAR: 'bar',
  BACKGROUND_BAR: 'background_bar',
  HIGHLIGHTED_BAR: 'highlighted_bar',
  STACKED_BAR: 'stacked_bar',
  GROUPED_BAR: 'grouped_bar',
  PERCENT_BAR: 'percent_bar',

  // Cartesian - Bar family (horizontal)
  HORIZONTAL_BAR: 'horizontal_bar',
  STACKED_HORIZONTAL_BAR: 'stacked_horizontal_bar',
  GROUPED_HORIZONTAL_BAR: 'grouped_horizontal_bar',
  PERCENT_HORIZONTAL_BAR: 'percent_horizontal_bar',
  TORNADO: 'tornado',
  HISTOGRAM: 'histogram', // Added Histogram Chart Type

  // Cartesian - Mixed
  MIXED_BAR_LINE: 'mixed_bar_line',

  // Cartesian - Other
  SCATTER: 'scatter',
  SCATTER_LINEAR: 'scatter_linear',
  SCATTER_EXPONENTIAL: 'scatter_exponential',
  SCATTER_LOGARITHMIC: 'scatter_logarithmic',
  SCATTER_POLYNOMIAL: 'scatter_polynomial',
  SINGLE_AXIS_SCATTER: 'single_axis_scatter',
  BOXPLOT: 'boxplot',
  HORIZONTAL_BOXPLOT: 'horizontal_boxplot',
  VIOLIN: 'violin',
  HEATMAP: 'heatmap',
  MATRIX_HEATMAP: 'matrix_heatmap',
  SLOPE: 'slope',

  // Non-cartesian
  PIE: 'pie',
  DONUT: 'donut',
  ROUNDED_DONUT: 'rounded_donut',
  RADAR: 'radar',
  TIMELINE: 'timeline',

  // Funnel
  FUNNEL: 'funnel',
  COMPARE_FUNNEL: 'compare_funnel',
  PYRAMID: 'pyramid',

  // Hierarchy
  TREEMAP: 'treemap',
  SUNBURST: 'sunburst',
  TREE: 'tree',
  CIRCLE_PACKING: 'circle_packing',

  // Special
  WORDCLOUD: 'wordcloud',
  MAP: 'map',
  GAUGE: 'gauge',
  CHORD: 'chord',

  // Graph
  FORCE_GRAPH: 'force_graph',
  FLOW_GRAPH: 'flow_graph',
  RELATIONSHIP_GRAPH: 'relationship_graph',
  SANKEY: 'sankey',
} as const

export type ChartType = (typeof ChartType)[keyof typeof ChartType]

// ============================================================
// Chart Category (图表分类)
// ============================================================

export const ChartCategory = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
  RADAR: 'radar',
  SCATTER: 'scatter',
  HIERARCHY: 'hierarchy',
  MAP: 'map',
  FUNNEL: 'funnel',
  HEATMAP: 'heatmap',
  SLOPE: 'slope',
  CHORD: 'chord',
  GRAPH: 'graph',
  SANKEY: 'sankey',
  TIMELINE: 'timeline',
  WORDCLOUD: 'wordcloud',
  VIOLIN: 'violin',
  HORIZONTAL_BAR: 'horizontal_bar',
  TORNADO: 'tornado',
  HISTOGRAM: 'histogram',
  DONUT: 'donut',
  BOXPLOT: 'boxplot',
} as const

export type ChartCategory = (typeof ChartCategory)[keyof typeof ChartCategory]

export const ChartCategoryLabel: Record<ChartCategory, string> = {
  [ChartCategory.LINE]: '折线图',
  [ChartCategory.BAR]: '柱状图',
  [ChartCategory.HORIZONTAL_BAR]: '条形图',
  [ChartCategory.TORNADO]: '旋风图',
  [ChartCategory.HISTOGRAM]: '直方图',
  [ChartCategory.PIE]: '饼图',
  [ChartCategory.DONUT]: '环形图',
  [ChartCategory.BOXPLOT]: '箱线图',
  [ChartCategory.RADAR]: '雷达图',
  [ChartCategory.SCATTER]: '散点图',
  [ChartCategory.HIERARCHY]: '层级图',
  [ChartCategory.MAP]: '地图',
  [ChartCategory.FUNNEL]: '漏斗图',
  [ChartCategory.HEATMAP]: '热力图',
  [ChartCategory.SLOPE]: '斜率图',
  [ChartCategory.CHORD]: '和弦图',
  [ChartCategory.GRAPH]: '社交网络分析',
  [ChartCategory.SANKEY]: '桑基图',
  [ChartCategory.TIMELINE]: '时间线图',
  [ChartCategory.WORDCLOUD]: '词云图',
  [ChartCategory.VIOLIN]: '小提琴图',
}

// ============================================================
// Chart Purpose (图表用途)
// ============================================================

export const ChartPurpose = {
  COMPARISON: 'comparison',
  RELATIONSHIP: 'relationship',
  DISTRIBUTION: 'distribution',
  HIERARCHY: 'hierarchy',
  RANKING: 'ranking',
  TREND: 'trend',
  PROPORTION: 'proportion',
  SPATIAL: 'spatial',
  NETWORK: 'network',
} as const

export type ChartPurpose = (typeof ChartPurpose)[keyof typeof ChartPurpose]

export const ChartPurposeLabel: Record<ChartPurpose, string> = {
  [ChartPurpose.COMPARISON]: '对比分析',
  [ChartPurpose.RELATIONSHIP]: '相关性',
  [ChartPurpose.DISTRIBUTION]: '数据分布',
  [ChartPurpose.HIERARCHY]: '层次分析',
  [ChartPurpose.RANKING]: '用于排序',
  [ChartPurpose.TREND]: '趋势分析',
  [ChartPurpose.PROPORTION]: '占比分析',
  [ChartPurpose.SPATIAL]: '空间分析',
  [ChartPurpose.NETWORK]: '社会网络',
}

// ============================================================
// Coordinate System (坐标系统)
// ============================================================

export const CoordinateSystem = {
  CARTESIAN: 'cartesian',
  POLAR: 'polar',
  RADAR: 'radar',
  GEO: 'geo',
  SINGLE_AXIS: 'singleAxis',
  NONE: 'none',
} as const

export type CoordinateSystem =
  (typeof CoordinateSystem)[keyof typeof CoordinateSystem]
export interface EChartsOptionInYWL extends Omit<
  EChartsOption,
  'title' | 'grid' | 'xAxis' | 'yAxis' | 'legend' | 'visualMap'
> {
  title?: TitleComponentOption
  grid?: GridComponentOption
  xAxis?: XAXisComponentOption
  yAxis?: YAXisComponentOption
  legend?: LegendComponentOption
  visualMap?: VisualMapComponentOption
}
