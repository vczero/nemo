import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { Modal, Result, Skeleton, App as AntApp } from 'antd'
import { getOrderStatus } from '@/apis'
import type { TCreateOrderResponse, TOrderStatusResponse } from '@/apis/types'
import { PAYMENT_METHOD } from '@/constants/common'

type PaymentStatus = TOrderStatusResponse | 'LOADING' | null

interface PaymentModalProps {
  open: boolean
  onCancel: () => void
  onSuccess: () => Promise<void>
  /** 创建订单，返回 orderId + payFormHtml */
  createOrder: () => Promise<TCreateOrderResponse>
  /** 轮询订单状态，不同业务可传不同实现，默认使用 getOrderStatus */
  pollStatus?: (orderId: string) => Promise<TOrderStatusResponse>
  /** 轮询间隔，默认 5000ms */
  pollInterval?: number
  /** 支付成功后展示的自定义内容，传入后弹窗保持打开，不再自动展示默认成功提示 */
  successContent?: ReactNode
  /** 展示 successContent 时的弹窗宽度，默认 600 */
  successWidth?: number
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onCancel,
  onSuccess,
  createOrder,
  pollStatus = getOrderStatus,
  pollInterval = 3000,
  successContent,
  successWidth = 600,
}) => {
  const { message } = AntApp.useApp()
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(null)
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const resetState = useCallback(() => {
    setPaymentStatus(null)
    setCurrentOrderId(null)
  }, [])

  // open 变为 true 时创建订单
  useEffect(() => {
    if (!open) return

    let cancelled = false
    setPaymentStatus('LOADING')
    setCurrentOrderId(null)
    const start = Date.now()

    createOrder()
      .then((response) => {
        if (cancelled) return
        if (response.orderId) {
          if (response.payMethod === PAYMENT_METHOD.INTERNAL_POINT && !response.payFormHtml) {
            const spendTime = (Date.now() - start)
            setTimeout(async () => {
              onSuccess()
              setPaymentStatus('PAID')
            }, 1000 - spendTime) // 延迟 1 秒显示支付成功

            return
          } else {
            setCurrentOrderId(response.orderId)
            const target = iframeRef.current
            if (target) {
              target.src = response.payFormHtml
              target.onload = () => setPaymentStatus('UN_PAY')
              target.onerror = () =>
                message.error('加载支付二维码失败，请刷新页面重试')
            }
          }
        }
      })
      .catch(() => {
        if (cancelled) return
        message.error('创建订单失败')
        onCancel()
      })

    return () => {
      cancelled = true
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // 轮询支付状态
  useEffect(() => {
    if (!open || !currentOrderId || paymentStatus !== 'UN_PAY') return

    const timer = window.setInterval(async () => {
      try {
        const res = await pollStatus(currentOrderId)
        if (res === 'PAID') {
          clearInterval(timer)
          onSuccess()
          setPaymentStatus('PAID')
        }
      } catch {
        // Ignore error during polling
      }
    }, pollInterval)

    return () => clearInterval(timer)
  }, [open, currentOrderId, paymentStatus, pollStatus, pollInterval, onSuccess])

  const handleCancel = () => {
    resetState()
    onCancel()
  }

  const showCustomSuccess = paymentStatus === 'PAID' && !!successContent

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={null}
      centered
      destroyOnHidden
      maskClosable={false}
      width={showCustomSuccess ? successWidth : 400}
      className="transition-[width] duration-500 ease-out"
    >
      {paymentStatus === 'PAID' ? (
        successContent ?? (
          <Result
            status="success"
            title="支付成功！"
            subTitle="正在为您跳转..."
          />
        )
      ) : paymentStatus === 'REFUNDED' || paymentStatus === 'CANCELLED' ? (
        <Result status="warning" title="支付失败！" subTitle="请重新订阅" />
      ) : (
        <div className="flex flex-col items-center justify-center p-6">
          <h3 className="mb-4 text-xl font-semibold text-gray-800">
            { paymentStatus === 'LOADING' ? '正在创建订单...' : '请扫码支付'}
          </h3>
          <div className="relative flex h-[205px] w-[205px] items-center justify-center overflow-hidden rounded-sm bg-white">
            <iframe
              title="Payment QR Code"
              ref={iframeRef}
              className={`h-full w-full border-0 bg-white relative ${paymentStatus === 'LOADING' ? 'z-0' : 'z-30'}`}
            />
            {paymentStatus === 'LOADING' ? (
              <Skeleton.Image
                active
                style={{
                  position: 'absolute',
                  zIndex: 10,
                  top: 0,
                  left: 0,
                  width: '200px',
                  height: '200px',
                }}
              />
            ) : null}
          </div>
          <p className="mt-4 text-sm text-gray-500 h-4">{paymentStatus === 'UN_PAY' ? '请使用支付宝扫描上方二维码' : ''}</p>
        </div>
      )}
    </Modal>
  )
}

export default PaymentModal
