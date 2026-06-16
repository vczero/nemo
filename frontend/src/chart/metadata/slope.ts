/**
 * Slope Chart Registration
 *
 * 注册 slope (斜率图/坡度图).
 * 斜率图本质上是只有两个(或少量)时间点的折线图, 用于对比排名的变化或数值的增减.
 */
import { registerChart } from '../core/registry'
import { ChartType, ChartCategory, ChartPurpose, CoordinateSystem } from '../types'
import type { DataMappingMeta, DataTable, EChartsOptionInYWL } from '../types'
import {
  BASE_CONFIG_ITEMS,
  LEGEND_CONFIG_ITEMS,
  LABEL_CONFIG_ITEMS,
} from '../configItems'
import { getCachedPivot, formatValue, generateEmptyDataMapping, classifyColumns } from '../utils'
import type { TConfigItem } from '../types/schema'
import type { SlopeChartConfig } from '../types/config'

// ============================================================
// Data Mapping Meta
// ============================================================

const SLOPE_DATA_MAPPING_META = {
  fields: [
    { key: 'dimension', label: '维度 (X轴)', required: true, fieldType: 'single' as const },
    {
      key: 'valueField',
      label: '度量 (Y轴)',
      required: true,
      fieldType: 'single' as const,
    },
    { key: 'stackBy', label: '分组字段', required: false, fieldType: 'single' as const },
  ],
}

// ============================================================
// Config Meta
// ============================================================

const SLOPE_CONFIG_ITEMS: TConfigItem[] = [
  {
    key: 'chartSetting.lineWidth',
    label: '线条宽度',
    type: 'slider',
    range: [1, 10],
    group: 'style',
  },
  {
    key: 'chartSetting.symbolSize',
    label: '标记大小',
    type: 'slider',
    range: [1, 20],
    group: 'style',
  },
  {
    key: 'chartSetting.slopeWidth',
    label: '轴间距',
    type: 'slider',
    range: [20, 70],
    group: 'style',
    props: {
        tooltip: { formatter: (v: number) => `${v}%` }
    }
  },
  {
    key: 'chartSetting.sort',
    label: '排序',
    type: 'select',
    group: 'other',
    options: [
      { label: '降序', value: 'descending' },
      { label: '升序', value: 'ascending' },
    ],
    props: {
      defaultValue: 'descending'
    }
  }
]

const SLOPE_FULL_CONFIG_META = [
  ...BASE_CONFIG_ITEMS,
  // ...CARTESIAN_CONFIG_ITEMS,
  ...LEGEND_CONFIG_ITEMS,
  ...LABEL_CONFIG_ITEMS,
  ...SLOPE_CONFIG_ITEMS,
]

// ============================================================
// Transformer
// ============================================================

function slopeToEChartsOption(
  config: SlopeChartConfig,
  data: DataTable,
  baseOption: EChartsOptionInYWL,
): EChartsOptionInYWL {
  const slopeConfig = config
  const { dimension, valueField, stackBy } = slopeConfig.dataMapping
  const { lineWidth, symbolSize, slopeWidth, sort } = slopeConfig.chartSetting || {}
  const labelFormat = config.label?.format
  const showValue = config.label?.show ?? false // label.show now controls VALUE visibility only

  // 1. Prepare Data (Handle StackBy / Wide Format)
  let pivotedData: DataTable = data
  let groups: string[] = [] // Series names

  // 长表转宽表逻辑
  if (stackBy && valueField) {
    const result = getCachedPivot(data, dimension, stackBy, valueField)
    pivotedData = result.pivotedData
    groups = result.groups
  }

  const header = pivotedData[0] as string[]
  const dimIdx = header.indexOf(dimension)

  if (dimIdx === -1) return baseOption

  // 确定各 series 对应的数据列索引
  let valIndices: number[] = []
  valIndices = groups.map(g => header.indexOf(g))

  // 2. Build X Axis Data
  const xAxisData = []
  for (let i = 1; i < pivotedData.length; i++) {
    xAxisData.push(String(pivotedData[i][dimIdx]))
  }

  // 3. Build Series with Custom Labels
  baseOption.series = groups.map((groupName, i) => {
    const colIdx = valIndices[i]
    const seriesData = []

    // 遍历每一行数据构造 data points
    for (let r = 1; r < pivotedData.length; r++) {
      const val = Number(pivotedData[r][colIdx])
      const safeVal = isNaN(val) ? null : val

      const item: any = { value: safeVal }

      // Custom Label Logic
      // 始终显示文本(Name), label.show 控制数值(Value)
      if (safeVal !== null) {
        let position = 'top'
        if (r === 0) position = 'left' // First point
        else if (r === pivotedData.length - 2) position = 'right' // Last point (length-1 is usually correct but loop starts at 1)

        // Correction: loop r is row index in pivotedData (which has header at 0)
        // Data points count = pivotedData.length - 1
        // Point index = r - 1
        const pointIdx = r - 1
        const totalPoints = pivotedData.length - 1

        if (pointIdx === 0) position = 'left'
        if (pointIdx === totalPoints - 1) position = 'right'

        item.label = {
          show: true,
          position,
          formatter: (params: any) => {
            const name = params.seriesName
            const valueStr = formatValue(params.value, labelFormat)
            return showValue ? `${name} ${valueStr}` : name
          },
        }
      }
      seriesData.push(item)
    }

    return {
      type: 'line',
      name: groupName,
      data: seriesData,
      symbol: 'circle',
      symbolSize: symbolSize ?? 6,
      lineStyle: {
        width: lineWidth ?? 2,
      },
      connectNulls: true,
    }
  }) as any

  // 4. Override Axis Settings
  // X Axis: Top, No Line, No Tick, Vertical Dashed SplitLine
  const xAxis = baseOption.xAxis as any;
  xAxis.type = 'category'
  xAxis.data = xAxisData
  xAxis.position = 'top' // Move to top
  xAxis.boundaryGap = false // Split line on the point

  xAxis.axisLine = { show: false }
  xAxis.axisTick = { show: false }

  // Vertical dashed lines
  xAxis.splitLine = {
    show: true,
    lineStyle: {
      type: 'dashed',
      color: '#ccc',
    }
  }

  // Y Axis: Hide completely
  ;(baseOption.yAxis as any).show = false
  ;(baseOption.yAxis as any).inverse = sort === 'ascending'

  // Grid: Ensure space for labels
  baseOption.grid = baseOption.grid || {}

  const width = slopeWidth ?? 50 // default 50%
  const padding = (100 - width) / 2
  const paddingStr = `${padding}%`;

  (baseOption.grid as any).top = ((baseOption.grid as any).top ?? 0) + 20;
  (baseOption.grid as any).bottom = ((baseOption.grid as any).bottom ?? 0) - 20;
  (baseOption.grid as any).left = paddingStr;
  (baseOption.grid as any).right = paddingStr;

  return baseOption
}

// ============================================================
// Demo Data
// ============================================================

const SLOPE_DEMO_DATA = [
  ['Year', 'Country', 'GDP'],
  ['2010', 'China',  6087],
  ['2020', 'China',  14723],
  ['2010', 'USA',  14992],
  ['2020', 'USA',  20894],
  ['2010', 'Japan',  5700],
  ['2020', 'Japan',  5058],
  ['2010', 'Germany',  3417],
  ['2020', 'Germany',  3846],
]

function inferDataMapping(data: DataTable, meta: DataMappingMeta | null) {
  if (!data.length || !meta || !meta.fields.length || data.length > 500) return generateEmptyDataMapping(meta)

  const { categoricalCols, numericCols } = classifyColumns(data)
  const columns = data[0] as string[]

  // 按唯一值数量降序排列分类列:
  // slop 一般只有两个 dimension, 所以我们把唯一值最少的分配给 dimension, 把最多的分配给 stackBy
  if (categoricalCols.length > 1) {
    const sampleSize = Math.min(data.length, 200)
    const cardinalityMap = new Map<string, number>()
    for (const col of categoricalCols) {
      const colIdx = columns.indexOf(col)
      const values = new Set<string>()
      for (let i = 1; i < sampleSize; i++) {
        values.add(String(data[i][colIdx]))
      }
      cardinalityMap.set(col, values.size)
    }
    categoricalCols.sort((a, b) => cardinalityMap.get(b)! - cardinalityMap.get(a)!)
  }

  const mapping: Record<string, any> = {
    dimension: categoricalCols[categoricalCols.length - 1],
    valueField: numericCols[0],
    stackBy: categoricalCols[0],
  }

  return mapping
}

// ============================================================
// Slope Chart Registration
// ============================================================

registerChart<SlopeChartConfig>({
  type: ChartType.SLOPE,
  name: '斜率图',
  enName: 'Slope Chart',
  category: [ChartCategory.SLOPE],
  purpose: [ChartPurpose.COMPARISON, ChartPurpose.RANKING, ChartPurpose.TREND],
  description: '斜率图用于对比两组数据（通常是两个时间点）之间的数值变化和排名变化，通过线条的倾斜度直观展示增长或下降。',
  coordinateSystem: CoordinateSystem.CARTESIAN,
  dataMappingMeta: SLOPE_DATA_MAPPING_META,
  configMeta: SLOPE_FULL_CONFIG_META,
  inferDataMapping: inferDataMapping,
  defaultConfig: {
    version: 'v2',
    type: 'slope',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: false },
    label: { show: true, format: 'decimal' }, // Default show value + text
    xAxis: { name: { show: false }, tick: { show: false } },
    yAxis: { name: { show: false }, tick: { show: false } },
    grid: { show: false },
    chartSetting: {
      lineWidth: 2,
      symbolSize: 8,
    },
  },

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_SLOPE_1',
      chartName: 'GDP 变化斜率图',
      chartConfig: {
        version: 'v2',
        type: 'slope',
        dataMapping: {
          dimension: 'Year',
          valueField: 'GDP',
          stackBy: 'Country',
        },
        title: { text: '2010-2020 主要国家 GDP 变化', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
        label: { show: true, format: 'decimal' },
        xAxis: { name: { show: false }, tick: { show: false } },
        yAxis: { name: { show: false }, tick: { show: false } },
        grid: { show: false },
        chartSetting: {
            lineWidth: 2,
            symbolSize: 8,
            slopeWidth: 50
        }
      },
      chartFile: { content: SLOPE_DEMO_DATA },
    },
  ],

  toEChartsOption: slopeToEChartsOption,
})
