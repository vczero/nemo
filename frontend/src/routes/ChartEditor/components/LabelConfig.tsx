import { Form, Select, Switch } from 'antd'
import { ChartType as ChartTypeEnum } from '@/chart'
import type { ChartType } from '@/chart/types'

type TLabel = {
  show: boolean
  format?: string
  position?:
    | 'default'
    | 'inside'
    | 'insideTop'
    | 'insideBottom'
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
}
type TLabelConfigProps = {
  value?: TLabel
  chartType?: ChartType
  id?: string
  onChange?: (value: TLabel) => void
}

const valueFormatOptions = [
  { label: '小数', value: 'decimal' },
  { label: '百分比', value: 'percentage' },
  { label: '整数', value: 'integer' },
  { label: '金额 ￥', value: 'cny' },
  { label: '金额 $', value: 'usd' },
]

const pieLabelPositionOptions = [
  { label: '外部', value: 'outside' },
  { label: '内部', value: 'inside' },
]

const labelPositionOptions = [
  { label: '自动', value: 'default' },
  { label: '内部居中', value: 'inside' },
  { label: '内部顶部', value: 'insideTop' },
  { label: '内部底部', value: 'insideBottom' },
  { label: '外部顶部', value: 'top' },
  { label: '外部底部', value: 'bottom' },
  { label: '外部左侧', value: 'left' },
  { label: '外部右侧', value: 'right' },
]

export default function LabelConfig({
  id,
  value,
  onChange,
  chartType,
  // ...props
}: TLabelConfigProps) {
  const handleValueChange = (value: TLabel) => {
    if (!value.format) {
      value.format = valueFormatOptions[0].value
    }
    if (value.position === 'default') {
      value.position = undefined
    }
    onChange?.(value)
  }

  const options =
    chartType === ChartTypeEnum.PIE ||
    chartType === ChartTypeEnum.DONUT ||
    chartType === ChartTypeEnum.ROUNDED_DONUT ||
    chartType === ChartTypeEnum.CHORD
      ? pieLabelPositionOptions
      : labelPositionOptions

  return (
    <div id={id} className="flex flex-row flex-wrap">
      <Form.Item
        label="数值标签"
        className="mb-2 w-1/2"
        labelCol={{ span: 16 }}
        wrapperCol={{ span: 8 }}
      >
        <Switch
          checked={value?.show}
          onChange={(checked) => handleValueChange({ ...value, show: checked })}
        />
      </Form.Item>
      <Form.Item
        label="格式"
        className="mb-2 w-1/2"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
      >
        <Select
          disabled={!value?.show}
          options={valueFormatOptions}
          value={value?.format || 'decimal'}
          onChange={(format) =>
            handleValueChange({ ...value, format } as TLabel)
          }
        />
      </Form.Item>
      <Form.Item
        label="位置"
        className="mb-2 w-full"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        tooltip="自动模式会根据图表类型自动选择位置"
      >
        <Select
          disabled={!value?.show}
          options={options}
          value={value?.position || options[0].value}
          onChange={(position) =>
            handleValueChange({ ...value, position } as TLabel)
          }
        />
      </Form.Item>
    </div>
  )
}
