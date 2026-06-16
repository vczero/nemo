import { Form, Slider } from 'antd'
import { UndoOutlined } from '@ant-design/icons'

type TGridLayout = {
  show?: boolean
  top?: number
  right?: number
  bottom?: number
  left?: number
}

type TGridLayoutConfigProps = {
  value?: TGridLayout
  id?: string
  onChange?: (value: TGridLayout) => void
}

const fields = [
  { key: 'top', label: '上' },
  { key: 'bottom', label: '下' },
  { key: 'left', label: '左' },
  { key: 'right', label: '右' },
] as const

export default function GridLayoutConfig({
  id,
  value,
  onChange,
}: TGridLayoutConfigProps) {
  const handleChange = (field: keyof TGridLayout, v: number) => {
    onChange?.({ ...value, [field]: v })
  }

  const handleReset = (field: keyof TGridLayout) => {
    const next = { ...value, [field]: undefined }
    onChange?.(next)
  }

  return (
    <div id={id}>
      {fields.map(({ key, label }) => {
        return (
          <Form.Item key={key} label={label} className="mb-0" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Slider
                  min={1}
                  max={100}
                  value={value?.[key] ?? 50}
                  tooltip={{ formatter: (v) => `${v}%` }}
                  onChange={(v) => handleChange(key, v)}
                />
              </div>
              <span
                className="w-10 shrink-0 cursor-pointer text-center text-xs text-gray-400 hover:text-blue-500"
                title="重置为自动"
                onClick={() => handleReset(key)}
              >
                <UndoOutlined />
              </span>
            </div>
          </Form.Item>
        )
      })}
    </div>
  )
}
