/**
 * Line Chart Family Registration
 *
 * 注册 line (基础折线图), smooth_line (平滑折线图),
 * area (基础面积图), multi_line (多条折线图),
 * multi_area (多条面积图) 和 step_line (阶梯折线图).
 * 共享同一个 transformer, 支持宽表和长表两种数据格式:
 *   - 宽表: 每个 metric 对应一个数据列, 直接映射为 series
 *   - 长表: 通过 stackBy 字段 pivot 为宽表, 每个分组值生成一个 series
 */
import { registerChart } from '../core/registry'
import {
  ChartType,
  ChartCategory,
  ChartPurpose,
  CoordinateSystem,
} from '../types'
import type { ChartConfig, LineChartConfig, DataTable, EChartsOptionInYWL } from '../types'
import {
  BASE_CONFIG_ITEMS,
  CARTESIAN_CONFIG_ITEMS,
  LEGEND_CONFIG_ITEMS,
  LABEL_CONFIG_ITEMS,
  LINE_CONFIG_ITEMS,
} from '../configItems'
import { getCachedPivot, clearPivotCache } from '../utils'

// ============================================================
// Shared: Line 家族的数据映射元信息
// ============================================================

/** 基础折线图 / 平滑折线图 / 面积图 / 阶梯折线图: 单 metric */
const LINE_DATA_MAPPING_META = {
  fields: [
    {
      key: 'dimension',
      label: '维度 (X轴)',
      required: true,
      fieldType: 'single' as const,
    },
    {
      key: 'metrics',
      label: '度量 (Y轴)',
      required: true,
      fieldType: 'multiple' as const,
      showAlias: true,
      showStack: false,
    },
  ],
}

/** 多条折线图: 支持多 metric 或 stackBy 长表 */
const MULTI_LINE_DATA_MAPPING_META = {
  fields: [
    {
      key: 'dimension',
      label: '维度 (X轴)',
      required: true,
      fieldType: 'single' as const,
    },
    {
      key: 'metrics',
      label: '度量 (Y轴)',
      required: true,
      fieldType: 'multiple' as const,
      showAlias: true,
      showStack: false,
    },
    {
      key: 'stackBy',
      label: '分组字段',
      required: false,
      fieldType: 'single' as const,
    },
  ],
}

/** 堆叠折线图 / 堆叠面积图: 支持多 metric 或 stackBy 长表, 可配置 stack 分组 */
const STACKED_LINE_DATA_MAPPING_META = {
  fields: [
    {
      key: 'dimension',
      label: '维度 (X轴)',
      required: true,
      fieldType: 'single' as const,
    },
    {
      key: 'metrics',
      label: '度量 (Y轴)',
      required: true,
      fieldType: 'multiple' as const,
      showAlias: true,
      showStack: true,
      metricDefaults: { stack: 'total' },
    },
    {
      key: 'stackBy',
      label: '堆叠字段',
      required: false,
      fieldType: 'single' as const,
    },
  ],
}

// ============================================================
// Shared: Line 家族配置项
// ============================================================

/** 基础配置 — 所有 line 类型共享 */
const LINE_BASE_CONFIG_META = [
  ...BASE_CONFIG_ITEMS,
  ...CARTESIAN_CONFIG_ITEMS,
  ...LEGEND_CONFIG_ITEMS,
  ...LABEL_CONFIG_ITEMS,
]

/** 含折线特有配置 (smooth, areaStyle, step) */
const LINE_FULL_CONFIG_META = [...LINE_BASE_CONFIG_META, ...LINE_CONFIG_ITEMS]

// ============================================================
// Shared: Line Transformer
// ============================================================

/**
 * Line 家族通用 transformer.
 *
 * 根据图表类型自动设置:
 *   - smooth: smooth_line 默认开启平滑
 *   - areaStyle: area / stacked_area 默认开启面积填充
 *   - stack: stacked_line / stacked_area 默认强制堆叠
 *   - step: step_line 默认使用 'start' 阶梯
 *
 * 模式1 — 宽表 (无 stackBy):
 *   每个 metric 直接生成一个 series.
 *
 * 模式2 — 长表 (有 stackBy):
 *   数据按 stackBy 字段 pivot 成宽表, 每个分组值生成一个 series.
 */
function lineToEChartsOption(
  config: ChartConfig,
  data: DataTable,
  baseOption: EChartsOptionInYWL
): EChartsOptionInYWL {
  const lineConfig = config as LineChartConfig
  const { dimension, metrics, stackBy } = lineConfig.dataMapping
  const chartSetting = lineConfig.chartSetting ?? {}

  // 根据图表类型推导默认值
  const isSmooth = chartSetting.smooth ?? config.type === 'smooth_line'
  const isArea =
    chartSetting.areaStyle ?? ['area', 'stacked_area'].includes(config.type)
  const stepValue =
    chartSetting.step ?? (config.type === 'step_line' ? 'start' : false)
  const symbol = !!chartSetting.symbol
  const isStacked = ['stacked_line', 'stacked_area'].includes(config.type)

  // 构建 series 通用属性
  const seriesBase: Record<string, unknown> = {
    type: 'line' as const,
    smooth: isSmooth,
    ...(isArea ? { areaStyle: {} } : {}),
    ...(stepValue ? { step: stepValue } : {}),
  }

  const symbols = [
    'circle',
    'rect',
    'triangle',
    'emptyRect',
    'emptyCircle',
    'emptyTriangle',
    'diamond',
    'roundRect',
    'pin',
    'arrow',
  ]

  // xAxis/yAxis 默认 category/value, 与 buildBaseOption 一致, 无需修改

  // ── 长表模式 (stackBy) ──
  if (stackBy && metrics.length > 0) {
    const valueField = metrics[0].field
    const stack = metrics[0].stack
    const seriesStack = isStacked ? 'total' : stack
    const { pivotedData, groups } = getCachedPivot(
      data,
      dimension,
      stackBy,
      valueField
    )

    baseOption.dataset = { source: pivotedData }
    baseOption.series = groups.map((group, index) => ({
      ...seriesBase,
      name: group,
      encode: { x: dimension, y: group },
      ...(seriesStack ? { stack: seriesStack } : {}),
      ...(symbol
        ? { symbol: symbols[index % symbols.length], symbolSize: 10 }
        : {}),
    }))

    return baseOption
  }

  // ── 宽表模式 (无 stackBy) ──
  baseOption.dataset = { source: data }
  baseOption.series = metrics.map((m, index) => ({
    ...seriesBase,
    name: m.alias ?? m.field,
    encode: { x: dimension, y: m.field },
    ...(isStacked ? { stack: 'total' } : m.stack ? { stack: m.stack } : {}),
    ...(symbol
      ? { symbol: symbols[index % symbols.length], symbolSize: 10 }
      : {}),
  }))

  if (config.xAxis?.tick?.show === false && config.label?.show === true && baseOption.xAxis) {
    baseOption.xAxis.axisLabel = {
      show: true,
      fontSize: 0,
      color: 'transparent',
      interval: config.xAxis?.tick?.interval,
    }
    baseOption.xAxis.nameGap = 0
  }
  return baseOption
}

// ============================================================
// Demo: 内联数据
// ============================================================

/** 基础折线图 demo — 单指标时间序列 */
const LINE_DEMO_DATA = [
  ['month', 'value'],
  ['1月', 820],
  ['2月', 932],
  ['3月', 901],
  ['4月', 934],
  ['5月', 1290],
  ['6月', 1330],
  ['7月', 1320],
  ['8月', 1100],
  ['9月', 980],
  ['10月', 1050],
  ['11月', 1120],
  ['12月', 1200],
]

/** 多条折线图 demo — 宽表 (多个度量列) */
const MULTI_LINE_DEMO_DATA = [
  ['month', 'email', 'unionAds', 'videoAds'],
  ['1月', 120, 220, 150],
  ['2月', 132, 182, 232],
  ['3月', 101, 191, 201],
  ['4月', 134, 234, 154],
  ['5月', 90, 290, 190],
  ['6月', 230, 330, 330],
  ['7月', 210, 310, 410],
]

/** 多条折线图 demo — 宽表 (tidy data) */
const MULTI_LINE_WIDE_DEMO_DATA = [
  ['quarter', '邮件营销', '联盟广告', '视频广告'],
  ['Q1', 120, 220, 150],
  ['Q2', 132, 182, 232],
  ['Q3', 101, 191, 201],
  ['Q4', 134, 234, 154],
]

// ============================================================
// Line Chart (基础折线图)
// ============================================================

registerChart({
  type: ChartType.LINE,
  name: '基础折线图',
  enName: 'Line Chart',
  category: [ChartCategory.LINE],
  purpose: [ChartPurpose.TREND],
  description:
    '基础折线图用折线连接各数据点, 展示数据随时间或有序类别的变化趋势, 适合观察连续变化和走势。',
  coordinateSystem: CoordinateSystem.CARTESIAN,

  dataMappingMeta: LINE_DATA_MAPPING_META,
  configMeta: LINE_FULL_CONFIG_META,

  defaultConfig: {
    version: 'v2',
    type: 'line',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: false },
    label: { show: true },
    xAxis: { name: { show: true }, tick: { show: true } },
    yAxis: { name: { show: true }, tick: { show: true } },
    grid: { show: false },
  },

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_LINE_1',
      chartName: '月度访问量',
      chartConfig: {
        version: 'v2',
        type: 'line',
        dataMapping: {
          dimension: 'month',
          metrics: [{ field: 'value', alias: '访问量' }],
        },
        title: { text: '月度网站访问量', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
        label: { show: true },
        xAxis: { name: { show: true, text: '月份' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '访问量' }, tick: { show: true } },
        grid: { show: false },
      } as LineChartConfig,
      chartFile: { content: LINE_DEMO_DATA },
    },
  ],

  toEChartsOption: lineToEChartsOption,
  destroy: () => {
    clearPivotCache()
  },
})

// ============================================================
// Smooth Line Chart (平滑折线图)
// ============================================================

registerChart({
  type: ChartType.SMOOTH_LINE,
  name: '平滑折线图',
  enName: 'Smooth Line Chart',
  category: [ChartCategory.LINE],
  purpose: [ChartPurpose.TREND],
  description:
    '平滑折线图使用贝塞尔曲线连接数据点, 线条更加平滑美观, 适合展示自然变化过程和整体趋势。',
  coordinateSystem: CoordinateSystem.CARTESIAN,

  dataMappingMeta: LINE_DATA_MAPPING_META,
  configMeta: LINE_FULL_CONFIG_META,

  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'smooth_line',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: false },
    label: { show: true },
    xAxis: {
      name: { show: true, text: dataMapping.dimension ?? ('' as string) },
      tick: { show: true },
    },
    yAxis: {
      name: {
        show: true,
        text: dataMapping.metrics?.[0]?.alias ?? ('' as string),
      },
      tick: { show: true },
    },
    grid: { show: false },
    chartSetting: { smooth: true },
  }),

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_SMOOTH_LINE_1',
      chartName: '月度访问量 (平滑)',
      chartConfig: {
        version: 'v2',
        type: 'smooth_line',
        dataMapping: {
          dimension: 'month',
          metrics: [{ field: 'value', alias: '访问量' }],
        },
        title: { text: '月度网站访问量 (平滑)', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
        label: { show: true },
        xAxis: { name: { show: true, text: '月份' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '访问量' }, tick: { show: true } },
        grid: { show: false },
        chartSetting: { smooth: true },
      } as LineChartConfig,
      chartFile: { content: LINE_DEMO_DATA },
    },
  ],

  toEChartsOption: lineToEChartsOption,
  destroy: () => {
    clearPivotCache()
  },
})

// ============================================================
// Area Chart (基础面积图)
// ============================================================

registerChart({
  type: ChartType.AREA,
  name: '基础面积图',
  enName: 'Area Chart',
  category: [ChartCategory.LINE],
  purpose: [ChartPurpose.TREND, ChartPurpose.COMPARISON],
  description:
    '基础面积图在折线下方填充颜色, 更直观地展示数据的累积量和变化幅度, 适合强调数据的量感和趋势。',
  coordinateSystem: CoordinateSystem.CARTESIAN,

  dataMappingMeta: LINE_DATA_MAPPING_META,
  configMeta: LINE_FULL_CONFIG_META,

  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'area',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: false },
    label: { show: true },
    xAxis: {
      name: { show: true, text: dataMapping.dimension ?? ('' as string) },
      tick: { show: true },
    },
    yAxis: {
      name: {
        show: true,
        text: dataMapping.metrics?.[0]?.alias ?? ('' as string),
      },
      tick: { show: true },
    },
    grid: { show: false },
    chartSetting: { areaStyle: true },
  }),

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_AREA_1',
      chartName: '月度访问量 (面积)',
      chartConfig: {
        version: 'v2',
        type: 'area',
        dataMapping: {
          dimension: 'month',
          metrics: [{ field: 'value', alias: '访问量' }],
        },
        title: { text: '月度网站访问量', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
        label: { show: true },
        xAxis: { name: { show: true, text: '月份' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '访问量' }, tick: { show: true } },
        grid: { show: false },
        chartSetting: { areaStyle: true },
      } as LineChartConfig,
      chartFile: { content: LINE_DEMO_DATA },
    },
  ],

  toEChartsOption: lineToEChartsOption,
  destroy: () => {
    clearPivotCache()
  },
})

// ============================================================
// Multi-Line Chart (多条折线图)
// ============================================================

registerChart({
  type: ChartType.MULTI_LINE,
  name: '多条折线图',
  enName: 'Multi-Line Chart',
  category: [ChartCategory.LINE],
  purpose: [ChartPurpose.TREND, ChartPurpose.COMPARISON],
  description:
    '多条折线图在同一坐标系中绘制多条折线, 适合对比多个系列数据在相同维度下的变化趋势和差异。',
  coordinateSystem: CoordinateSystem.CARTESIAN,

  dataMappingMeta: MULTI_LINE_DATA_MAPPING_META,
  configMeta: LINE_FULL_CONFIG_META,

  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'multi_line',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'bottom' },
    label: { show: true },
    chartSetting: { symbol: true },
    xAxis: {
      name: { show: true, text: dataMapping.dimension ?? ('' as string) },
      tick: { show: true },
    },
    yAxis: {
      name: { show: true, text: dataMapping.stackBy ?? ('' as string) },
      tick: { show: true },
    },
    grid: { show: false },
  }),

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_MULTI_LINE_1',
      chartName: '多渠道流量趋势 (宽表)',
      chartConfig: {
        version: 'v2',
        type: 'multi_line',
        dataMapping: {
          dimension: 'month',
          metrics: [
            { field: 'email', alias: '邮件营销' },
            { field: 'unionAds', alias: '联盟广告' },
            { field: 'videoAds', alias: '视频广告' },
          ],
        },
        title: { text: '多渠道流量趋势', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'bottom' },
        label: { show: true },
        xAxis: { name: { show: true, text: '月份' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '访问量' }, tick: { show: true } },
        grid: { show: false },
        chartSetting: { symbol: true },
      } as LineChartConfig,
      chartFile: { content: MULTI_LINE_DEMO_DATA },
    },
    {
      chartId: 'NAUTILAB_DEMO_MULTI_LINE_2',
      chartName: '季度渠道流量趋势 (宽表)',
      chartConfig: {
        version: 'v2',
        type: 'multi_line',
        dataMapping: {
          dimension: 'quarter',
          metrics: [
            { field: '邮件营销', alias: '邮件营销' },
            { field: '联盟广告', alias: '联盟广告' },
            { field: '视频广告', alias: '视频广告' },
          ],
        },
        title: { text: '季度渠道流量对比', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'bottom' },
        label: { show: true },
        xAxis: { name: { show: true, text: '季度' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '访问量' }, tick: { show: true } },
        grid: { show: false },
      } as LineChartConfig,
      chartFile: { content: MULTI_LINE_WIDE_DEMO_DATA },
    },
  ],

  toEChartsOption: lineToEChartsOption,
  destroy: () => {
    clearPivotCache()
  },
})

// ============================================================
// Stacked Line Chart (堆叠折线图)
// ============================================================

registerChart({
  type: ChartType.STACKED_LINE,
  name: '堆叠折线图',
  enName: 'Stacked Line Chart',
  category: [ChartCategory.LINE],
  purpose: [ChartPurpose.TREND, ChartPurpose.PROPORTION],
  description:
    '堆叠折线图将多条折线的数值依次累加, 展示各部分对整体的贡献及其变化趋势, 适合分析各组成部分随时间的增长情况。',
  coordinateSystem: CoordinateSystem.CARTESIAN,

  dataMappingMeta: STACKED_LINE_DATA_MAPPING_META,
  configMeta: LINE_FULL_CONFIG_META,

  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'stacked_line',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'bottom' },
    label: { show: true },
    xAxis: {
      name: { show: true, text: dataMapping.dimension ?? ('' as string) },
      tick: { show: true },
    },
    yAxis: {
      name: { show: true, text: dataMapping.stackBy ?? ('' as string) },
      tick: { show: true },
    },
    grid: { show: false },
  }),

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_STACKED_LINE_1',
      chartName: '多渠道流量堆叠 (宽表)',
      chartConfig: {
        version: 'v2',
        type: 'stacked_line',
        dataMapping: {
          dimension: 'month',
          metrics: [
            { field: 'email', alias: '邮件营销', stack: 'total' },
            { field: 'unionAds', alias: '联盟广告', stack: 'total' },
            { field: 'videoAds', alias: '视频广告', stack: 'total' },
          ],
        },
        title: { text: '多渠道流量堆叠', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'bottom' },
        label: { show: true },
        xAxis: { name: { show: true, text: '月份' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '访问量' }, tick: { show: true } },
        grid: { show: false },
      } as LineChartConfig,
      chartFile: { content: MULTI_LINE_DEMO_DATA },
    },
    {
      chartId: 'NAUTILAB_DEMO_STACKED_LINE_2',
      chartName: '季度渠道流量堆叠 (宽表)',
      chartConfig: {
        version: 'v2',
        type: 'stacked_line',
        dataMapping: {
          dimension: 'quarter',
          metrics: [
            { field: '邮件营销', alias: '邮件营销', stack: 'total' },
            { field: '联盟广告', alias: '联盟广告', stack: 'total' },
            { field: '视频广告', alias: '视频广告', stack: 'total' },
          ],
        },
        title: { text: '季度渠道流量堆叠', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'bottom' },
        label: { show: true },
        xAxis: { name: { show: true, text: '季度' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '访问量' }, tick: { show: true } },
        grid: { show: false },
      } as LineChartConfig,
      chartFile: { content: MULTI_LINE_WIDE_DEMO_DATA },
    },
  ],

  toEChartsOption: lineToEChartsOption,
  destroy: () => {
    clearPivotCache()
  },
})

// ============================================================
// Stacked Area Chart (堆叠面积图)
// ============================================================

registerChart({
  type: ChartType.STACKED_AREA,
  name: '堆叠面积图',
  enName: 'Stacked Area Chart',
  category: [ChartCategory.LINE],
  purpose: [ChartPurpose.TREND, ChartPurpose.PROPORTION],
  description:
    '堆叠面积图在堆叠折线的基础上填充颜色, 更直观地展示各部分的量感和累积效果, 适合展示整体趋势及其组成结构。',
  coordinateSystem: CoordinateSystem.CARTESIAN,

  dataMappingMeta: STACKED_LINE_DATA_MAPPING_META,
  configMeta: LINE_FULL_CONFIG_META,

  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'stacked_area',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'bottom' },
    label: { show: true },
    xAxis: {
      name: { show: true, text: dataMapping.dimension ?? ('' as string) },
      tick: { show: true },
    },
    yAxis: {
      name: { show: true, text: dataMapping.stackBy ?? ('' as string) },
      tick: { show: true },
    },
    grid: { show: false },
    chartSetting: { areaStyle: true },
  }),

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_STACKED_AREA_1',
      chartName: '多渠道流量堆叠面积 (宽表)',
      chartConfig: {
        version: 'v2',
        type: 'stacked_area',
        dataMapping: {
          dimension: 'month',
          metrics: [
            { field: 'email', alias: '邮件营销', stack: 'total' },
            { field: 'unionAds', alias: '联盟广告', stack: 'total' },
            { field: 'videoAds', alias: '视频广告', stack: 'total' },
          ],
        },
        title: { text: '多渠道流量堆叠面积', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'bottom' },
        label: { show: true },
        xAxis: { name: { show: true, text: '月份' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '访问量' }, tick: { show: true } },
        grid: { show: false },
        chartSetting: { areaStyle: true },
      } as LineChartConfig,
      chartFile: { content: MULTI_LINE_DEMO_DATA },
    },
    {
      chartId: 'NAUTILAB_DEMO_STACKED_AREA_2',
      chartName: '季度渠道堆叠面积 (宽表)',
      chartConfig: {
        version: 'v2',
        type: 'stacked_area',
        dataMapping: {
          dimension: 'quarter',
          metrics: [
            { field: '邮件营销', alias: '邮件营销', stack: 'total' },
            { field: '联盟广告', alias: '联盟广告', stack: 'total' },
            { field: '视频广告', alias: '视频广告', stack: 'total' },
          ],
        },
        title: { text: '季度渠道流量堆叠面积', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'bottom' },
        label: { show: true },
        xAxis: { name: { show: true, text: '季度' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '访问量' }, tick: { show: true } },
        grid: { show: false },
        chartSetting: { areaStyle: true },
      } as LineChartConfig,
      chartFile: { content: MULTI_LINE_WIDE_DEMO_DATA },
    },
  ],

  toEChartsOption: lineToEChartsOption,
  destroy: () => {
    clearPivotCache()
  },
})

// ============================================================
// Step Line Chart (阶梯折线图)
// ============================================================

registerChart({
  type: ChartType.STEP_LINE,
  name: '阶梯折线图',
  enName: 'Step Line Chart',
  category: [ChartCategory.LINE],
  purpose: [ChartPurpose.TREND],
  description:
    '阶梯折线图用水平和垂直的阶梯线连接数据点, 强调数据在各区间内保持不变, 适合展示离散变化或分段计费等场景。',
  coordinateSystem: CoordinateSystem.CARTESIAN,

  dataMappingMeta: LINE_DATA_MAPPING_META,
  configMeta: LINE_FULL_CONFIG_META,

  defaultConfig: (_: DataTable, dataMapping: Record<string, any> = {}) => ({
    version: 'v2',
    type: 'step_line',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: false },
    label: { show: true },
    xAxis: {
      name: { show: true, text: dataMapping.dimension ?? ('' as string) },
      tick: { show: true },
    },
    yAxis: {
      name: {
        show: true,
        text: dataMapping.metrics?.[0]?.alias ?? ('' as string),
      },
      tick: { show: true },
    },
    grid: { show: false },
    chartSetting: { step: 'start' },
  }),

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_STEP_LINE_1',
      chartName: '月度访问量 (阶梯)',
      chartConfig: {
        version: 'v2',
        type: 'step_line',
        dataMapping: {
          dimension: 'month',
          metrics: [{ field: 'value', alias: '访问量' }],
        },
        title: { text: '月度网站访问量 (阶梯)', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
        label: { show: true },
        xAxis: { name: { show: true, text: '月份' }, tick: { show: true } },
        yAxis: { name: { show: true, text: '访问量' }, tick: { show: true } },
        grid: { show: false },
        chartSetting: { step: 'start' },
      } as LineChartConfig,
      chartFile: { content: LINE_DEMO_DATA },
    },
  ],

  toEChartsOption: lineToEChartsOption,
  destroy: () => {
    clearPivotCache()
  },
})
