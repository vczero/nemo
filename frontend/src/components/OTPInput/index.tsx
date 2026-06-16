import { useRef, useState, useEffect } from 'react'

import { Form, Input, Button, App } from 'antd'
import { sendVerifyCode } from '@/apis'
import { VERIFY_CODE_TYPE } from '@/constants/common'

export interface OTPInputProps {
  type: keyof typeof VERIFY_CODE_TYPE
  value?: string
  id?: string,
  onChange?: (value: string) => void
}

const OTPInput = ({ type, ...props}: OTPInputProps) => {
  const form = Form.useFormInstance()
  const [countdown, setCountdown] = useState(0)
  const [isCounting, setIsCounting] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const { message } = App.useApp()
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else {
      setIsCounting(false)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [countdown])

  const handleSendCode = async () => {
    try {
      const email = await form.validateFields(['email'])

      setIsCounting(true)
      setCountdown(60)

      const res = await sendVerifyCode({
        email: email.email,
        type: type
      })

      if (res) {
        message.success('验证码已发送，请查收')
      } else {
        throw new Error('发送失败')
      }
    } catch {
      setIsCounting(false)
      setCountdown(0)
    }
  }
  return (
    <div className="flex justify-between flex-row items-center gap-4">
      <Input type="text" style={{ flex: 2 }} maxLength={6} onChange={(e) => props.onChange?.(e.target.value.trim())} />
      <Button
        type="link"
        onClick={handleSendCode}
        disabled={isCounting}
        className={`h-auto text-end justify-end p-0 flex-1 ${isCounting ? 'text-gray-400' : 'text-blue-600'}`}
      >
        {isCounting ? `验证码已发送 (${countdown}s)` : '获取验证码'}
      </Button>
    </div>
  )
}

export default OTPInput
