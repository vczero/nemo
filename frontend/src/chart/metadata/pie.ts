/**
 * Pie Chart Family Registration
 *
 * 注册 pie (基础饼图), donut (普通环形图), rounded_donut (圆角环形图).
 * 饼图使用 nameField + valueField 映射, 不依赖笛卡尔坐标系.
 *
 * 标签逻辑由饼图 transformer 自行处理 (不使用公共 transformer 的 label 覆盖),
 * 支持:
 *   - 显示名称标签 (chartSetting.showLabelName)
 *   - 显示数据值 (label.show + label.format, 复用 LabelConfig 组件)
 *   - 标签位置 (chartSetting.labelPosition: inside / outside)
 *
 * 环形图额外支持:
 *   - 中心显示标题 (chartSetting.centerTitle)
 *   - 圆角环形图: 扇区圆角 + 扇区间隙 (padAngle + borderRadius, 由图表类型自动设定)
 */
import { registerChart } from '../core/registry'
import { ChartType, ChartCategory, ChartPurpose, CoordinateSystem,  } from '../types'
import type { ChartConfig, PieChartConfig, DataTable, EChartsOptionInYWL } from '../types'
import {
  BASE_CONFIG_ITEMS,
  LEGEND_CONFIG_ITEMS,
  LABEL_CONFIG_ITEMS,
  NAME_LABEL_CONFIG_ITEMS,
  PIE_TITLE_POSITION_CONFIG_ITEMS,
  PIE_STYLE_CONFIG_ITEMS,
  PIE_CONFIG_ITEMS,
} from '../configItems'
import { formatValue } from '../utils'

// ============================================================
// Shared: Pie 家族的数据映射元信息
// ============================================================

const PIE_DATA_MAPPING_META = {
  fields: [
    { key: 'nameField', label: '名称字段', required: true, fieldType: 'single' as const },
    { key: 'valueField', label: '数值字段', required: true, fieldType: 'single' as const },
  ],
}

// ============================================================
// Shared: Pie 家族配置项
// ============================================================

/** 基础饼图配置项 */
const PIE_BASE_CONFIG_META = [
  ...BASE_CONFIG_ITEMS,
  ...LEGEND_CONFIG_ITEMS,
  ...LABEL_CONFIG_ITEMS,
  ...NAME_LABEL_CONFIG_ITEMS,
  ...PIE_STYLE_CONFIG_ITEMS,
  ...PIE_CONFIG_ITEMS,
]

/** 环形图配置项 — 多出 "中心显示标题" */
const DONUT_CONFIG_META = [
  ...BASE_CONFIG_ITEMS,
  ...PIE_TITLE_POSITION_CONFIG_ITEMS,
  ...LEGEND_CONFIG_ITEMS,
  ...LABEL_CONFIG_ITEMS,
  ...NAME_LABEL_CONFIG_ITEMS,
  ...PIE_STYLE_CONFIG_ITEMS,
  ...PIE_CONFIG_ITEMS,
]

// ============================================================
// Label Helpers
// ============================================================


/**
 * 构建饼图标签配置.
 *
 * 组合 chartSetting (showLabelName, labelPosition) 和 label (show, format) 生成完整的
 * ECharts series.label 对象. 当 showLabelName 和 label.show 均为 false 时返回 { show: false }.
 */
function buildPieLabelOption(config: PieChartConfig): Record<string, unknown> {
  const showName = config.chartSetting?.showLabelName ?? false
  const showValue = config.label?.show ?? false
  const position = config.label?.position ?? 'outside'
  const format = config.label?.format

  // 都不显示 → 隐藏标签
  if (!showName && !showValue) {
    return { show: false }
  }

  // 构建 formatter
  const formatter = (params: { name?: string; value?: number; percent?: number }) => {
    const parts: string[] = []
    if (showName && params.name) {
      parts.push(params.name)
    }
    if (showValue && params.value != null) {
      parts.push(formatValue(Number(params.value), format))
    }
    return parts.join('\n')
  }

  return {
    show: true,
    position,
    formatter,
    fontSize: config.fontSize ?? 12,
  }
}

// ============================================================
// Shared: Pie Transformer
// ============================================================

/**
 * Pie 家族通用 transformer.
 *
 * 将 PieChartConfig 转换为 ECharts pie series 配置.
 * 数据通过 dataset + encode 映射 nameField / valueField.
 *
 * 标签由 buildPieLabelOption 完整生成, 设置在 series 上,
 * 公共 transformer 不会再覆盖 (series 已有 label 时跳过).
 */
function pieToEChartsOption(
  config: ChartConfig,
  data: DataTable,
  baseOption: EChartsOptionInYWL,
): EChartsOptionInYWL {
  const pieConfig = config as PieChartConfig
  const { nameField, valueField } = pieConfig.dataMapping
  const chartSetting = pieConfig.chartSetting ?? {}
  const isRoundedDonut = config.type === 'rounded_donut'
  const format = config.label?.format ?? 'decimal'

  // 饼图不使用笛卡尔坐标系
  delete baseOption.xAxis
  delete baseOption.yAxis
  delete baseOption.grid

  // 标题位置: center → 直接修改 baseOption.title 定位
  if (chartSetting.titlePosition === 'center') {
    const title = baseOption.title as Record<string, unknown>
    title.left = 'center'
    title.top = 'center'
  }

  // 半径
  const outerRadius = chartSetting.radius ?? 75
  const innerRadius = chartSetting.innerRadius ?? 0
  const radius = innerRadius > 0
    ? [`${innerRadius}%`, `${outerRadius}%`]
    : `${outerRadius}%`

  // 南丁格尔玫瑰图
  const roseType = chartSetting.roseType && chartSetting.roseType !== ('false' as unknown)
    ? chartSetting.roseType
    : undefined

  // 标签 (饼图自行处理, 不由公共 post-process 覆盖)
  const label = buildPieLabelOption(pieConfig)

  // 扇区样式
  const itemStyle: Record<string, unknown> = {}
  if (chartSetting.showBorder) {
    itemStyle.borderColor = '#fff'
    itemStyle.borderWidth = 1
  }
  if (isRoundedDonut) {
    itemStyle.borderRadius = 10
    itemStyle.borderColor = '#fff'
    itemStyle.borderWidth = 2
  }

  // 圆角环形图: 扇区间隙角度
  const padAngle = isRoundedDonut ? 5 : undefined

  // 转换数据为 ECharts pie 需要的 { name, value } 格式
  // Find indices
  const header = data[0] as string[]
  const nameIdx = header.indexOf(nameField)
  const valIdx = header.indexOf(valueField)

  const seriesData: { name: string; value: number }[] = []
  if (nameIdx !== -1 && valIdx !== -1) {
    if (format === 'percentage') {
      const total = data.reduce((sum, row) => sum + Number(row[valIdx]) || 0, 0.000000001)
      for(let i=1; i<data.length; i++) {
        const row = data[i]
        seriesData.push({
          name: String(row[nameIdx] ?? ''),
          value: Number((((Number(row[valIdx]) || 0) / total) * 100).toFixed(2))
        })
      }
    } else {
      for(let i=1; i<data.length; i++) {
          const row = data[i]
          seriesData.push({
              name: String(row[nameIdx] ?? ''),
              value: Number(row[valIdx]) || 0
          })
      }
    }
  }

  baseOption.series = [
    {
      type: 'pie' as const,
      radius,
      data: seriesData,
      label,
      ...(Object.keys(itemStyle).length > 0 ? { itemStyle } : {}),
      ...(padAngle ? { padAngle } : {}),
      ...(roseType ? { roseType } : {}),
    },
  ]

  return baseOption
}

// ============================================================
// Demo: 内联数据
// ============================================================

const PIE_DEMO_DATA = [
  ['category', 'count'],
  ['直接访问', 335],
  ['邮件营销', 310],
  ['联盟广告', 234],
  ['视频广告', 135],
  ['搜索引擎', 1548],
]

// ============================================================
// Pie Chart (基础饼图)
// ============================================================

registerChart({
  type: ChartType.PIE,
  name: '基础饼图',
  enName: 'Pie Chart',
  category: [ChartCategory.PIE],
  purpose: [ChartPurpose.PROPORTION],
  description:
    '基础饼图通过扇形面积展示各部分占整体的比例关系, 适合展示分类数据的构成和占比。',
  coordinateSystem: CoordinateSystem.NONE,

  dataMappingMeta: PIE_DATA_MAPPING_META,
  configMeta: PIE_BASE_CONFIG_META,

  defaultConfig: {
    version: 'v2',
    type: 'pie',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'bottom' },
    label: { show: true },
    chartSetting: {
      radius: 30,
      innerRadius: 0,
      showLabelName: true,
    },
  },

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_PIE_1',
      chartName: '流量来源占比',
      chartConfig: {
        version: 'v2',
        type: 'pie',
        dataMapping: {
          nameField: 'category',
          valueField: 'count',
        },
        title: { text: '网站流量来源占比', show: true },
        size: { width: 440, height: 280 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'bottom' },
        label: { show: true, format: 'decimal' },
        chartSetting: {
          radius: 30,
          innerRadius: 0,
          showLabelName: true,
          labelPosition: 'outside',
        },
      } as PieChartConfig,
      chartFile: { content: PIE_DEMO_DATA },
    },
  ],

  toEChartsOption: pieToEChartsOption,
})

// ============================================================
// Donut Chart (普通环形图)
// ============================================================

registerChart({
  type: ChartType.DONUT,
  name: '环形图',
  enName: 'Donut Chart',
  category: [ChartCategory.DONUT],
  purpose: [ChartPurpose.PROPORTION],
  description:
    '环形图是饼图的变体, 中间留空形成圆环, 可在中心展示汇总信息, 适合强调整体与部分的关系。',
  coordinateSystem: CoordinateSystem.NONE,

  dataMappingMeta: PIE_DATA_MAPPING_META,
  configMeta: DONUT_CONFIG_META,

  defaultConfig: {
    version: 'v2',
    type: 'donut',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'bottom' },
    label: { show: true },
    chartSetting: {
      radius: 75,
      innerRadius: 45,
      showLabelName: true,
      titlePosition: 'top',
    },
  },

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_DONUT_1',
      chartName: '流量来源环形图',
      chartConfig: {
        version: 'v2',
        type: 'donut',
        dataMapping: {
          nameField: 'category',
          valueField: 'count',
        },
        title: { text: '网站流量来源', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'bottom' },
        label: { show: true, format: 'decimal' },
        chartSetting: {
          radius: 75,
          innerRadius: 45,
          showLabelName: true,
          titlePosition: 'top',
        },
      } as PieChartConfig,
      chartFile: { content: PIE_DEMO_DATA },
    },
  ],

  toEChartsOption: pieToEChartsOption,
})

// ============================================================
// Rounded Donut Chart (圆角环形图)
// ============================================================

registerChart({
  type: ChartType.ROUNDED_DONUT,
  name: '圆角环形图',
  enName: 'Rounded Donut Chart',
  category: [ChartCategory.DONUT],
  purpose: [ChartPurpose.PROPORTION],
  description:
    '圆角环形图在环形图基础上为扇区添加圆角和间隙, 视觉更加现代精致, 适合仪表盘和数据报告。',
  coordinateSystem: CoordinateSystem.NONE,

  dataMappingMeta: PIE_DATA_MAPPING_META,
  configMeta: DONUT_CONFIG_META,

  defaultConfig: {
    version: 'v2',
    type: 'rounded_donut',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'bottom' },
    label: { show: true, position: 'outside' },
    chartSetting: {
      radius: 75,
      innerRadius: 45,
      showLabelName: true,
      titlePosition: 'top',
    },
  },

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_ROUNDED_DONUT_1',
      chartName: '流量来源圆角环形图',
      chartConfig: {
        version: 'v2',
        type: 'rounded_donut',
        dataMapping: {
          nameField: 'category',
          valueField: 'count',
        },
        title: { text: '网站流量来源', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'bottom' },
        label: { show: true, format: 'decimal', position: 'outside' },
        chartSetting: {
          radius: 75,
          innerRadius: 45,
          showLabelName: true,
          titlePosition: 'top',
        },
      } as PieChartConfig,
      chartFile: { content: PIE_DEMO_DATA },
    },
  ],

  toEChartsOption: pieToEChartsOption,
})