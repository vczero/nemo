import { ColorPicker as AntdColorPicker } from 'antd'
import type { ColorPickerProps } from 'antd'

const presets = [
  {
    label: '快捷选择',
    colors: [
      '#1677ff',
      '#f5222d',
      '#fa541c',
      '#faad14',
      '#13c2c2',
      '#52c41a',
      '#eb2f96',
      '#313131',
    ],
  },
]

export default function ColorPicker({
  defaultColor,
  value,
  onChange,
  ...props
}: ColorPickerProps & { defaultColor?: string }) {
  return (
    <AntdColorPicker
      presets={presets}
      trigger="click"
      value={value ?? defaultColor}
      onChange={onChange}
      format="hex"
      disabledFormat
      showText
      disabledAlpha
      {...props}
    />
  )
}
