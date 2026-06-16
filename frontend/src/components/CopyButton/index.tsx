import { useState } from 'react'
import { Button, type ButtonProps } from 'antd'

import { copyToClipboard } from '@/utils/utils'

type CopyButtonProps = {
  text: string
} & ButtonProps

export default function CopyButton({ text, ...rest }: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async () => {
    const success = await copyToClipboard(text)
    if (success) {
      setIsCopied(true)
    }
  }

  return (
    <Button {...rest} onClick={handleCopy}>
      {isCopied ? '复制成功' : '复制内容'}
    </Button>
  )
}