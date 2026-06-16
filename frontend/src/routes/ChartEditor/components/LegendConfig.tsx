import { Form, Select, Switch } from 'antd'

type TLegend = { show?: boolean, position?: 'top' | 'bottom' | 'left' | 'right' }
type TLegendConfigProps = {
  value?: TLegend
  id?: string
  onChange?: (value: TLegend) => void
}

const positionOptions = [
  { label: '顶部', value: 'top' },
  { label: '底部', value: 'bottom' },
  { label: '左侧', value: 'left' },
  { label: '右侧', value: 'right' },
]

export default function LegendConfig({
  id,
  value,
  onChange,
}: TLegendConfigProps) {

  const handleValueChange = (patch: Partial<TLegend>) => {
    const newValue = { ...value, ...patch }
    if (newValue.show && !newValue.position) {
      newValue.position = 'top'
    }
    onChange?.(newValue)
  }

  return (
    <div id={id} className="flex flex-row">
      <Form.Item label="显示图例" className="mb-2 w-1/2" labelCol={{span: 16}} wrapperCol={{span: 8}}>
        <Switch checked={value?.show} onChange={(checked) => handleValueChange({ show: checked })} />
      </Form.Item>
      <Form.Item label="位置" className="mb-2 w-1/2" labelCol={{span: 10}} wrapperCol={{span: 14}}>
        <Select disabled={!value?.show} options={positionOptions} value={value?.position} onChange={(position) => handleValueChange({ position })} />
      </Form.Item>
    </div>
  )
}
