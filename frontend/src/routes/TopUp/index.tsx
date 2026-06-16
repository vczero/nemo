import React, { useState } from 'react'
import useSWR from 'swr'
import { Button, Skeleton, Empty, Layout, App as AntApp } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import {
  GET_TOKEN_PACK_PRODUCTS_ENDPOINT,
  getTokenPackProducts,
  createOrder,
} from '@/apis'
import type { TTokenPackProduct } from '@/apis/types'
import { useNavigate } from 'react-router'
import PaymentModal from '@/components/PaymentModal'
import PaymentSuccessHint from '@/components/PaymentSuccessHint'
import { formatMoney } from '@/utils/utils'

const { Content } = Layout

const formatTokenAmount = (amount: number) => {
  return amount.toLocaleString()
}

const Topup: React.FC = () => {
  const { message } = AntApp.useApp()
  const navigate = useNavigate()
  const [pendingProductId, setPendingProductId] = useState<string | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    data: products,
    isLoading,
    isValidating,
  } = useSWR<TTokenPackProduct[]>(
    GET_TOKEN_PACK_PRODUCTS_ENDPOINT,
    getTokenPackProducts
  )

  const handleBuy = (productId: string) => {
    setPendingProductId(productId)
    setPaymentOpen(true)
  }

  return (
    <Layout className="min-h-screen bg-white">
      <Content className="bg-white p-4">
        <Button
          type="text"
          icon={<ArrowLeftOutlined style={{fontSize: '20px'}}/>}
          onClick={() => window.history.state?.idx > 0 ? navigate(-1) : navigate('/apps/center')}
          className="mb-8"
        />
        <div className="mx-auto max-w-3xl px-6 py-16">
          {/* Header Section */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-5xl font-bold text-transparent">
              加购大模型推理流量包
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-gray-600">
              选择合适的加购流量包，获取更多推理流量
            </p>
          </div>

          {success ? <PaymentSuccessHint /> : null}

          {isLoading || isValidating ? (
            <div className="mx-auto max-w-3xl px-6 py-16">
              <Skeleton active paragraph={{ rows: 4 }} />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {products && products.length > 0 ? (
                products.map((product) => (
                  <div
                    key={product.productId}
                    className="flex items-center justify-between rounded-sm border border-gray-200 bg-white px-8 py-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="text-lg font-medium text-gray-800">
                      ¥{formatMoney(product.currentPrice)} 元，
                      {formatTokenAmount(product.tokenAmount)} 推理流量
                      {product.originalPrice > product.currentPrice && (
                        <span className="ml-2 text-sm text-gray-400 line-through">
                          ¥{formatMoney(product.originalPrice)}
                        </span>
                      )}
                    </div>
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => handleBuy(product.productId)}
                    >
                      购买
                    </Button>
                  </div>
                ))
              ) : (
                <Empty description="暂无充值选项" className="my-16" />
              )}
            </div>
          )}
          <div className="mt-16">
            <div className="rounded-sm bg-gray-50 p-8">
              <h3 className="mb-4 text-lg font-semibold">加购说明</h3>
              <ul className="space-y-2 text-gray-600">
                <li>
                  •
                  如您在使用过程中提示大模型推理流量不足，则需要购买推理流量包来补充
                </li>
                <li>
                  • 推理流量充值后立即到账，可用于对数据进行解读和推理计算
                </li>
                <li>• 推理流量购买后在有效期内可用</li>
              </ul>
            </div>
          </div>
        </div>
      </Content>

      <PaymentModal
        open={paymentOpen}
        onCancel={() => setPaymentOpen(false)}
        onSuccess={async () => {
          setSuccess(true)
          setPaymentOpen(false)
          message.success('支付成功')
        }}
        createOrder={() =>
          createOrder({
            payMethod: 'ALIPAY',
            productId: pendingProductId!,
            payQrCodeWidth: 200,
          })
        }
      />
    </Layout>
  )
}

export default Topup
