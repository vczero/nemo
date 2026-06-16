import { Form, Select } from 'antd'
import type { ColorPickerProps } from 'antd'

import ColorPicker from './ColorPicker'

import { isColorString } from '@/utils/utils'


type TColorFromProps = {
  value?: string
  id?: string
  onChange?: (value: string) => void
}

const options = [
  { label: '源节点颜色', value: 'source' },
  { label: '目标节点颜色', value: 'target' },
  { label: '指定颜色', value: 'custom' },
]

// type Presets = Required<ColorPickerProps>['presets'][number];
export default function ThemePicker({
  id,
  value,
  onChange,
}: TColorFromProps) {
  const isCustomColor = isColorString(value)
  const handleColorPickerChange = (_: ColorPickerProps['value'], css: string) => {
    onChange?.(css)
  }

  const handleThemeChange = (value: string) => {
    if (value === 'custom') {
      onChange?.('#999')
    } else {
      onChange?.(value)
    }
  }

  return (
    <div id={id} className="">
      <Form.Item label="连线颜色" className="mb-2" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
        <Select
          options={options}
          value={isCustomColor ? 'custom' : value}
          onChange={handleThemeChange}
        />
      </Form.Item>
      {
        isCustomColor && (
          <Form.Item label="选择颜色" className="mb-2" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} >
            <ColorPicker
              value={value}
              onChange={handleColorPickerChange}
            />
          </Form.Item>
        )
      }
    </div>
  )
}
