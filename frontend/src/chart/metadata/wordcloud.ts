/**
 * WordCloud Chart Registration
 */
import * as echarts from 'echarts'
import wordCloud from '@echarts-x/custom-word-cloud'
import { registerChart } from '../core/registry'
import {
  ChartType,
  ChartCategory,
  ChartPurpose,
  CoordinateSystem,
} from '../types'
import type { WordCloudChartConfig, DataTable, EChartsOptionInYWL } from '../types'
import { BASE_CONFIG_ITEMS } from '../configItems'
import type { TConfigItem } from '../types/schema'

echarts.use(wordCloud)

const WORDCLOUD_DATA_MAPPING_META = {
  fields: [
    {
      key: 'nameField',
      label: '词语字段 (1)',
      required: true,
      fieldType: 'single' as const,
    },
    {
      key: 'valueField',
      label: '数值字段 (1)',
      required: true,
      fieldType: 'single' as const,
    },
    {
      key: 'nameField2',
      label: '词语字段 (2)',
      required: false,
      fieldType: 'single' as const,
    },
    {
      key: 'valueField2',
      label: '数值字段 (2)',
      required: false,
      fieldType: 'single' as const,
    },
  ],
}

// ============================================================
// Config Meta
// ============================================================
const WORDCLOUD_CONFIG_ITEMS: TConfigItem[] = [
  {
    key: 'chartSetting.shape',
    label: '图形',
    type: 'select',
    group: 'style',
    options: [
      { label: '矩形', value: 'square' },
      { label: '圆', value: 'circle' },
      { label: '三角形', value: 'triangle' },
      { label: '星形', value: 'star' },
    ],
  },
  {
    key: 'chartSetting.maskImage',
    label: '遮罩图片',
    type: 'imageUpload', // Custom type for image upload
    group: 'style',
    props: {
      accept: 'image/jpeg, image/svg+xml',
      tooltip:
        '上传遮罩图片后，词云会根据遮罩图片的形状进行布局。遮罩白色像素将被忽略，非白色像素将用作绘制文本的区域。',
    },
  },
  {
    key: 'chartSetting.sizeRange',
    label: '字体大小范围',
    type: 'slider',
    group: 'style',
    range: [8, 60],
    props: { range: true },
  },
  {
    key: 'chartSetting.rotationRange',
    label: '旋转角度范围',
    type: 'slider',
    group: 'style',
    range: [-90, 90],
    props: { range: true, step: 10 },
  },
  {
    key: 'chartSetting.rotationStep',
    label: '旋转步数',
    type: 'slider',
    group: 'style',
    range: [1, 90],
    props: { step: 1 },
  },
]

const WORDCLOUD_FULL_CONFIG_META = [
  ...BASE_CONFIG_ITEMS,
  ...WORDCLOUD_CONFIG_ITEMS,
]

// ============================================================
// Transformer
// ============================================================

function wordCloudToEChartsOption(
  config: WordCloudChartConfig,
  data: DataTable,
  baseOption: EChartsOptionInYWL
): Promise<EChartsOptionInYWL> {
  return new Promise<EChartsOptionInYWL>((resolve, _) => {
    const wordcloudConfig = config
    const { nameField, valueField, nameField2, valueField2 } =
      wordcloudConfig.dataMapping
    const { shape, maskImage, sizeRange, rotationRange, rotationStep } =
      wordcloudConfig.chartSetting || {}

    // WordCloud does not use Cartesian coordinates
    delete baseOption.xAxis
    delete baseOption.yAxis
    // delete baseOption.grid

    // Prepare Data
    const header = data[0] as string[]
    const nameIdx = header.indexOf(nameField)
    const valueIdx = header.indexOf(valueField)

    // Series 1 Data
    const seriesData1: any[] = []
    if (nameIdx !== -1 && valueIdx !== -1) {
      for (let i = 1; i < data.length; i++) {
        const row = data[i]
        const word = String(row[nameIdx])
        const value = Number(row[valueIdx])

        if (word && !isNaN(value)) {
          seriesData1.push({ value: [word, value] })
        }
      }
      seriesData1.sort((a, b) => b.value[1] - a.value[1])
      seriesData1.splice(300)
    }

    // Series 2 Data
    const seriesData2: any[] = []
    let hasSecondSeries = false
    if (nameField2 && valueField2) {
      const nameIdx2 = header.indexOf(nameField2)
      const valueIdx2 = header.indexOf(valueField2)
      if (nameIdx2 !== -1 && valueIdx2 !== -1) {
        hasSecondSeries = true
        for (let i = 1; i < data.length; i++) {
          const row = data[i]
          const word = String(row[nameIdx2])
          const value = Number(row[valueIdx2])
          if (word && !isNaN(value)) {
            seriesData2.push({ value: [word, value] })
          }
        }
        seriesData2.sort((a, b) => b.value[1] - a.value[1])
        seriesData2.splice(300)
      }
    }

    const commonPayload = {
      shape: shape ?? 'circle', // Default to circle if image is selected without actual image
      gridSize: 2,
      sizeRange: sizeRange ?? [12, 60],
      rotationRange: rotationRange ?? [-90, 90],
      rotationStep: rotationStep ?? 45,
      drawOutOfBound: false,
      shrinkToFit: true,
      layoutAnimation: true,
    }

    const titleShow = config?.title?.show ?? true
    const topOffset = titleShow ? 40 : 0

    const seriesList: any[] = []

    if (hasSecondSeries) {
      // Two series side by side
      // Left Series
      seriesList.push({
        type: 'custom',
        renderItem: 'wordCloud',
        data: seriesData1,
        coordinateSystem: 'none',
        itemPayload: {
          ...commonPayload,
          top: topOffset,
          left: 0,
          right: '50%',
          bottom: 0,
        },
      })
      // Right Series
      seriesList.push({
        type: 'custom',
        renderItem: 'wordCloud',
        data: seriesData2,
        coordinateSystem: 'none',
        itemPayload: {
          ...commonPayload,
          top: topOffset,
          left: '50%',
          right: 0,
          bottom: 0,
        },
      })
    } else {
      // Single series
      seriesList.push({
        type: 'custom',
        renderItem: 'wordCloud',
        data: seriesData1,
        coordinateSystem: 'none',
        itemPayload: {
          ...commonPayload,
          top: topOffset,
          left: 0,
          right: 0,
          bottom: 0,
        },
      })
    }

    // Hide legend for word cloud by default, as it's not typically used
    if (baseOption.legend && !Array.isArray(baseOption.legend)) {
      ;(baseOption.legend as any).show = false
    }

    if (maskImage) {
      const maskImageEle = document.createElement('img')
      maskImageEle.src = maskImage

      maskImageEle.onload = () => {
        // Apply mask to all series
        seriesList.forEach((s) => {
          s.itemPayload.maskImage = maskImageEle
        })
        baseOption.series = seriesList
        resolve(baseOption)
      }
      maskImageEle.onerror = () => {
        // Fallback if image fails
        baseOption.series = seriesList
        resolve(baseOption)
      }
    } else {
      baseOption.series = seriesList
      resolve(baseOption)
    }
  })
}

// ============================================================
// Demo Data
// ============================================================

const WORDCLOUD_DEMO_DATA = [
  ['city_cn', 'city_en', 'count'],
  ['巴黎', 'Paris', 1000],
  ['伦敦', 'London', 980],
  ['东京', 'Tokyo', 950],
  ['纽约', 'New York', 920],
  ['罗马', 'Rome', 900],
  ['曼谷', 'Bangkok', 880],
  ['迪拜', 'Dubai', 860],
  ['新加坡', 'Singapore', 850],
  ['巴塞罗那', 'Barcelona', 830],
  ['威尼斯', 'Venice', 810],
  ['洛杉矶', 'Los Angeles', 800],
  ['悉尼', 'Sydney', 790],
  ['首尔', 'Seoul', 780],
  ['台北', 'Taipei', 770],
  ['香港', 'Hong Kong', 760],
  ['伊斯坦布尔', 'Istanbul', 750],
  ['阿姆斯特丹', 'Amsterdam', 740],
  ['佛罗伦萨', 'Florence', 730],
  ['米兰', 'Milan', 720],
  ['京都', 'Kyoto', 710],
  ['大阪', 'Osaka', 700],
  ['布拉格', 'Prague', 690],
  ['维也纳', 'Vienna', 680],
  ['马德里', 'Madrid', 670],
  ['旧金山', 'San Francisco', 660],
  ['芝加哥', 'Chicago', 650],
  ['拉斯维加斯', 'Las Vegas', 640],
  ['迈阿密', 'Miami', 630],
  ['柏林', 'Berlin', 620],
  ['慕尼黑', 'Munich', 610],
  ['北京', 'Beijing', 600],
  ['上海', 'Shanghai', 590],
  ['广州', 'Guangzhou', 580],
  ['深圳', 'Shenzhen', 570],
  ['成都', 'Chengdu', 560],
  ['杭州', 'Hangzhou', 550],
  ['西安', 'Xian', 540],
  ['重庆', 'Chongqing', 530],
  ['厦门', 'Xiamen', 520],
  ['三亚', 'Sanya', 510],
  ['苏黎世', 'Zurich', 500],
  ['日内瓦', 'Geneva', 490],
  ['哥本哈根', 'Copenhagen', 480],
  ['斯德哥尔摩', 'Stockholm', 470],
  ['奥斯陆', 'Oslo', 460],
  ['赫尔辛基', 'Helsinki', 450],
  ['雅典', 'Athens', 440],
  ['圣托里尼', 'Santorini', 430],
  ['开罗', 'Cairo', 420],
  ['开普敦', 'Cape Town', 410],
  ['里约热内卢', 'Rio de Janeiro', 400],
  ['布宜诺斯艾利斯', 'Buenos Aires', 390],
  ['圣保罗', 'Sao Paulo', 380],
  ['利马', 'Lima', 370],
  ['墨西哥城', 'Mexico City', 360],
  ['多伦多', 'Toronto', 350],
  ['温哥华', 'Vancouver', 340],
  ['蒙特利尔', 'Montreal', 330],
  ['墨尔本', 'Melbourne', 320],
  ['布里斯班', 'Brisbane', 310],
  ['奥克兰', 'Auckland', 300],
  ['惠灵顿', 'Wellington', 295],
  ['皇后镇', 'Queenstown', 290],
  ['莫斯科', 'Moscow', 285],
  ['圣彼得堡', 'Saint Petersburg', 280],
  ['普吉岛', 'Phuket', 275],
  ['芭提雅', 'Pattaya', 270],
  ['清迈', 'Chiang Mai', 265],
  ['巴厘岛', 'Bali', 260],
  ['马尼拉', 'Manila', 255],
  ['吉隆坡', 'Kuala Lumpur', 250],
  ['槟城', 'Penang', 245],
  ['芽庄', 'Nha Trang', 240],
  ['胡志明市', 'Ho Chi Minh', 235],
  ['河内', 'Hanoi', 230],
  ['暹粒', 'Siem Reap', 225],
  ['仰光', 'Yangon', 220],
  ['科伦坡', 'Colombo', 215],
  ['马累', 'Male', 210],
  ['阿布扎比', 'Abu Dhabi', 205],
  ['多哈', 'Doha', 200],
  ['耶路撒冷', 'Jerusalem', 195],
  ['安曼', 'Amman', 190],
  ['卡萨布兰卡', 'Casablanca', 185],
  ['马拉喀什', 'Marrakech', 180],
  ['内罗毕', 'Nairobi', 175],
  ['约翰内斯堡', 'Johannesburg', 170],
  ['圣地亚哥', 'Santiago', 165],
  ['波哥大', 'Bogota', 160],
  ['哈瓦那', 'Havana', 155],
  ['坎昆', 'Cancun', 150],
  ['檀香山', 'Honolulu', 145],
  ['西雅图', 'Seattle', 140],
  ['波士顿', 'Boston', 135],
  ['华盛顿', 'Washington', 130],
  ['费城', 'Philadelphia', 125],
  ['亚特兰大', 'Atlanta', 120],
  ['达拉斯', 'Dallas', 115],
  ['休斯顿', 'Houston', 110],
  ['里斯本', 'Lisbon', 100],
]

// ============================================================
// WordCloud Chart Registration
// ============================================================

registerChart<WordCloudChartConfig>({
  type: ChartType.WORDCLOUD,
  name: '词云图',
  enName: 'WordCloud',
  category: [ChartCategory.WORDCLOUD], // Or a new category for Text Visualization
  purpose: [ChartPurpose.DISTRIBUTION],
  description: '词云图用于可视化文本数据中词语的频率，词语越大表示频率越高。',
  coordinateSystem: CoordinateSystem.NONE,

  dataMappingMeta: WORDCLOUD_DATA_MAPPING_META,
  configMeta: WORDCLOUD_FULL_CONFIG_META,

  defaultConfig: {
    version: 'v2',
    type: 'wordcloud',
    title: { text: '', show: false },
    size: { width: 640, height: 480 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: false },
    chartSetting: {
      shape: 'circle',
      sizeRange: [12, 60],
      rotationRange: [-90, 90],
    },
  },

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_WORDCLOUD_1',
      chartName: '全球热点城市',
      chartConfig: {
        version: 'v2',
        type: 'wordcloud',
        dataMapping: {
          nameField: 'city_cn',
          valueField: 'count',
        },
        title: { text: '全球热点城市', show: true },
        size: { width: 640, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
        chartSetting: {
          shape: 'circle',
          sizeRange: [8, 48],
          rotationRange: [-90, 90],
          rotationStep: 90,
        },
      } as WordCloudChartConfig,
      chartFile: { content: WORDCLOUD_DEMO_DATA },
    },
    {
      chartId: 'NAUTILAB_DEMO_WORDCLOUD_2',
      chartName: '全球热点城市（双语）',
      chartConfig: {
        version: 'v2',
        type: 'wordcloud',
        dataMapping: {
          nameField: 'city_cn',
          valueField: 'count',
          nameField2: 'city_en',
          valueField2: 'count',
        },
        title: { text: '全球热点城市（双语）', show: true },
        size: { width: 960, height: 480 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: false },
        chartSetting: {
          shape: 'circle',
          sizeRange: [8, 38],
          rotationRange: [-90, 90],
          rotationStep: 90,
        },
      } as WordCloudChartConfig,
      chartFile: { content: WORDCLOUD_DEMO_DATA },
    },
  ],

  toEChartsOption: wordCloudToEChartsOption,
})
