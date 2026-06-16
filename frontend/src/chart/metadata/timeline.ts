import * as echarts from 'echarts'
import { registerChart } from '../core/registry'
import { ChartType, ChartCategory, ChartPurpose, CoordinateSystem } from '../types'
import type { TimelineChartConfig, DataTable, TConfigItem, EChartsOptionInYWL } from '../types'
import {
  BASE_CONFIG_ITEMS,
} from '../configItems'
import timeline from '../vendors/timeline'

echarts.use(timeline as any)

const TIMELINE_DATA_MAPPING_META = {
  fields: [
    { key: 'titleField', label: '标题', required: true, fieldType: 'single' as const },
    { key: 'subtitleField', label: '副标题', required: false, fieldType: 'single' as const },
    { key: 'labelField', label: '标签', required: false, fieldType: 'single' as const },
  ],
}

const TIMELINE_FULL_CONFIG_META = [
  ...BASE_CONFIG_ITEMS,
  {
    key: 'chartSetting.gap',
    label: '箭头间距',
    type: 'slider',
    range: [-10, 10],
    group: 'style',
  },
  {
    key: 'chartSetting.arrowDepth',
    label: '箭头深度',
    type: 'slider',
    range: [5, 30],
    group: 'style',
  },
  {
    key: 'chartSetting.arrowHeight',
    label: '箭头高度',
    type: 'slider',
    range: [20, 80],
    group: 'style',
  },
] as TConfigItem[]

function timelineToEChartsOption(
  config: TimelineChartConfig,
  data: DataTable,
  baseOption: EChartsOptionInYWL
): EChartsOptionInYWL {
  const timelineConfig = config
  const { titleField, subtitleField, labelField } = timelineConfig.dataMapping
  const { arrowHeight, arrowDepth, gap } =
    timelineConfig.chartSetting || {}


  delete baseOption.xAxis
  delete baseOption.yAxis
  delete baseOption.grid

  baseOption.dataset = { source: data }

  // Build Series
  baseOption.series = {
    type: 'custom',
    renderItem: 'timeline',
    name: 'timeline',
    coordinateSystem: 'none',
    colorBy: 'item',
    itemPayload: {
      fontSize: config.fontSize ?? 12,
      arrowHeight: arrowHeight ?? 40,
      arrowDepth: arrowDepth ?? 20,
      gap: gap,
    },
    encode: {
      y: [titleField, subtitleField, labelField],
    }
  } as any

  return baseOption
}


const DEMO_DATA = [
  ['Title', 'Description', 'Year'],
[
    'AI 的诞生',
    '达特茅斯会议首次提出了“人工智能”这一术语，标志着AI作为一门独立学科正式诞生，科学家们对让机器拥有智能充满了最初的憧憬。',
    '1956'
  ],
  [
    '深蓝击败人类',
    'IBM的超级计算机“深蓝”(Deep Blue)击败了国际象棋世界冠军卡斯帕罗夫，这是符号主义和暴力搜索在特定领域的历史性胜利。',
    '1997'
  ],
  [
    '深度学习元年',
    'AlexNet 在 ImageNet 图像识别比赛中以巨大优势夺冠，证明了神经网络配合GPU算力的强大，彻底引爆了全球的深度学习热潮。',
    '2012'
  ],
  [
    'AlphaGo 崛起',
    'DeepMind 研发的 AlphaGo 击败了人类围棋世界冠军李世石，展现了深度强化学习在极高复杂度游戏中的惊人潜力，震惊世界。',
    '2016'
  ],
  [
    '大模型时代开启',
    'OpenAI 正式发布 ChatGPT。其极其强大的自然语言理解、推理和生成能力，让生成式 AI (GenAI) 走入大众视野，开启全新纪元。',
    '2022'
  ],
  [
    '多模态与 AGI',
    'Sora 等文本生成视频大模型惊艳问世，大语言模型向多模态全面进化。人类正以前所未有的速度向通用人工智能 (AGI) 迈进。',
    '2024'
  ]
];

registerChart<TimelineChartConfig>({
  type: ChartType.TIMELINE,
  name: '时间线图',
  enName: 'Timeline',
  category: [ChartCategory.TIMELINE],
  purpose: [ChartPurpose.TREND],
  description: '时间线图用于展示数据的时间顺序和变化过程。',
  coordinateSystem: CoordinateSystem.NONE,
  dataMappingMeta: TIMELINE_DATA_MAPPING_META,
  configMeta: TIMELINE_FULL_CONFIG_META,
  defaultConfig: {
    version: 'v2',
    type: 'timeline',
    title: { text: '', show: false },
    size: { width: 640, height: 300 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: false },
    grid: { show: false },
    chartSetting: {
      arrowHeight: 40,
      arrowDepth: 20,
      gap: 0,
    },
  },
  demos: [
    {
      chartId: 'NAUTILAB_DEMO_TIMELINE_1',
      chartName: 'AI 发展简史',
      chartConfig: {
        version: 'v2',
        type: 'timeline',
        dataMapping: {
          titleField: 'Title',
          subtitleField: 'Description',
          labelField: 'Year',
        },
        title: { text: 'AI 发展简史', show: true },
        size: { width: 850, height: 400 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
        grid: { show: false },
        chartSetting: {
          arrowHeight: 40,
          arrowDepth: 20,
          gap: -5,
        },
      },
      chartFile: { content: DEMO_DATA },
    },
  ],
  toEChartsOption: timelineToEChartsOption,
});