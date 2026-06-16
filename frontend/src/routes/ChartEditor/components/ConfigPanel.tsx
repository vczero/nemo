import { useMemo } from 'react'
import { Divider, Form, Input, Switch, Slider, Select } from 'antd'
import { BgColorsOutlined } from '@ant-design/icons'
import ClearableInputNumber from '@/components/ClearableInputNumber'
import { useEditorStore, selectChartDefinition, selectIsDemo } from '@/chart'
import type { ChartConfig, TConfigItem, TConfigGroup } from '@/chart'
import { CONFIG_GROUP_LABELS, CONFIG_GROUP_ORDER } from '@/chart/types/schema'
import type { DeepPartial } from '@/chart/core/types'
import type { ChartType } from '@/chart/types'
import Permission, { usePermission } from '@/components/Permission'
import { PERMISSIONS } from '@/constants/permission'

// 复用现有的自定义控件
import ThemePicker from './ThemePicker'
import SizeConfig from './SizeConfig'
import ValueConfig from './LabelConfig'
import LegendConfig from './LegendConfig'
import HighlightBarConfig from './HighlightBarConfig'
import ImageUploadControl from './ImageUploadControl'
import MapConfig from './MapConfig'
import ColorFrom from './ColorFrom'
import GridLayoutConfig from './GridLayoutConfig'
import ColorPicker from './ColorPicker'

// ============================================================
// Config item → Form.Item renderer
// ============================================================

/** 将点标记法 key 转换为 Form.Item name path */
function keyToNamePath(key: string): string | string[] {
  const parts = key.split('.')
  return parts.length === 1 ? parts[0] : parts
}

/** 根据 TConfigItem.type 渲染对应的控件 */
function renderControl(item: TConfigItem, chartType?: ChartType) {
  const props = item.props ?? {}
  switch (item.type) {
    case 'text':
      return (
        <Input
          {...props}
          placeholder={item.placeholder ?? `请输入${item.label}`}
        />
      )
    case 'number':
      return (
        <ClearableInputNumber
          {...props}
          min={item.range?.[0] ?? (props.min as number)}
          max={item.range?.[1] ?? (props.max as number)}
          className="w-full"
        />
      )
    case 'switch':
      return <Switch {...props} />
    case 'slider':
      return (
        <Slider
          {...props}
          min={item.range?.[0] ?? 0}
          max={item.range?.[1] ?? 100}
        />
      )
    case 'select':
      return (
        <Select
          {...props}
          options={item.options}
          placeholder={item.placeholder}
        />
      )
    case 'theme':
      return <ThemePicker {...props} />
    case 'size':
      return <SizeConfig {...props} />
    case 'label':
      return <ValueConfig {...props} chartType={chartType} />
    case 'legend':
      return <LegendConfig {...props} />
    case 'colorFrom':
      return <ColorFrom {...props} />
    case 'color':
      return <ColorPicker {...props} />
    case 'highlightBar':
      return <HighlightBarConfig {...props} />
    case 'imageUpload':
      return <ImageUploadControl {...props} />
    case 'mapRegionSelect':
      return <MapConfig {...props} />
    case 'gridLayout':
      return <GridLayoutConfig {...props} />
    default:
      return <Input {...props} />
  }
}

/** ColorPicker 返回 Color 对象, 需要转为 hex 字符串存入 config */
const colorGetValueFromEvent = (color: unknown) => {
  if (typeof color === 'string') return color
  if (color && typeof color === 'object' && 'colors' in color) {
    const res = (color.colors as any[]).map((c: any) => {
      return { color: c.color.toHexString(), percent: c.percent }
    })
    return res
  }

  if (color && typeof color === 'object' && 'toHexString' in color) {
    const res = (color as { toHexString: () => string }).toHexString()
    return res
  }
  return color
}

/** 渲染单个配置项 */
function ConfigItemRenderer({
  item,
  itemAlign,
  chartType,
}: {
  item: TConfigItem
  itemAlign: 'left' | 'right'
  chartType?: ChartType
}) {
  const namePath = keyToNamePath(item.key)
  const isSwitch = item.type === 'switch'
  const isColor = item.type === 'color'
  // theme, size, label, legend, highlightBar, imageUpload 使用自定义组件, 不需要 label + noStyle
  const isCustomLayoutComponents = [
    'theme',
    'size',
    'label',
    'legend',
    'highlightBar',
    'mapRegionSelect',
    'colorFrom',
    'gridLayout',
  ].includes(item.type)

  // Custom handling for enableTranslation which is managed by WordCloudTranslationConfig
  if (item.key === 'chartSetting.enableTranslation') {
    return null // Don't render here, it's handled by WordCloudTranslationConfig
  }

  const labelSpan =
    itemAlign === 'right' ? (item.type === 'switch' ? 20 : 8) : 8
  const wrapperSpan = 24 - labelSpan

  return (
    <Form.Item
      key={item.key}
      name={namePath}
      labelAlign={'right'}
      tooltip={item.props?.tooltip as string}
      label={isCustomLayoutComponents ? undefined : item.label}
      className="mb-2"
      valuePropName={isSwitch ? 'checked' : undefined}
      noStyle={isCustomLayoutComponents}
      getValueFromEvent={isColor ? colorGetValueFromEvent : undefined}
      labelCol={{ span: labelSpan }}
      wrapperCol={{ span: wrapperSpan }}
    >
      {renderControl(item, chartType)}
    </Form.Item>
  )
}

/** 渲染分组标题 */
const FormGroup = ({
  name,
  children,
}: {
  name: string
  children: React.ReactNode
}) => (
  <div className="p-2 pb-0">
    <h3 className="mb-2 font-bold">{name}</h3>
    {children}
  </div>
)

// ============================================================
// ConfigPanel
// ============================================================
const alignRightGroupKeys = ['display_element', 'other']
export default function ConfigPanel() {
  const chartId = useEditorStore((s) => s.chartId)
  const chartConfig = useEditorStore((s) => s.chartConfig)
  const updateConfig = useEditorStore((s) => s.updateConfig)
  const isDemo = useEditorStore(selectIsDemo)
  const permission = isDemo
    ? [PERMISSIONS.CHART_VIEW_DEMO, PERMISSIONS.CHART_EDIT_DEMO]
    : [PERMISSIONS.CHART_EDIT]
  const { guard: permissionGuard } = usePermission(permission)

  // 从 store 派生当前图表的定义
  const chartDef = useEditorStore(selectChartDefinition)
  const [form] = Form.useForm<DeepPartial<ChartConfig>>()

  const chartType = chartConfig?.type

  // 按 group 分组
  const groupedItems = useMemo(() => {
    if (!chartDef) return null
    const groups: Record<TConfigGroup, TConfigItem[]> = {
      basic: [],
      style: [],
      display_element: [],
      layout: [],
      other: [],
    }
    for (const item of chartDef.configMeta) {
      groups[item.group as TConfigGroup].push(item)
    }
    return groups
  }, [chartDef])

  // useEffect(() => {
  //   if (chartId && chartConfig) {
  //     form.setFieldsValue(chartConfig)
  //   }
  // }, [chartId, chartConfig])

  const handleValuesChange = (
    _: unknown,
    allValues: DeepPartial<ChartConfig>
  ) => {
    if (!permissionGuard()) {
      return
    }
    updateConfig(allValues)
  }

  if (!chartConfig || !groupedItems) return null

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-[45px] items-center border-b border-gray-200 px-2 text-lg leading-[45px] font-bold">
        <BgColorsOutlined className="mr-2" /> 图表配置
      </div>
      <div className="flex-1 overflow-y-auto">
        <Permission permission={permission} mode="Alert">
          <Form
            labelWrap
            form={form}
            layout="horizontal"
            key={chartId}
            initialValues={chartConfig}
            onValuesChange={handleValuesChange}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
          >
            {CONFIG_GROUP_ORDER.map((groupKey) => {
              const items = groupedItems[groupKey]
              if (!items || items.length === 0) return null
              const itemAlign = alignRightGroupKeys.includes(groupKey)
                ? 'right'
                : 'left'

              return (
                <div key={groupKey}>
                  <FormGroup name={CONFIG_GROUP_LABELS[groupKey]}>
                    {items.map((item) => (
                      <ConfigItemRenderer
                        key={item.key}
                        item={item}
                        itemAlign={itemAlign}
                        chartType={chartType}
                      />
                    ))}
                    {/* Render WordCloudTranslationConfig for 'other' group if it's a WordCloud chart */}
                    {/* {isWordCloud && groupKey === 'other' && (
                    <WordCloudTranslationConfig
                      chartConfig={chartConfig as WordCloudChartConfig}
                      updateConfig={updateConfig as (partial: DeepPartial<WordCloudChartConfig>) => void}
                    />
                  )} */}
                  </FormGroup>
                  <Divider className="m-0" />
                </div>
              )
            })}
          </Form>
        </Permission>
        {chartDef && chartDef.announcement ? (
          <div className="p-2 text-sm">{chartDef.announcement}</div>
        ) : null}
      </div>
    </div>
  )
}
