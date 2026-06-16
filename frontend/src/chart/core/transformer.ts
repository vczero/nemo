/**
 * Config → ECharts Option Transformer
 *
 * 三阶段管线:
 *   1. buildBaseOption  — 从 BaseChartConfig 构建公共配置 (title, axis, legend, grid, color)
 *   2. chartDef.toEChartsOption — 图表特有逻辑, 接收 baseOption 并就地修改/覆盖
 *   3. applyCommonLabels — 对未自行处理 label 的 series 应用公共数据标签
 *
 * 图表拥有最终决定权: 公共层只提供默认值, 图表可以覆盖任何属性.
 */
import type {
  EChartsOption,
  LabelFormatterCallback,
  LabelLayoutOptionCallbackParams,
} from 'echarts'
import type { ChartConfig, DataTable, EChartsOptionInYWL } from '../types'
import { getChartDefinition } from './registry'
import { isColorString, isObject } from '@/utils/utils'
import { formatValue, formatAxisLabel } from '../utils'

// ============================================================
// Label helpers
// ============================================================
/**
 * 根据 format 类型构建 ECharts label.formatter 回调.
 * 支持 dataset 模式 (source 为对象数组 + encode 映射) 和普通模式.
 */
const buildLabelFormatter = (
  format: string,
  _: ChartConfig
): LabelFormatterCallback | undefined => {
  if (!format || format === 'decimal') return undefined

  return (params: Parameters<LabelFormatterCallback>[0]) => {
    // Dataset 模式: params.value 是数据行对象, 需通过 encode 定位数值维度
    // 普通模式: params.value 直接就是数值

    const { value, encode, dimensionNames } = params

    // 辅助函数：根据维度索引获取具体的值
    const getValueByDimIndex = (dimIndex: number) => {
      // 场景1：value 是数字
      let targetValue = null
      if (typeof value === 'number') {
        targetValue = value
      }

      // 场景2：dataset 是数组 (e.g. ["0-4", -100])
      if (Array.isArray(value)) {
        targetValue = value[dimIndex]
      }
      // 场景3：dataset 是对象 (e.g. { age: "0-4", male: -100 })
      // 需要通过 dimensionNames 将索引转换为 key
      if (value && isObject(value) && dimensionNames) {
        const key = dimensionNames?.[dimIndex]
        targetValue = value?.[key as keyof typeof value] ?? null
      }

      return Number(targetValue)
    }

    // 1. 获取映射到 X 轴和 Y 轴的数据值
    // encode.x 和 encode.y 都是数组，通常取第一个元素 [0]

    const xVal = getValueByDimIndex(encode?.x?.[0] ?? -1)
    const yVal = getValueByDimIndex(encode?.y?.[0] ?? -1)

    // 2. 智能判断：谁是数字，就格式化谁
    let targetValue

    if (typeof xVal === 'number' && !Number.isNaN(xVal)) {
      targetValue = xVal
    } else if (typeof yVal === 'number' && !Number.isNaN(yVal)) {
      targetValue = yVal
    } else {
      targetValue = 0
    }

    // ── 格式化 ──
    return formatValue(targetValue, format)
  }
}

/**
 * 从 config.label 构建 ECharts series.label 配置对象.
 * 返回 undefined 表示不需要设置 label (show=false 或无配置).
 */
function buildLabelOption(
  config: ChartConfig
): Record<string, unknown> | undefined {
  const label = config?.label
  if (!label?.show) return undefined

  const formatter = buildLabelFormatter(
    config?.label?.format || 'decimal',
    config
  )
  return {
    show: true,
    fontSize: config?.fontSize ?? 12,
    // textBorderColor: '#333',
    ...(config?.label?.position ? { position: config?.label?.position } : {}),
    ...(formatter ? { formatter } : {}),
  }
}

// ============================================================
// Step 1: Build Base Option (公共配置)
// ============================================================
export const calculateGridOffset = (
  config: ChartConfig,
  baseOption: EChartsOptionInYWL
) => {
  const isShowTitle = !!(baseOption.title as any).show
  const baseFontSize = config.fontSize ?? 12

  let topOffset = isShowTitle
    ? (Number(baseOption.title?.top) ?? 0) +
      ((baseOption.title?.textStyle?.fontSize as number) ?? 0)
    : 0 // title offset
  topOffset =
    topOffset +
    (config.legend?.position === 'top'
      ? ((baseOption.legend?.top as number) || 0) + (isShowTitle ? 0 : baseFontSize)
      : 0) // legend offset, if title is not shown, add baseFontSize offset as legend height
  topOffset =
    topOffset +
    (!!config.label?.show && config.label?.position === 'top'
      ? baseFontSize
      : 0) // label offset if label position is outside top

  // Grid — 用户手动百分比值优先, 未设置则使用自动计算像素值
  const autoTop = topOffset + 10
  const autoRight = (config.legend?.position === 'right' ? 10 : 0) + 15
  const autoLeft =
    (config.legend?.position === 'left' ? 25 : 0) +
    (config.yAxis?.name?.show ? 15 : 0) +
    15
  const autoBottom =
    (baseOption.legend?.bottom ? (baseOption.legend.bottom as number) + 35 : 0) +
    (config.xAxis?.tick?.show ? baseFontSize + 3 : 0) + // xAxis tick offset
    (config.xAxis?.name?.show ? baseFontSize + 3 : 0) + // xAxis name offset
    5

  return {
    top: autoTop,
    right: autoRight,
    left: autoLeft,
    bottom: autoBottom,
  }
}

/**
 * 从 BaseChartConfig 构建公共 ECharts option.
 * 包含 title, xAxis, yAxis, grid, legend, color 等所有公共属性.
 * 不包含 series / dataset (由图表特有逻辑设置).
 * 不包含 label (由 post-process 阶段处理).
 */
function buildBaseOption(config: ChartConfig): EChartsOptionInYWL {
  const option: EChartsOptionInYWL = {}

  // Theme / color
  if (isColorString(config.theme)) {
    option.color = [config.theme!]
  }

  const baseFontSize = config.fontSize ?? 12
  const titleFontSize = baseFontSize + 2

  // Title
  const isShowTitle = !!config.title?.text && !!config.title?.show
  option.title = {
    text: config.title?.text ?? '',
    show: isShowTitle,
    top: isShowTitle ? 5 : 0,
    textStyle: {
      fontSize: titleFontSize,
      fontWeight: 'bold',
    },
  }

  // xAxis
  option.xAxis = {
    type: 'category',
    name: config.xAxis?.name?.show ? config.xAxis.name.text : undefined,
    nameLocation: 'center',
    nameGap: config.xAxis?.tick?.show ? 30 : 12,
    nameTextStyle: { fontSize: baseFontSize },
    axisTick: {
      show: config.xAxis?.tick?.show ?? true,
      alignWithLabel: true,
      interval: config.xAxis?.tick?.interval ?? 'auto',
    },
    axisLabel: {
      show: config.xAxis?.tick?.show ?? true,
      fontSize: baseFontSize,
      interval: config.xAxis?.tick?.interval ?? 'auto',
      rotate: config.xAxis?.labelRotate ?? 0,
      formatter: (value: any) => formatAxisLabel(value, config.label?.format),
    },
  }

  // yAxis
  option.yAxis = {
    type: 'value',
    name: config.yAxis?.name?.show ? config.yAxis?.name.text : undefined,
    nameLocation: 'center',
    nameGap: config.yAxis?.tick?.show ? 40 : 12,
    nameTextStyle: { fontSize: baseFontSize },
    axisTick: { show: config.yAxis?.tick?.show ?? true },
    axisLabel: {
      show: config.yAxis?.tick?.show ?? true,
      fontSize: baseFontSize,
      formatter: (value: any) => formatAxisLabel(value, config.label?.format),
    },
  }

  // Legend
  option.legend = {
    show: false,
  }

  const legendPos = config.legend?.position || 'top'
  if (config.legend?.show) {
    option.legend = {
      show: config.legend?.show ?? true,
      orient: 'horizontal' as const,
      ...(legendPos === 'top'
        ? {
            top: isShowTitle
              ? (option.title?.top as number) + baseFontSize + 2 + 10
              : 5,
          }
        : {}),
      ...(legendPos === 'bottom' ? { bottom: 5 } : {}),
      ...(legendPos === 'left'
        ? { top: 40, left: 'left', orient: 'vertical' as const }
        : {}),
      ...(legendPos === 'right'
        ? { top: 40, right: 'right', orient: 'vertical' as const }
        : {}),
      textStyle: {
        fontSize: baseFontSize,
      },
    }
  }

  const { top, right, left, bottom } = calculateGridOffset(config, option)

  option.grid = {
    show: config.grid?.show ?? false,
    top: config.grid?.top ? `${config.grid.top}%` : top,
    right: config.grid?.right ? `${config.grid.right}%` : right,
    left: config.grid?.left ? `${config.grid.left}%` : left,
    bottom: config.grid?.bottom ? `${config.grid.bottom}%` : bottom,
  }
  option.xAxis.splitLine = {
    show: config.grid?.show ?? false,
  }
  option.yAxis.splitLine = {
    show: config.grid?.show ?? false,
  }
  return option
}

// ============================================================
// Step 3: Post-process — Apply Common Labels
// ============================================================

/**
 * 动态计算柱状图标签布局
 * 如果柱很小, 标签会与轴重叠, 因此增加一个小的偏移量来避免重叠
 * @param params LabelLayoutOptionCallbackParams
 * @returns LabelLayoutOption
 */
const buildLabelLayoutForBar = (params: LabelLayoutOptionCallbackParams) => {
  const { labelRect, rect } = params
  if (labelRect?.y - rect?.y < -1) {
    return {
      y: labelRect?.y - (rect?.y - labelRect?.y),
      x: labelRect?.x,
    }
  }

  if (labelRect?.x - rect?.x < -1) {
    return {
      y: labelRect?.y,
      x: rect?.x + 1,
    }
  }
}
/**
 * 对 series 中未自行设置 label 的项, 应用公共数据标签配置.
 * 已自带 label 的 series (如饼图) 不会被覆盖.
 */
function applyCommonLabels(option: EChartsOption, config: ChartConfig): void {
  const labelOpt = buildLabelOption(config)
  if (!labelOpt || !option.series) return

  const seriesArr = Array.isArray(option.series)
    ? option.series
    : [option.series]
  for (const s of seriesArr) {
    if (!(s as Record<string, unknown>).label) {
      ;(s as Record<string, unknown>).label = labelOpt
      if (s.type === 'bar' && !config.label?.position) {
        ;(s as Record<string, unknown>).labelLayout = buildLabelLayoutForBar
      }
    }
  }
  option.series = seriesArr
}

// ============================================================
// Main Transformer
// ============================================================

export async function toEChartsOption(
  config: ChartConfig,
  data: DataTable
): Promise<EChartsOption> {
  if (config.version !== 'v2') {
    throw new Error('Unsupported config version')
  }

  const chartDef = getChartDefinition(config.type)

  // 1. 公共配置先行 — 构建 title, axis, legend, grid 等基础 option
  const baseOption = buildBaseOption(config)

  // 2. 图表特有配置后置 — 接收 baseOption, 就地修改, 返回最终 option
  //    约定: toEChartsOption 不应设置 series[].label, 留给 Phase 3 统一处理
  const option = await chartDef.toEChartsOption(config, data, baseOption)

  if (import.meta.env.DEV && option.series) {
    const seriesArr = Array.isArray(option.series)
      ? option.series
      : [option.series]
    for (const s of seriesArr) {
      if ((s as Record<string, unknown>).label) {
        console.warn(
          `[Transformer] Chart "${config.type}" set series.label in toEChartsOption. ` +
            `This will prevent Phase 3 (applyCommonLabels) from applying common label config. ` +
            `If intentional (e.g. pie chart), this warning can be ignored.`
        )
        break
      }
    }
  }

  // 3. 后处理 — 对未自行处理 label 的 series 应用公共数据标签
  applyCommonLabels(option, config)

  return option
}
