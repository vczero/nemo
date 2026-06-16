import { Form, InputNumber } from 'antd'

type TSize = { width: number; height: number } | undefined
type TSizeConfigProps = {
  value?: TSize
  id?: string
  onChange?: (value: TSize) => void
}

export default function SizeConfig({
  id,
  onChange,
  value = {} as TSize,
  ...props
}: TSizeConfigProps) {
  const handleSizeChange = (value: TSize) => {
    onChange?.(value)
  }

  return (
    <div id={id} className="flex flex-row">
      <Form.Item
        label="宽度"
        className="mb-2 w-3/5"
        labelCol={{ span: 13 }}
        wrapperCol={{ span: 10 }}
      >
        <InputNumber
          {...props}
          styles={{ root: { width: '100%' } }}
          value={value?.width}
          onChange={(width: number | null) =>
            handleSizeChange({ ...value, width: width ?? 0 } as TSize)
          }
        />
      </Form.Item>
      <Form.Item
        label="高度"
        className="mb-2 w-2/5"
        labelCol={{ span: 10 }}
        wrapperCol={{ span: 14 }}
      >
        <InputNumber
          {...props}
          styles={{ root: { width: '100%' } }}
          value={value?.height}
          onChange={(height: number | null) =>
            handleSizeChange({ ...value, height: height ?? 0 } as TSize)
          }
        />
      </Form.Item>
    </div>
  )
}
