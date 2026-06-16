/**
 * Shared Bar & Horizontal Bar Logic
 */
import type { ChartConfig, BarChartConfig, DataTable, EChartsOptionInYWL } from '../types'

import { formatValue, getCachedPivot } from '../utils'

export const BAR_DEMO_DATA = [
  ['city', 'temperature'],
  ['北京', 26],
  ['上海', 28],
  ['广州', 30],
  ['深圳', 29],
  ['杭州', 27],
  ['成都', 25],
  ['武汉', 28],
  ['南京', 26],
]

/** 堆叠柱状图 demo — 宽表 */
export const STACKED_BAR_DEMO_DATA = [
  ['quarter', '产品A', '产品B', '产品C'],
  ['Q1', 500, 80, 60],
  ['Q2', 150, 90, 70],
  ['Q3', 180, 110, 85],
  ['Q4', 200, 130, 95],
]

// ============================================================
// Shared: Data Mapping Meta
// ============================================================

export const BAR_DATA_MAPPING_META = {
  fields: [
    { key: 'dimension', label: '维度', required: true, fieldType: 'single' as const },
    {
      key: 'metrics',
      label: '度量',
      required: true,
      fieldType: 'multiple' as const,
      showAlias: true,
      showStack: false,
      showBackground: true,
    },
  ],
}

export const GROUPED_BAR_DATA_MAPPING_META = {
  fields: [
    { key: 'dimension', label: '维度', required: true, fieldType: 'single' as const },
    {
      key: 'metrics',
      label: '度量',
      required: true,
      fieldType: 'multiple' as const,
      showAlias: true,
      showStack: false,
    },
    { key: 'stackBy', label: '分组字段', required: false, fieldType: 'single' as const },
  ],
}

export const BACKGROUND_BAR_DATA_MAPPING_META = {
  fields: [
    { key: 'dimension', label: '维度', required: true, fieldType: 'single' as const },
    {
      key: 'metrics',
      label: '度量',
      required: true,
      fieldType: 'multiple' as const,
      showAlias: true,
      showStack: false,
      showBackground: true,
      metricDefaults: { showBackground: true, backgroundColor: 'rgba(180, 180, 180, 0.2)' },
    },
  ],
}

export const STACKED_BAR_DATA_MAPPING_META = {
  fields: [
    { key: 'dimension', label: '维度', required: true, fieldType: 'single' as const },
    {
      key: 'metrics',
      label: '度量',
      required: true,
      fieldType: 'multiple' as const,
      showAlias: true,
      showStack: true,
      metricDefaults: { stack: 'total' },
    },
    { key: 'stackBy', label: '堆叠字段', required: false, fieldType: 'single' as const },
  ],
}

export const PERCENT_BAR_DATA_MAPPING_META = {
  fields: [
    { key: 'dimension', label: '维度', required: true, fieldType: 'single' as const },
    {
      key: 'metrics',
      label: '度量',
      required: true,
      fieldType: 'multiple' as const,
      showAlias: true,
      showStack: false,
    },
    { key: 'stackBy', label: '堆叠字段', required: false, fieldType: 'single' as const },
  ],
}

export const TORNADO_DATA_MAPPING_META = {
  fields: [
    { key: 'dimension', label: '维度', required: true, fieldType: 'single' as const },
    {
      key: 'metrics',
      label: '度量',
      required: true,
      fieldType: 'multiple' as const,
      maxFields: 2,
      showAlias: true,
      showStack: false,
      showBackground: false,
    },
  ],
}

// ============================================================
// Utils: Normalize
// ============================================================
export function normalizeToPercent(
  data: DataTable,
  valueFields: string[],
): DataTable {
  const header = data[0] as string[]
  const fieldIndices = valueFields.map(f => header.indexOf(f)).filter(i => i !== -1)

  if (fieldIndices.length === 0) return data

  const newData = [header] // Copy header
  for (let i = 1; i < data.length; i++) {
    const row = [...data[i]] // Copy row
    const total = fieldIndices.reduce((sum, idx) => sum + (Number(row[idx]) || 0), 0)

    if (total !== 0) {
        for (const idx of fieldIndices) {
            row[idx] = ((Number(row[idx]) || 0) / total) * 100
        }
    }
    newData.push(row)
  }
  return newData
}

// ============================================================
// Transformer Utils
// ============================================================

export function buildHighlightedBarColorFn(
  highlightedBar: NonNullable<BarChartConfig['chartSetting']>['highlightedBar'],
): ((params: { dataIndex?: number; color: unknown }) => string | unknown) | undefined {
  if (!highlightedBar?.enabled || highlightedBar.index == null || !highlightedBar.color) return undefined
  const targetIndex = highlightedBar.index
  const targetColor = highlightedBar.color
  return (params) => {
    return params.dataIndex === targetIndex - 1 ? targetColor : params.color
  }
}

export function buildBarSeriesExtras(
  metric: { showBackground?: boolean; backgroundColor?: string },
  highlightedBarColorFn?: ReturnType<typeof buildHighlightedBarColorFn>,
) {
  return {
    ...(metric.showBackground
      ? {
          showBackground: true,
          backgroundStyle: {
            color: metric.backgroundColor || 'rgba(180, 180, 180, 0.2)',
          },
        }
      : {}),
    ...(highlightedBarColorFn
      ? { itemStyle: { color: highlightedBarColorFn as unknown as string } }
      : {}),
  }
}

// ============================================================
// Transformer
// ============================================================

export function barToEChartsOption(
  config: ChartConfig,
  data: DataTable,
  baseOption: EChartsOptionInYWL,
): EChartsOptionInYWL {
  const barConfig = config as BarChartConfig
  const { dimension, metrics, stackBy } = barConfig.dataMapping
  const isHorizontal = config.type.includes('horizontal') || config.type === 'tornado'
  const isPercent = config.type.includes('percent')
  const isTornado = config.type === 'tornado'

  const highlightedBar = barConfig.chartSetting?.highlightedBar
  const highlightedBarColorFn = buildHighlightedBarColorFn(highlightedBar)

  // ── 轴类型覆盖 ──
  const xAxis = baseOption.xAxis as Record<string, unknown>
  const yAxis = baseOption.yAxis as Record<string, unknown>
  if (isHorizontal) {
    xAxis.type = 'value'
    yAxis.type = 'category'

    // 对于条形图这样的 x 轴是 value 轴, 使用 xAxis.interval 配置, 而不是 axisTick.interval
    // 因为 axisTick.interval 是用于 category 轴的, 而 value 轴的刻度间隔是根据数据值的间隔计算的
    // 但是xAxis.interval 和 axisTick.interval 行为不一致, 当 axisTick.interval = 0 时, tick 直接
    // 没有间隔, 而 xAxis.interval = 0 时, 不再显示 tick, 因为此时两个 value 之间的差值 = 0.
    if (Number.isInteger(config.xAxis?.tick?.interval)) {
      xAxis.interval = config.xAxis?.tick?.interval === 0 ? undefined : config.xAxis?.tick?.interval
    }
  }

  // ── 百分比堆叠或对比图: 轴格式化 ──
  if (isPercent || isTornado) {
    const valueAxis = isHorizontal ? xAxis : yAxis
    if (isPercent) {
      valueAxis.max = 100
      const existingLabel = (valueAxis.axisLabel as Record<string, unknown>) || {}
      valueAxis.axisLabel = { ...existingLabel, formatter: '{value}%' }
    } else if (isTornado) {
      // 对比图: 坐标轴显示绝对值
      const existingLabel = (valueAxis.axisLabel as Record<string, unknown>) || {}
      valueAxis.axisLabel = {
        ...existingLabel,
        formatter: (value: number) => {
          return Math.abs(value).toString()
        }
      }
    }
  }

  // ── 数据预处理 (对比图第一个度量取负) ──
  let processedData = data
  if (isTornado && metrics.length > 0) {
    const firstMetricField = metrics[0].field
    const header = data[0] as string[]
    const idx = header.indexOf(firstMetricField)
    if (idx !== -1) {
        processedData = [header]
        for(let i=1; i<data.length; i++) {
            const newRow = [...data[i]]
            newRow[idx] = -(Number(newRow[idx]) || 0)
            processedData.push(newRow)
        }
    }
  }

  // ── 长表模式 (stackBy) ──
  if (stackBy && metrics.length > 0) {
    const { pivotedData, groups } = getCachedPivot(processedData, dimension, stackBy, metrics)
    const source = isPercent ? pivotedData.map((data) => normalizeToPercent(data, groups)) : pivotedData
    const isMultiDimensional = Array.isArray(pivotedData)

    baseOption.dataset = (isMultiDimensional ? source.map((data) => ({ source: data})) : { source }) as any[]
    const seriesData = []
    for (let i = 0; i < groups.length; i++) {
      const encode = isHorizontal ? { y: dimension, x: groups[i] } : { x: dimension, y: groups[i] }
      for (let j = 0; j < pivotedData.length; j++) {
        seriesData.push({
          type: 'bar' as const,
          name: groups[i],
          datasetIndex: j,
          encode,
          stack: isPercent ? `percent-${j}` : isTornado ? `contrast-${j}` : metrics[j].stack,
          ...buildBarSeriesExtras(metrics[0], highlightedBarColorFn),
        })
      }
    }

    baseOption.series = seriesData

    return baseOption
  }

  // ── 宽表模式 (无 stackBy) ──
  const metricFields = metrics.map((m) => m.field)
  const source = isPercent ? normalizeToPercent(processedData, metricFields) : processedData

  baseOption.dataset = { source }

  baseOption.series = metrics.map((m, idx) => ({
    type: 'bar' as const,
    name: m.alias ?? m.field,
    encode: isHorizontal
      ? { y: dimension, x: m.field }
      : { x: dimension, y: m.field },
    ...(isPercent ? { stack: 'percent' } : isTornado ? { stack: 'contrast' } : m.stack ? { stack: m.stack } : {}),
    ...buildBarSeriesExtras(m, highlightedBarColorFn),
    // 对比图第一个度量的标签显示绝对值
    ...(isTornado && idx === 0 ? {
      label: {
        show: config.label?.show,
        formatter: (params: any) => {
          // params.value is array [dimVal, metricVal1, metricVal2...]
          // We rely on encode to find value.
          // params.value[params.encode.x[0]]

          const dimIdx = params.encode.x[0];
          // For dataset with header, value[dimIdx] should be the value.

          let val = 0;
          if (Array.isArray(params.value)) {
              val = params.value[dimIdx];
          } else {
              // fallback if object
              val = params.value[params.dimensionNames[dimIdx]];
          }
          return formatValue(Math.abs(val), config.label?.format)
        }
      }
    } : {})
  }))

  return baseOption
}