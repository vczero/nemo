/**
 * Bar Chart Family Registration
 *
 * 注册 bar (基础柱状图), background_bar (带背景柱状图),
 * highlighted_bar (标记柱状图), stacked_bar (堆叠柱状图),
 * grouped_bar (分组柱状图) 和 percent_bar (百分比堆叠柱状图).
 */
import { registerChart } from '../core/registry'
import {
  ChartType,
  ChartCategory,
  ChartPurpose,
  CoordinateSystem,
} from '../types'
import type { BarChartConfig, DataTable } from '../types'
import {
  BASE_CONFIG_ITEMS,
  CARTESIAN_CONFIG_ITEMS,
  LEGEND_CONFIG_ITEMS,
  LABEL_CONFIG_ITEMS,
  BAR_HIGHLIGHT_CONFIG_ITEMS,
} from '../configItems'
import {
  BAR_DATA_MAPPING_META,
  GROUPED_BAR_DATA_MAPPING_META,
  BACKGROUND_BAR_DATA_MAPPING_META,
  STACKED_BAR_DATA_MAPPING_META,
  PERCENT_BAR_DATA_MAPPING_META,
  BAR_DEMO_DATA,
  STACKED_BAR_DEMO_DATA,
  barToEChartsOption,
} from './barBase'

// ============================================================
// Shared: Bar 家族配置项
// ============================================================

/** 基础 bar 配置 — 所有 bar 类型共享 (不含高亮) */
const BAR_BASE_CONFIG_META = [
  ...BASE_CONFIG_ITEMS,
  ...CARTESIAN_CONFIG_ITEMS,
  ...LEGEND_CONFIG_ITEMS,
  ...LABEL_CONFIG_ITEMS,
]

/** 含高亮配置 — 仅用于 bar / background_bar / highlighted_bar 等支持高亮的类型 */
const BAR_HIGHLIGHT_CONFIG_META = [
  ...BAR_BASE_CONFIG_META,
  ...BAR_HIGHLIGHT_CONFIG_ITEMS,
]

// ============================================================
// Bar Chart (基础柱状图)
// ============================================================

registerChart({
  type: ChartType.BAR,
  name: '基础柱状图',
  enName: 'Bar Chart',
  category: [ChartCategory.BAR],
  purpose: [ChartPurpose.COMPARISON],
  description:
    '基础柱状图使用矩形条的长度来表示数据值的大小, 适合比较不同类别之间的数量差异。',
  coordinateSystem: CoordinateSystem.CARTESIAN,

  dataMappingMeta: BAR_DATA_MAPPING_META,
  configMeta: BAR_HIGHLIGHT_CONFIG_META,

  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'bar',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: false },
    label: { show: true },
    xAxis: {
      name: { show: true, text: dataMapping.dimension as string },
      tick: { show: true },
    },
    yAxis: {
      name: { show: true, text: dataMapping.metrics?.[0]?.alias ?? '' },
      tick: { show: true },
    },
    grid: { show: false },
  }),

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_BAR_1',
      chartName: '城市气温',
      chartConfig: {
        version: 'v2',
        type: 'bar',
        dataMapping: {
          dimension: 'city',
          metrics: [{ field: 'temperature', alias: '气温(℃)' }],
        },
        title: { text: '各城市平均气温', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
        label: { show: true },
        xAxis: { name: { show: true, text: '城市' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '气温(℃)' }, tick: { show: true } },
        grid: { show: false },
      } as BarChartConfig,
      chartFile: { content: BAR_DEMO_DATA },
    },
  ],

  toEChartsOption: barToEChartsOption,
})

// ============================================================
// Background Bar Chart (带背景柱状图)
// ============================================================

registerChart({
  type: ChartType.BACKGROUND_BAR,
  name: '带背景柱状图',
  enName: 'Background Bar Chart',
  category: [ChartCategory.BAR],
  purpose: [ChartPurpose.COMPARISON],
  description:
    '带背景柱状图在每根柱子后方绘制浅色背景条, 更直观地展示数值占满刻度的比例, 适合进度类或达成率场景。',
  coordinateSystem: CoordinateSystem.CARTESIAN,

  dataMappingMeta: BACKGROUND_BAR_DATA_MAPPING_META,
  configMeta: BAR_HIGHLIGHT_CONFIG_META,

  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'background_bar',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: false },
    label: { show: true },
    xAxis: {
      name: { show: true, text: dataMapping.dimension as string },
      tick: { show: true },
    },
    yAxis: {
      name: { show: true, text: dataMapping.metrics?.[0]?.alias ?? '' },
      tick: { show: true },
    },
    grid: { show: false },
  }),

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_BACKGROUND_BAR_1',
      chartName: '城市气温 (带背景)',
      chartConfig: {
        version: 'v2',
        type: 'background_bar',
        dataMapping: {
          dimension: 'city',
          metrics: [
            {
              field: 'temperature',
              alias: '气温(℃)',
              showBackground: true,
              backgroundColor: 'rgba(180, 180, 180, 0.2)',
            },
          ],
        },
        title: { text: '各城市平均气温', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
        label: { show: true },
        xAxis: { name: { show: true, text: '城市' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '气温(℃)' }, tick: { show: true } },
        grid: { show: false },
      } as BarChartConfig,
      chartFile: { content: BAR_DEMO_DATA },
    },
  ],

  toEChartsOption: barToEChartsOption,
})

// ============================================================
// Highlighted Bar Chart (标记柱状图)
// ============================================================

registerChart({
  type: ChartType.HIGHLIGHTED_BAR,
  name: '标记柱状图',
  enName: 'Highlighted Bar Chart',
  category: [ChartCategory.BAR],
  purpose: [ChartPurpose.COMPARISON, ChartPurpose.RANKING],
  description:
    '标记柱状图可将指定的某根柱子高亮为特殊颜色, 适合在一组数据中突出展示某个关键类别。',
  coordinateSystem: CoordinateSystem.CARTESIAN,

  dataMappingMeta: BAR_DATA_MAPPING_META,
  configMeta: BAR_HIGHLIGHT_CONFIG_META,

  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'highlighted_bar',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: false },
    label: { show: true },
    xAxis: {
      name: { show: true, text: dataMapping.dimension as string },
      tick: { show: true },
    },
    yAxis: {
      name: { show: true, text: dataMapping.metrics?.[0]?.alias ?? '' },
      tick: { show: true },
    },
    grid: { show: false },
    chartSetting: {
      highlightedBar: { enabled: true, index: 3, color: '#03184f' },
    },
  }),

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_HIGHLIGHTED_BAR_1',
      chartName: '城市气温 (高亮广州)',
      chartConfig: {
        version: 'v2',
        type: 'highlighted_bar',
        dataMapping: {
          dimension: 'city',
          metrics: [{ field: 'temperature', alias: '气温(℃)' }],
        },
        title: { text: '各城市平均气温 — 广州最高', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
        label: { show: true },
        xAxis: { name: { show: true, text: '城市' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '气温(℃)' }, tick: { show: true } },
        grid: { show: false },
        chartSetting: {
          highlightedBar: { enabled: true, index: 3, color: '#03184f' },
        },
      } as BarChartConfig,
      chartFile: { content: BAR_DEMO_DATA },
    },
  ],

  toEChartsOption: barToEChartsOption,
})

// ============================================================
// Stacked Bar Chart (堆叠柱状图)
// ============================================================

registerChart({
  type: ChartType.STACKED_BAR,
  name: '堆叠柱状图',
  enName: 'Stacked Bar Chart',
  category: [ChartCategory.BAR],
  purpose: [ChartPurpose.PROPORTION, ChartPurpose.COMPARISON],
  description:
    '堆叠柱状图通过将不同类别的数据堆叠在一起, 显示各部分与整体的关系, 适合展示组成部分的变化。',
  coordinateSystem: CoordinateSystem.CARTESIAN,

  dataMappingMeta: STACKED_BAR_DATA_MAPPING_META,
  configMeta: BAR_BASE_CONFIG_META,

  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'stacked_bar',
    dataMapping: { dimension: '', metrics: [] },
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true },
    label: { show: true },
    xAxis: {
      name: { show: true, text: dataMapping.dimension as string },
      tick: { show: true },
    },
    yAxis: {
      name: { show: true, text: dataMapping.metrics?.[0]?.alias ?? '' },
      tick: { show: true },
    },
    grid: { show: false },
  }),

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_STACKED_BAR_1',
      chartName: '季度产品销量',
      chartConfig: {
        version: 'v2',
        type: 'stacked_bar',
        dataMapping: {
          dimension: 'quarter',
          metrics: [
            { field: '产品A', alias: '产品A', stack: 'total' },
            { field: '产品B', alias: '产品B', stack: 'total' },
            { field: '产品C', alias: '产品C', stack: 'total' },
          ],
        },
        title: { text: '季度产品销量堆叠', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'bottom' },
        label: { show: true },
        xAxis: { name: { show: true, text: '季度' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '销量' }, tick: { show: true } },
        grid: { show: false },
      } as BarChartConfig,
      chartFile: { content: STACKED_BAR_DEMO_DATA },
    },
  ],

  toEChartsOption: barToEChartsOption,
})

// ============================================================
// Grouped Bar Chart (分组柱状图)
// ============================================================

registerChart({
  type: ChartType.GROUPED_BAR,
  name: '分组柱状图',
  enName: 'Grouped Bar Chart',
  category: [ChartCategory.BAR],
  purpose: [ChartPurpose.COMPARISON],
  description:
    '分组柱状图将不同系列的柱子并排放置, 适合在同一维度下对比多个类别的数值差异。',
  coordinateSystem: CoordinateSystem.CARTESIAN,

  dataMappingMeta: GROUPED_BAR_DATA_MAPPING_META,
  configMeta: BAR_BASE_CONFIG_META,

  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'grouped_bar',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'bottom' },
    label: { show: true },
    xAxis: {
      name: { show: true, text: dataMapping.dimension as string },
      tick: { show: true },
    },
    yAxis: {
      name: { show: true, text: dataMapping.stackBy ?? '' },
      tick: { show: true },
    },
    grid: { show: false },
  }),

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_GROUPED_BAR_1',
      chartName: '季度产品销量 (分组)',
      chartConfig: {
        version: 'v2',
        type: 'grouped_bar',
        dataMapping: {
          dimension: 'quarter',
          metrics: [
            { field: '产品A', alias: '产品A' },
            { field: '产品B', alias: '产品B' },
            { field: '产品C', alias: '产品C' },
          ],
        },
        title: { text: '季度产品销量对比', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'bottom' },
        label: { show: true },
        xAxis: { name: { show: true, text: '季度' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '销量' }, tick: { show: true } },
        grid: { show: false },
      } as BarChartConfig,
      chartFile: { content: STACKED_BAR_DEMO_DATA },
    },
  ],

  toEChartsOption: barToEChartsOption,
})

// ============================================================
// Percent Bar Chart (百分比堆叠柱状图)
// ============================================================

registerChart({
  type: ChartType.PERCENT_BAR,
  name: '百分比堆叠柱状图',
  enName: 'Percent Stacked Bar Chart',
  category: [ChartCategory.BAR],
  purpose: [ChartPurpose.PROPORTION, ChartPurpose.COMPARISON],
  description:
    '百分比堆叠柱状图将每个维度下的数值归一化为 100%, 清晰展示各部分的占比变化, 适合对比不同类别的结构差异。',
  coordinateSystem: CoordinateSystem.CARTESIAN,

  dataMappingMeta: PERCENT_BAR_DATA_MAPPING_META,
  configMeta: BAR_BASE_CONFIG_META,

  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'percent_bar',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'bottom' },
    label: { show: true, format: 'percentage' },
    xAxis: {
      name: { show: true, text: dataMapping.dimension as string },
      tick: { show: true },
    },
    yAxis: {
      name: { show: true, text: dataMapping.stackBy ?? '' },
      tick: { show: true },
    },
    grid: { show: false },
  }),

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_PERCENT_BAR_1',
      chartName: '季度产品销量占比',
      chartConfig: {
        version: 'v2',
        type: 'percent_bar',
        dataMapping: {
          dimension: 'quarter',
          metrics: [
            { field: '产品A', alias: '产品A' },
            { field: '产品B', alias: '产品B' },
            { field: '产品C', alias: '产品C' },
          ],
        },
        title: { text: '季度产品销量占比', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'bottom' },
        label: { show: true, format: 'percentage' },
        xAxis: { name: { show: true, text: '季度' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '占比' }, tick: { show: true } },
        grid: { show: false },
      } as BarChartConfig,
      chartFile: { content: STACKED_BAR_DEMO_DATA },
    },
  ],

  toEChartsOption: barToEChartsOption,
})
