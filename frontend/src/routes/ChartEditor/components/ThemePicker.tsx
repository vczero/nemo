import { Form, Button } from 'antd'
import type { ColorPickerProps } from 'antd'

import ColorPicker from './ColorPicker'
import { THEMES } from '@/chart'
import { isColorString } from '@/utils/utils'

type TThemePickerProps = ColorPickerProps & {
  value?: string
  id?: string
  onChange?: (value: string) => void
}

const Palette = ({
  colors = [],
  value = '',
  selected = false,
  onClick,
}: {
  colors: string[]
  value: string
  onClick: (value: string, color: string[]) => void
  selected: boolean
}) => {
  return (
    <Button
      className="whitespace-normal mb-1 box-content p-0 h-6.5"
      onClick={() => onClick(value, colors)}
      color={selected ? 'primary' : 'default'}
      variant='outlined'
      size='small'
    >
      <div className="flex overflow-hidden rounded-[2px] p-1 h-full">
      {colors.map((color, index) => (
        <span
          key={index}
          className={`inline-block size-4.5`}
          style={{ backgroundColor: color }}
        />
      ))}
      </div>
    </Button>
  )
}

const PalettePicker = ({
  palettes = [],
  value,
  onChange,
}: {
  palettes: { value: string; colors: string[] }[]
  value?: string
  onChange: (value: string, _: string[]) => void
}) => {
  const handleClick = (value: string, colors: string[]) => {
    onChange(value, colors)
  }
  return (
    <div className="">
      {palettes.map((palette) => (
        <Palette
          key={palette.value}
          colors={palette.colors}
          value={palette.value}
          onClick={handleClick}
          selected={value === palette.value}
        />
      ))}
    </div>
  )
}
const palettes = Object.values(THEMES).map((theme: typeof THEMES[keyof typeof THEMES]) => ({
  value: theme.key,
  colors: theme.color.slice(0, 10),
}))

// type Presets = Required<ColorPickerProps>['presets'][number];
export default function ThemePicker({
  id,
  value,
  onChange,
}: TThemePickerProps) {
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

  const handleColorPickerChange = (_: ColorPickerProps['value'], css: string) => {
    onChange?.(css)
  }

  const handleThemeChange = (value: string, _: string[]) => {
    onChange?.(value)
  }

  const isRGBValue = isColorString(value)

  return (
    <div id={id} className="">
      <Form.Item label="单一颜色" className="mb-2" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
        <ColorPicker
          presets={presets}
          value={isRGBValue ? value : undefined}
          onChange={handleColorPickerChange as any}
          style = {{ borderColor: isRGBValue ? 'var(--ant-color-primary)' : undefined }}
        />
      </Form.Item>
      <Form.Item label="主题颜色" className="mb-2" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
        <PalettePicker
          palettes={palettes}
          value={value as string}
          onChange={handleThemeChange}
        />
      </Form.Item>
    </div>
  )
}
