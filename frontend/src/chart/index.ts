// Types
export type {
  ChartConfig,
  BaseChartConfig,
  BarChartConfig,
  LineChartConfig,
  MixedBarLineChartConfig,
  ScatterChartConfig,
  BoxplotChartConfig,
  HeatmapChartConfig,
  PieChartConfig,
  RadarChartConfig,
  FunnelChartConfig,
  HierarchyChartConfig,
  WordCloudChartConfig,
  MapChartConfig,
  GaugeChartConfig,
  GraphChartConfig,
  MetricField,
  ChartInstance,
  ChartDefinition,
  DataMappingMeta,
  DataMappingFieldMeta,
  TConfigItem,
  TConfigGroup,
  MatrixHeatmapChartConfig
} from './types'

export {
  ChartType,
  ChartCategory,
  ChartCategoryLabel,
  ChartPurpose,
  ChartPurposeLabel,
  CoordinateSystem,
  CONFIG_GROUP_LABELS,
  CONFIG_GROUP_ORDER,
} from './types'

// Pre-built config item sets (composable "features")
export {
  BASE_CONFIG_ITEMS,
  CARTESIAN_CONFIG_ITEMS,
  LEGEND_CONFIG_ITEMS,
  LABEL_CONFIG_ITEMS,
  BAR_HIGHLIGHT_CONFIG_ITEMS,
  PIE_CONFIG_ITEMS,
  RADAR_CONFIG_ITEMS,
  FUNNEL_CONFIG_ITEMS,
  FUNNEL_BASIC_CONFIG_ITEMS,
  HEATMAP_CONFIG_ITEMS,
  LINE_CONFIG_ITEMS,
} from './configItems'

// Chart registrations (side-effect: registers all chart types)
import './metadata'

// Themes registrarions
export { THEMES } from './theme'

// Transformer
export { toEChartsOption } from './core/transformer'

// Utils
export { suggestStackBy, classifyColumns, inferDataMapping, isDataMappingCompatible } from './utils'

// Store
export {
  ChartEditorProvider,
  createEditorStore,
  useEditorStore,
  selectColumns,
  selectIsDemo,
  selectCanEditData,
  selectHasData,
  selectIsReady,
  selectIsLoading,
  selectIsSyncing,
  selectChartDefinition,
  selectChartWidth,
  selectChartHeight,
  selectChartDataMapping,
  registerChart,
  getChartDefinition,
  findChartDefinition,
  getAllChartDefinitions,
  isDemoChartId,
  loadDemoChart,
  getAllDemos,
  getDemoMap,
} from './core'
