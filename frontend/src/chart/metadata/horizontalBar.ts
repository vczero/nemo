/**
 * Horizontal Bar Chart Family Registration
 */
import { registerChart } from '../core/registry'
import { ChartType, ChartCategory, ChartPurpose, CoordinateSystem } from '../types'
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
  STACKED_BAR_DATA_MAPPING_META,
  PERCENT_BAR_DATA_MAPPING_META,
  TORNADO_DATA_MAPPING_META,
  BAR_DEMO_DATA,
  STACKED_BAR_DEMO_DATA,
  barToEChartsOption,
} from './barBase'

const BAR_BASE_CONFIG_META = [
  ...BASE_CONFIG_ITEMS,
  ...CARTESIAN_CONFIG_ITEMS,
  ...LEGEND_CONFIG_ITEMS,
  ...LABEL_CONFIG_ITEMS,
]

const BAR_HIGHLIGHT_CONFIG_META = [
  ...BAR_BASE_CONFIG_META,
  ...BAR_HIGHLIGHT_CONFIG_ITEMS,
]

// ============================================================
// Demo Data
// ============================================================

const TORNADO_DEMO_DATA = [
  ['ageGroup', 'male', 'female'],
  ['0-10', 500, 480],
  ['11-20', 620, 610],
  ['21-30', 850, 880],
  ['31-40', 1200, 1150],
  ['41-50', 1100, 1120],
  ['51-60', 900, 950],
  ['61-70', 700, 750],
  ['71+', 400, 500],
]

// ============================================================
// Horizontal Bar
// ============================================================

registerChart({
  type: ChartType.HORIZONTAL_BAR,
  name: '基础条形图',
  enName: 'Horizontal Bar Chart',
  category: [ChartCategory.HORIZONTAL_BAR],
  purpose: [ChartPurpose.COMPARISON, ChartPurpose.RANKING],
  description: '基础条形图将分类放在纵轴，数值放在横轴，适合展示类别名称较长的数据。',
  coordinateSystem: CoordinateSystem.CARTESIAN,
  dataMappingMeta: BAR_DATA_MAPPING_META,
  configMeta: BAR_HIGHLIGHT_CONFIG_META,
  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'horizontal_bar',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: false },
    label: { show: true },
    xAxis: { name: { show: true, text: dataMapping.metrics?.[0]?.alias ?? '' as string }, tick: { show: true } },
    yAxis: { name: { show: true, text: dataMapping.dimension ?? '' }, tick: { show: true } },
    grid: { show: false },
  }),
  demos: [
    {
      chartId: 'NAUTILAB_DEMO_HORIZONTAL_BAR_1',
      chartName: '城市气温条形图',
      chartConfig: {
        version: 'v2',
        type: 'horizontal_bar',
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
        xAxis: { name: { show: true, text: '气温(℃)' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '城市' }, tick: { show: true } },
        grid: { show: false },
      } as BarChartConfig,
      chartFile: { content: BAR_DEMO_DATA },
    },
  ],
  toEChartsOption: barToEChartsOption,
})

// ============================================================
// Stacked Horizontal Bar
// ============================================================

registerChart({
  type: ChartType.STACKED_HORIZONTAL_BAR,
  name: '堆叠条形图',
  enName: 'Stacked Horizontal Bar Chart',
  category: [ChartCategory.HORIZONTAL_BAR],
  purpose: [ChartPurpose.PROPORTION, ChartPurpose.COMPARISON],
  description: '堆叠条形图展示各部分在横向上的累积，方便对比总量和组成部分。',
  coordinateSystem: CoordinateSystem.CARTESIAN,
  dataMappingMeta: STACKED_BAR_DATA_MAPPING_META,
  configMeta: BAR_BASE_CONFIG_META,
  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ( {
    version: 'v2',
    type: ChartType.STACKED_HORIZONTAL_BAR,
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'bottom' },
    label: { show: true },
    xAxis: { name: { show: true, text: dataMapping.stackBy ?? '' as string }, tick: { show: true } },
    yAxis: { name: { show: true, text: dataMapping.dimension ?? '' as string }, tick: { show: true } },
    grid: { show: false },
  }),
  demos: [
    {
      chartId: 'NAUTILAB_DEMO_STACKED_HORIZONTAL_1',
      chartName: '季度销售堆叠条形图',
      chartConfig: {
        version: 'v2',
        type: ChartType.STACKED_HORIZONTAL_BAR,
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
        xAxis: { name: { show: true, text: '销量' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '季度' }, tick: { show: true } },
        grid: { show: false },
      } as BarChartConfig,
      chartFile: { content: STACKED_BAR_DEMO_DATA },
    },
  ],
  toEChartsOption: barToEChartsOption,
})

// ============================================================
// Grouped Horizontal Bar
// ============================================================

registerChart({
  type: ChartType.GROUPED_HORIZONTAL_BAR,
  name: '分组条形图',
  enName: 'Grouped Horizontal Bar Chart',
  category: [ChartCategory.HORIZONTAL_BAR],
  purpose: [ChartPurpose.COMPARISON],
  description: '分组条形图并排展示不同系列的条形，适合对比相同类别下不同指标的值。',
  coordinateSystem: CoordinateSystem.CARTESIAN,
  dataMappingMeta: GROUPED_BAR_DATA_MAPPING_META,
  configMeta: BAR_BASE_CONFIG_META,
  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'grouped_horizontal_bar',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'bottom' },
    label: { show: true },
    xAxis: { name: { show: true, text: dataMapping.stackBy ?? '' }, tick: { show: true } },
    yAxis: { name: { show: true, text: dataMapping.dimension as string }, tick: { show: true } },
    grid: { show: false },
  }),
  demos: [
    {
      chartId: 'NAUTILAB_DEMO_GROUPED_HORIZONTAL_1',
      chartName: '季度销售分组条形图',
      chartConfig: {
        version: 'v2',
        type: 'grouped_horizontal_bar',
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
        xAxis: { name: { show: true, text: '销量' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '季度' }, tick: { show: true } },
        grid: { show: false },
      } as BarChartConfig,
      chartFile: { content: STACKED_BAR_DEMO_DATA },
    },
  ],
  toEChartsOption: barToEChartsOption,
})

// ============================================================
// Percent Horizontal Bar
// ============================================================

registerChart({
  type: ChartType.PERCENT_HORIZONTAL_BAR,
  name: '百分比堆叠条形图',
  enName: 'Percent Horizontal Bar Chart',
  category: [ChartCategory.HORIZONTAL_BAR],
  purpose: [ChartPurpose.PROPORTION],
  description: '百分比堆叠条形图展示各部分占总量的比例，所有条形长度均为 100%。',
  coordinateSystem: CoordinateSystem.CARTESIAN,
  dataMappingMeta: PERCENT_BAR_DATA_MAPPING_META,
  configMeta: BAR_BASE_CONFIG_META,
  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ( {
    version: 'v2',
    type: 'percent_horizontal_bar',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'bottom' },
    label: { show: true, format: 'percentage' },
    xAxis: { name: { show: true, text: dataMapping.stackBy ?? '' as string }, tick: { show: true } },
    yAxis: { name: { show: true, text: dataMapping.dimension ?? '' as string }, tick: { show: true } },
    grid: { show: false },
  }),
  demos: [
    {
      chartId: 'NAUTILAB_DEMO_PERCENT_HORIZONTAL_1',
      chartName: '季度销售占比条形图',
      chartConfig: {
        version: 'v2',
        type: 'percent_horizontal_bar',
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
        xAxis: { name: { show: true, text: '占比' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '季度' }, tick: { show: true } },
        grid: { show: false },
      } as BarChartConfig,
      chartFile: { content: STACKED_BAR_DEMO_DATA },
    },
  ],
  toEChartsOption: barToEChartsOption,
})

// ============================================================
// Contrast Bar (对比条形图)
// ============================================================

registerChart({
  type: ChartType.TORNADO,
  name: '旋风图(金字塔图)',
  enName: 'Tornado Chart',
  category: [ChartCategory.TORNADO],
  purpose: [ChartPurpose.COMPARISON],
  description: '旋风图（通常称为人口金字塔图）将两个系列背靠背展示，适合对比两个相关指标（如男女比例）。',
  coordinateSystem: CoordinateSystem.CARTESIAN,
  dataMappingMeta: TORNADO_DATA_MAPPING_META,
  configMeta: BAR_BASE_CONFIG_META,
  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'tornado',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'bottom' },
    label: { show: true, format: 'decimal' },
    xAxis: { name: { show: true, text: 'value' as string }, tick: { show: true } },
    yAxis: { name: { show: true, text: dataMapping.dimension ?? '' as string }, tick: { show: true } },
    grid: { show: false },
  }),
  demos: [
    {
      chartId: 'NAUTILAB_DEMO_CONTRAST_BAR_1',
      chartName: '人口年龄分布对比',
      chartConfig: {
        version: 'v2',
        type: 'tornado',
        dataMapping: {
          dimension: 'ageGroup',
          metrics: [
            { field: 'male', alias: '男性' },
            { field: 'female', alias: '女性' },
          ],
        },
        title: { text: '人口年龄构成金字塔', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'bottom' },
        label: { show: true, format: 'decimal' },
        xAxis: { name: { show: true, text: '人数' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '年龄段' }, tick: { show: true } },
        grid: { show: false },
      } as BarChartConfig,
      chartFile: { content: TORNADO_DEMO_DATA },
    },
  ],
  toEChartsOption: barToEChartsOption,
})
