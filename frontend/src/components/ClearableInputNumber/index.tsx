import { InputNumber, type InputNumberProps } from 'antd'
import { CloseCircleFilled } from '@ant-design/icons'

type ClearableInputNumberProps = InputNumberProps & {
  allowClear?: boolean
  onClear?: () => void
}

export default function ClearableInputNumber({
  value,
  onChange,
  onClear,
  disabled,
  allowClear = false,
  ...rest
}: ClearableInputNumberProps) {
  const handleClear = () => {
    onChange?.(null as any)
    onClear?.()
  }

  const showClear = allowClear

  return (
    <div className="flex items-center gap-1">
      <InputNumber value={value} onChange={onChange} disabled={disabled} {...rest} />
      {showClear && (
        <CloseCircleFilled
          className="cursor-pointer text-base text-gray-400 transition-colors hover:text-gray-600"
          onClick={handleClear}
        />
      )}
    </div>
  )
}
