/**
 * Pre-built Config Item Sets (可组合的配置项集合)
 *
 * 这些数组取代了之前的 FeatureKey 枚举.
 * 每个 chart 注册时从这里组合自己需要的配置项:
 *
 *   configMeta: [...BASE_CONFIG_ITEMS, ...CARTESIAN_CONFIG_ITEMS, ...LEGEND_CONFIG_ITEMS]
 *
 * 新增图表类型时只需要组合已有集合 + 定义自己的特有配置项,
 * ConfigPanel 完全根据 configItems 动态渲染, 不需要任何修改.
 */
import type { TConfigItem } from './types'

// ============================================================
// BASE — 所有图表都需要的基础配置项
// ============================================================

export const BASE_CONFIG_ITEMS: TConfigItem[] = [
  {
    key: 'title.text',
    label: '标题',
    type: 'text',
    group: 'basic',
    placeholder: '请输入标题',
  },
  { key: 'size', label: '图表尺寸', type: 'size', group: 'basic' },
  {
    key: 'fontSize',
    label: '字体大小',
    type: 'slider',
    range: [10, 32],
    group: 'basic',
  },
  { key: 'theme', label: '主题', type: 'theme', group: 'style' },
  {
    key: 'title.show',
    label: '显示标题',
    type: 'switch',
    group: 'display_element',
  },
]

// ============================================================
// CARTESIAN — 笛卡尔坐标系图表 (bar, line, scatter, etc.)
// ============================================================
export const GRID_CONFIG_ITEMS: TConfigItem[] = [
  { key: 'grid', label: '布局调整', type: 'gridLayout', group: 'layout' },
]
export const CARTESIAN_CONFIG_ITEMS: TConfigItem[] = [
  {
    key: 'xAxis.name.text',
    label: 'X轴名称',
    type: 'text',
    group: 'basic',
    placeholder: 'X轴名称',
  },
  {
    key: 'yAxis.name.text',
    label: 'Y轴名称',
    type: 'text',
    group: 'basic',
    placeholder: 'Y轴名称',
  },
  {
    key: 'grid.show',
    label: '显示网格',
    type: 'switch',
    group: 'display_element',
  },
  {
    key: 'xAxis.name.show',
    label: '显示X轴名称',
    type: 'switch',
    group: 'display_element',
  },
  {
    key: 'yAxis.name.show',
    label: '显示Y轴名称',
    type: 'switch',
    group: 'display_element',
  },
  {
    key: 'xAxis.tick.show',
    label: '显示X轴刻度',
    type: 'switch',
    group: 'display_element',
  },
  {
    key: 'yAxis.tick.show',
    label: '显示Y轴刻度',
    type: 'switch',
    group: 'display_element',
  },
  {
    key: 'xAxis.tick.interval',
    label: 'X轴刻度间隔',
    type: 'number',
    group: 'display_element',
    range: [0],
    props: { placeholder: '自动', step: 1, precision: 0, allowClear: true },
  },
  {
    key: 'xAxis.labelRotate',
    label: 'X轴标签旋转',
    type: 'slider',
    range: [0, 90],
    group: 'style',
    props: { step: 45 },
  },
  ...GRID_CONFIG_ITEMS,
]

// ============================================================
// LEGEND — 图例配置
// ============================================================

export const LEGEND_CONFIG_ITEMS: TConfigItem[] = [
  { key: 'legend', label: '图例', type: 'legend', group: 'display_element' },
]

// ============================================================
// LABEL — 数据标签配置 (使用自定义 LabelConfig 组件)
// ============================================================

export const LABEL_CONFIG_ITEMS: TConfigItem[] = [
  { key: 'label', label: '数据标签', type: 'label', group: 'other' },
]

export const NAME_LABEL_CONFIG_ITEMS: TConfigItem[] = [
  {
    key: 'chartSetting.showLabelName',
    label: '名称标签',
    type: 'switch',
    group: 'other',
  },
]

// ============================================================
// PIE — 饼图 / 环形图特有配置
// ============================================================


export const PIE_TITLE_POSITION_CONFIG_ITEMS: TConfigItem[] = [
  {
    key: 'chartSetting.titlePosition',
    label: '标题位置',
    type: 'select',
    group: 'display_element',
    options: [
      { label: '顶部', value: 'top' },
      { label: '圆环中心', value: 'center' },
    ],
  },
]

export const PIE_STYLE_CONFIG_ITEMS: TConfigItem[] = [
  {
    key: 'chartSetting.showBorder',
    label: '扇区间隙',
    type: 'switch',
    group: 'style',
  },
]

export const PIE_CONFIG_ITEMS: TConfigItem[] = [
  {
    key: 'chartSetting.radius',
    label: '外半径',
    type: 'slider',
    range: [10, 100],
    group: 'style',
  },
  {
    key: 'chartSetting.innerRadius',
    label: '内半径',
    type: 'slider',
    range: [0, 99],
    group: 'style',
  },
  {
    key: 'chartSetting.roseType',
    label: '玫瑰图',
    type: 'select',
    group: 'style',
    placeholder: '将圆环图转换为玫瑰图',
    options: [
      { label: '半径模式', value: 'radius' },
      { label: '面积模式', value: 'area' },
    ],
    props: {
      allowClear: true,
    },
  },
]

// ============================================================
// RADAR — 雷达图特有配置
// ============================================================

export const RADAR_CONFIG_ITEMS: TConfigItem[] = [
  {
    key: 'chartSetting.shape',
    label: '雷达形状',
    type: 'select',
    group: 'style',
    options: [
      { label: '多边形', value: 'polygon' },
      { label: '圆形', value: 'circle' },
    ],
  },
  {
    key: 'chartSetting.areaStyle',
    label: '显示区域填充',
    type: 'switch',
    group: 'style',
  },
  {
    key: 'chartSetting.radius',
    label: '半径',
    type: 'slider',
    range: [10, 100],
    group: 'style',
  },
]

// ============================================================
// FUNNEL — 漏斗图特有配置
// ============================================================

export const FUNNEL_BASIC_CONFIG_ITEMS: TConfigItem[] = [
  // {
  //   key: 'chartSetting.sort',
  //   label: '排序方式',
  //   type: 'select',
  //   group: 'other',
  //   options: [
  //     { label: '降序', value: 'descending' },
  //     { label: '升序', value: 'ascending' },
  //     { label: '不排序', value: 'none' },
  //   ],
  // },
  {
    key: 'chartSetting.gap',
    label: '间距',
    type: 'slider',
    range: [0, 20],
    group: 'style',
  },
  {
    key: 'chartSetting.minSize',
    label: '最小宽度',
    type: 'slider',
    range: [0, 40],
    group: 'style',
    props: {
      tooltip: { formatter: (v: number) => `${v}%` },
    },
  },
]

export const FUNNEL_CONVERSION_CONFIG_ITEMS: TConfigItem[] = [
  {
    key: 'chartSetting.showConversionRate',
    label: '显示转化率',
    type: 'switch',
    group: 'display_element',
  },
]

export const FUNNEL_CONFIG_ITEMS: TConfigItem[] = [
  ...FUNNEL_BASIC_CONFIG_ITEMS,
  // ...FUNNEL_CONVERSION_CONFIG_ITEMS,
]

// ============================================================
// HEATMAP — 热力图特有配置
// ============================================================

export const HEATMAP_CONFIG_ITEMS: TConfigItem[] = [
  {
    key: 'chartSetting.visualMapMin',
    label: '最小值',
    type: 'number',
    group: 'style',
    props: { placeholder: '自动' },
  },
  {
    key: 'chartSetting.visualMapMax',
    label: '最大值',
    type: 'number',
    group: 'style',
    props: { placeholder: '自动' },
  },
  // {
  //   key: 'chartSetting.minColor',
  //   label: '最小值颜色',
  //   type: 'color',
  //   props: {
  //     allowClear: true,
  //   },
  //   group: 'style',
  // },
  // {
  //   key: 'chartSetting.maxColor',
  //   label: '最大值颜色',
  //   type: 'color',
  //   props: {
  //     allowClear: true,
  //   },
  //   group: 'style',
  // },
]

// ============================================================
// SCATTER — 散点图特有配置
// ============================================================

export const SCATTER_CONFIG_ITEMS: TConfigItem[] = [
  {
    key: 'chartSetting.symbolSize',
    label: '散点大小',
    type: 'slider',
    group: 'style',
    range: [1, 50],
  },
  {
    key: 'chartSetting.bubbleSizeRange',
    label: '气泡范围',
    type: 'slider',
    group: 'style',
    range: [1, 100],
    props: {
      range: true, // Antd Slider range mode
    },
  },
  {
    key: 'chartSetting.regression.type',
    label: '回归类型',
    type: 'select',
    group: 'other',
    options: [
      { label: '无', value: 'none' },
      { label: '线性回归', value: 'linear' },
      { label: '指数回归', value: 'exponential' },
      { label: '对数回归', value: 'logarithmic' },
      { label: '多项式回归', value: 'polynomial' },
    ],
  },
  {
    key: 'chartSetting.regression.order',
    label: '多项式阶数',
    type: 'number',
    group: 'other',
    range: [2, 10],
    props: {
      placeholder: '仅多项式回归有效',
    },
  },
]
export const SINGLE_AXIS_SCATTER_CONFIG_ITEMS: TConfigItem[] = [
  {
    key: 'chartSetting.bubbleSizeRange',
    label: '气泡范围',
    type: 'slider',
    group: 'style',
    range: [1, 100],
    props: {
      range: true, // Antd Slider range mode
    },
  },
  {
    key: 'chartSetting.axisGap',
    label: '轴间距',
    type: 'slider',
    group: 'style',
    range: [5, 100],
    props: {
      defaultValue: 40,
    },
  },
  {
    key: 'chartSetting.axisHeight',
    label: '轴高度',
    type: 'slider',
    group: 'style',
    range: [10, 100],
    props: {
      defaultValue: 40,
    },
  },
]

export const BAR_HIGHLIGHT_CONFIG_ITEMS: TConfigItem[] = [
  {
    key: 'chartSetting.highlightedBar',
    label: '高亮柱子',
    type: 'highlightBar',
    group: 'style',
  },
]

// ============================================================
// LINE — 折线图特有配置
// ============================================================

export const LINE_CONFIG_ITEMS: TConfigItem[] = [
  {
    key: 'chartSetting.smooth',
    label: '平滑曲线',
    type: 'switch',
    group: 'style',
  },
  {
    key: 'chartSetting.areaStyle',
    label: '显示面积填充',
    type: 'switch',
    group: 'style',
  },
  {
    key: 'chartSetting.step',
    label: '阶梯线',
    type: 'select',
    props: {
      allowClear: true,
    },
    group: 'other',
    options: [
      { label: '开始', value: 'start' },
      { label: '中间', value: 'middle' },
      { label: '结尾', value: 'end' },
    ],
  },
  {
    key: 'chartSetting.symbol',
    label: '线段符号',
    type: 'switch',
    group: 'style',
  },
]
