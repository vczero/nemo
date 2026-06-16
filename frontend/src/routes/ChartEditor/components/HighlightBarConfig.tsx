import { Form, InputNumber, Switch } from 'antd'
import ColorPicker from './ColorPicker'


type THighlightBar = {
  enabled?: boolean
  index?: number
  color?: string
}

type THighlightBarConfigProps = {
  value?: THighlightBar
  id?: string
  onChange?: (value: THighlightBar) => void
}

export default function HighlightBarConfig({
  id,
  value,
  onChange,
}: THighlightBarConfigProps) {
  const handleChange = (patch: Partial<THighlightBar>) => {
    onChange?.({ ...value, ...patch })
  }

  const handleColorChange = (_: unknown, hex: string) => {
    handleChange({ color: hex })
  }

  const handleSwitchChange = (checked: boolean) => {
    const defalutValue = {
      enabled: true,
      index: value?.index ?? 1,
      color: value?.color ?? '#011852',
    }

    handleChange(checked ? defalutValue : { enabled: false })
  }

  return (
    <div id={id}>
      <div className="flex flex-row">
        <Form.Item
          label="高亮柱子"
          className="mb-2 w-2/5"
          labelCol={{ span: 14 }}
          wrapperCol={{ span: 10 }}
        >
          <Switch
            checked={value?.enabled ?? false}
            onChange={handleSwitchChange}
          />
        </Form.Item>
        {value?.enabled && (
          <Form.Item
            label="序号"
            className="mb-2 w-3/5"
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
          >
            <InputNumber
              min={1}
              max={100}
              placeholder="柱子序号"
              styles={{ root: { width: '100%' } }}
              value={value?.index}
              onChange={(v) => handleChange({ index: v ?? undefined })}
            />
          </Form.Item>
        )}
      </div>
      {value?.enabled && (
        <Form.Item
          label="高亮颜色"
          className="mb-2"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
        >
          <ColorPicker
            value={value?.color}
            onChange={handleColorChange}
          />
        </Form.Item>
      )}
    </div>
  )
}
