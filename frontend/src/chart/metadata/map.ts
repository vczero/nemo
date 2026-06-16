/**
 * Map Chart Registration
 */
import * as echarts from 'echarts'
import { registerChart } from '../core/registry'
import {
  ChartType,
  ChartCategory,
  ChartPurpose,
  CoordinateSystem,
} from '../types'
import type { MapChartConfig, DataTable, EChartsOptionInYWL } from '../types'
import { BASE_CONFIG_ITEMS, LEGEND_CONFIG_ITEMS } from '../configItems'
import { RDBSource } from 'district-data'

const source = new RDBSource({
  version: '2024',
  type: 'gcj02',
})

// ============================================================
// Data Mapping Meta
// ============================================================

const MAP_DATA_MAPPING_META = {
  fields: [
    {
      key: 'nameField',
      label: '地区名称',
      required: true,
      description: '地区名称需与地图数据保持一致以确保匹配, 请下载示例数据查看地区中英文名称.',
      fieldType: 'single' as const,
    },
    {
      key: 'valueField',
      label: '数值',
      required: true,
      fieldType: 'single' as const,
    },
  ],
}

// ============================================================
// Config Meta
// ============================================================

const MAP_CONFIG_ITEMS = [
  ...BASE_CONFIG_ITEMS,
  ...LEGEND_CONFIG_ITEMS, // VisualMap replaces Legend
  {
    key: 'chartSetting', // Maps to MapConfig component
    label: '地图选择',
    type: 'mapRegionSelect' as const,
    group: 'basic' as const,
  },
  {
    key: 'chartSetting.showLabel',
    label: '显示标签',
    type: 'switch' as const,
    group: 'display_element' as const,
  },
  {
    key: 'chartSetting.labelLanguage',
    label: '语言',
    type: 'select' as const,
    group: 'basic' as const,
    options: [
      { label: '中文', value: 'zh' },
      { label: '英文', value: 'en' },
    ],
    props: {
      tooltip: '语言选择会影响地图标签的显示以及数据与标签的对应关系',
    },
  },
  {
    key: 'chartSetting.visualMapMin',
    label: '最小值',
    type: 'number' as const,
    group: 'style' as const,
    props: { placeholder: '自动' },
  },
  {
    key: 'chartSetting.visualMapMax',
    label: '最大值',
    type: 'number' as const,
    group: 'style' as const,
    props: { placeholder: '自动' },
  },
  {
    key: 'chartSetting.visualMapColor',
    label: '颜色渐变',
    type: 'color' as const,
    group: 'style' as const,
    props: {
      mode: 'gradient',
    },
  },
]

// ============================================================
// Transformer
// ============================================================

async function mapToEChartsOption(
  config: MapChartConfig,
  data: DataTable,
  baseOption: EChartsOptionInYWL
): Promise<EChartsOptionInYWL> {
  const { nameField, valueField } = config.dataMapping
  const {
    mapId,
    adcodes,
    mapLevel,
    visualMapMin,
    visualMapMax,
    visualMapColor,
    showLabel,
    labelLanguage,
  } = config.chartSetting || {}
  // Clean Cartesian
  delete baseOption.xAxis
  delete baseOption.yAxis
  delete baseOption.grid

  // 1. Prepare Data
  const header = data[0] as string[]
  const nameIdx = header.indexOf(nameField)
  const valIdx = header.indexOf(valueField)

  if (nameIdx === -1 || valIdx === -1) return baseOption

  let minVal = Infinity
  let maxVal = -Infinity
  const seriesData: { name: string; value: number }[] = []

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const name = String(row[nameIdx])
    const val = Number(row[valIdx])
    if (!isNaN(val)) {
      seriesData.push({ name, value: val })
      if (val < minVal) minVal = val
      if (val > maxVal) maxVal = val
    }
  }

  // 2. Fetch Map
  let mapName = 'world'
  let geoJson: any = null

  if (mapId === 'world' || !mapId) {
    try {
      const mod = await import('@/assets/geo/all_world_country.json')
      geoJson = mod.default || mod
      mapName = 'world'
    } catch (e) {
      console.error('Failed to load world map', e)
    }
  } else if (mapId === 'china') {
    try {
      if (mapLevel) {
        // Special case: China
        if (adcodes?.length === 0) {
          geoJson = await source.getData({ level: mapLevel })
          mapName = 'china_province'
        } else if (adcodes?.length === 1) {
          geoJson = await source.getChildrenData({
            parentAdcode: adcodes[0],
            parentLevel: 'province',
            childrenLevel: mapLevel,
          })
          mapName = `map_${adcodes[0]}_${mapLevel}`
        } else if (adcodes?.length === 2) {
          geoJson = await source.getChildrenData({
            parentAdcode: adcodes[1],
            parentLevel: 'city',
            childrenLevel: mapLevel,
          })
          mapName = `map_${adcodes[0]}_${adcodes[1]}_${mapLevel}`
        } else {
          // Default to China Province
          geoJson = await source.getData({ level: 'province' })
          mapName = 'china_province'
        }
      }
    } catch (e) {
      console.error('Failed to load china map', e)
    }
  }

  if (geoJson) {
    echarts.registerMap(mapName, geoJson)
  }

  // 3. Name Property
  const nameProperty = labelLanguage === 'en' ? 'name_en' : 'name'

  // 4. Build Option
  baseOption.visualMap = {
    show: config.legend?.show ?? false,
    ...(config.legend?.position === 'top'
      ? { left: 'center', top: 30, orient: 'horizontal' as const }
      : {}),
    ...(config.legend?.position === 'bottom'
      ? { left: 'center', bottom: 20, orient: 'horizontal' as const }
      : {}),
    ...(config.legend?.position === 'left'
      ? { left: 0, bottom: 'center', orient: 'vertical' as const }
      : {}),
    ...(config.legend?.position === 'right'
      ? { right: 0, bottom: 'center', orient: 'vertical' as const }
      : {}),
    min: visualMapMin ?? (minVal === Infinity ? 0 : minVal),
    max: visualMapMax ?? (maxVal === -Infinity ? 100 : maxVal),
    calculable: true,
    ...(visualMapColor && Array.isArray(visualMapColor) && visualMapColor.length > 0
      ? { inRange: { color: visualMapColor.map((c) => c.color) } }
      : {}),
    textStyle: {
      fontSize: config.fontSize ?? 12,
    },
  } as any

  baseOption.series = [
    {
      type: 'map',
      map: mapName,
      roam: true,
      nameProperty: nameProperty,
      data: seriesData,
      showLegendSymbol: false,
      label: {
        show: showLabel ?? false,
        color: '#333',
        fontSize: 10,
        formatter: (params: any) => {
          let str = params.name
          if (params.name.includes('香港特别行政区')) {
            str = `{a|${params.name}}`;
          } else if (params.name.includes('澳门特别行政区')) {
            str = `{b|${params.name}}`;
          } else {
            str = `{c|${params.name}}`;
          }
          return str
        },
        rich: {
          a: {
            padding: [0, 0, 0, -11],
          },
          b: {
            padding: [20, 0, 0, -11],
          },
          c: {
            position: [-12, -11],
          },
        }
      },
      itemStyle: {
        areaColor: '#eee',
        borderColor: '#ccc',
      },
    },
  ] as any

  baseOption.labelLayout = {
    hideOverlap: true
  }

  return baseOption
}

// ============================================================
// Demo Data
// ============================================================

const MAP_DEMO_DATA_WORLD = [
  ['Country', 'Value'],
  ['China', 100],
  ['United States', 80],
  ['Brazil', 60],
  ['Russia', 50],
  ['Canada', 40],
  ['Australia', 30],
  ['India', 20],
]

const MAP_DEMO_DATA_CHINA = [
  ['省份', 'ARI'],
  ['北京市', 100],
  ['上海市', 80.68299989540617],
  ['香港特别行政区', 64.00915557445816],
  ['重庆市', 61.38419204807926],
  ['天津市', 59.42439900288774],
  ['澳门特别行政区', 57.26635722773723],
  ['台湾省', 56.677534747845705],
  ['浙江省', 53.7478703469508],
  ['江苏省', 32.92572576670677],
  ['广东省', 44.90158183767913],
  ['安徽省', 25.01763302245504],
  ['四川省', 33.4620105011984],
  ['陕西省', 30.14858094237661],
  ['河北省', 31.556456037222468],
  ['福建省', 17.04542896772361],
  ['山东省', 27.74245499595209],
  ['海南省', 50.39845725167821],
  ['云南省', 21.452478022608616],
  ['河南省', 36.717360583808215],
  ['湖南省', 27.08355867102573],
  ['湖北省', 21.98511307537111],
  ['甘肃省', 18.072014319256045],
  ['黑龙江省', 18.483237664470742],
  ['贵州省', 12.595096654934402],
  ['内蒙古自治区', 11.13469414965985],
  ['西藏自治区', 17.29968816736902],
  ['江西省', 18.643611438603266],
  ['青海省', 20.41799370374916],
  ['辽宁省', 17.57339428131928],
  ['山西省', 15.011196112388353],
  ['吉林省', 11.218354823545075],
  ['广西壮族自治区', 11.693106411735323],
  ['宁夏回族自治区', 8.546655643336038],
  ['新疆维吾尔自治区', 9.909836540193185],
]

const MAP_DEMO_DATA_GUANGDONG = [
  ['City', 'Value'],
  ['Guangzhou', 100],
  ['Shenzhen', 80],
  ['Dongguan', 60],
  ['Zhongshan', 50],
  ['Huizhou', 40],
  ['Jiangmen', 30],
  ['Zhanjiang', 20],
  ['Maoming', 10],
  ['Shaoguan', 10],
  ['Heyuan', 40],
  ['Jieyang', 10],
  ['Meizhou', 10],
  ['Shanwei', 10],
  ['Yunfu', 10],
  ['Foshan', 10],
  ['Yangjiang', 10],
  ['Zhuhai', 75],
  ['Zhaoqing', 10],
  ['Qingyuan', 2],
  ['Chaozhou', 10],
  ['Shantou', 8],
]
// ============================================================
// Registration
// ============================================================

registerChart<MapChartConfig>({
  type: ChartType.MAP,
  name: '分级统计图',
  enName: 'Choropleth Map',
  category: [ChartCategory.MAP],
  purpose: [ChartPurpose.SPATIAL, ChartPurpose.DISTRIBUTION],
  description:
    '分级统计图利用地图区域的颜色深浅来展示数据分布情况，支持世界地图及中国省市区下钻。',
  announcement: '地图数据来源于 AntV L7',
  coordinateSystem: CoordinateSystem.GEO,
  dataMappingMeta: MAP_DATA_MAPPING_META,
  configMeta: MAP_CONFIG_ITEMS as any,

  defaultConfig: {
    version: 'v2',
    type: 'map',
    title: { text: '', show: false },
    size: { width: 800, height: 600 },
    fontSize: 12,
    theme: 'academy',
    legend: { show: true, position: 'right' }, // Using visualMap
    chartSetting: {
      mapId: 'world',
      showLabel: false,
      labelLanguage: 'en',
    },
  },

  demos: [
    {
      chartId: 'NAUTILAB_DEMO_MAP_1',
      chartName: '全球业务分布',
      chartConfig: {
        version: 'v2',
        type: 'map',
        dataMapping: {
          nameField: 'Country',
          valueField: 'Value',
        },
        title: { text: '全球业务分布', show: true },
        size: { width: 800, height: 600 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'right' }, // Using visualMap
        chartSetting: {
          mapId: 'world',
          showLabel: false,
          labelLanguage: 'en',
        },
      } as MapChartConfig,
      chartFile: { content: MAP_DEMO_DATA_WORLD },
    },
    {
      chartId: 'NAUTILAB_DEMO_MAP_2',
      chartName: '中国省级 CII',
      chartConfig: {
        version: 'v2',
        type: 'map',
        dataMapping: {
          nameField: '省份',
          valueField: 'ARI',
        },
        title: { text: '中国省级 CII', show: true },
        size: { width: 700, height: 700 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'right' }, // Using visualMap
        chartSetting: {
          mapId: 'china',
          adcodes: [],
          mapLevel: 'province',
          showLabel: true,
          labelLanguage: 'zh',
        },
      } as MapChartConfig,
      chartFile: { content: MAP_DEMO_DATA_CHINA },
    },
    {
      chartId: 'NAUTILAB_DEMO_MAP_3',
      chartName: '广东省业务分布',
      chartConfig: {
        version: 'v2',
        type: 'map',
        dataMapping: {
          nameField: 'City',
          valueField: 'Value',
        },
        title: { text: '广东省业务分布', show: true },
        size: { width: 600, height: 600 },
        fontSize: 12,
        theme: 'academy',
        legend: { show: true, position: 'right' }, // Using visualMap
        chartSetting: {
          mapId: 'china',
          adcodes: [440000],
          mapLevel: 'city',
          showLabel: false,
          labelLanguage: 'en',
        },
      } as MapChartConfig,
      chartFile: { content: MAP_DEMO_DATA_GUANGDONG },
    },
  ],

  toEChartsOption: mapToEChartsOption,
})
