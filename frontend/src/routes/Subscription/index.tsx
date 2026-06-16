import React, { useCallback, useState } from 'react'
import useSWR from 'swr'
import { Button, Empty, Layout, Skeleton, App as AntApp } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import {
  GET_SUBSCRIPTION_PLANS_ENDPOINT,
  getSubscriptionPlans,
  createOrder,
  calculateSubscriptionAmount,
} from '@/apis'
import type {
  TSubscriptionPlan,
  TCalculateSubscriptionAmountResponse,
} from '@/apis/types'
import { useNavigate } from 'react-router'
import { useUser } from '@/contexts/UserContext'
import dayjs from 'dayjs'
import PaymentModal from '@/components/PaymentModal'
import PaymentSuccessHint from '@/components/PaymentSuccessHint'
import PlanCard from './components/PlanCard'
import { copyToClipboard } from '@/utils/utils'
import { PAYMENT_METHOD } from '@/constants/common'

const { Content } = Layout

const KEFU_EMAIL = 'kefu@deepcoord.com'

const PLAN_RENDER_ORDER: TSubscriptionPlan['planType'][] = [
  'FREE',
  'STANDARD',
  'PRIVATE',
]

type TPriceMap = Record<
  string,
  Record<number, TCalculateSubscriptionAmountResponse>
>

const fetchAllPrices = async (
  plans: TSubscriptionPlan[]
): Promise<TPriceMap | null> => {
  if (!plans || plans.length === 0) return null
  const tasks: { planId: string; months: number }[] = []

  for (const plan of plans) {
    if (plan.pricingRules.length > 0) {
      for (const rule of plan.pricingRules) {
        tasks.push({ planId: plan.planId, months: rule.months })
      }
    }
  }

  if (tasks.length === 0) return {}

  const results = await Promise.all(
    tasks.map((task) =>
      calculateSubscriptionAmount({
        planId: task.planId,
        subscribeMonth: task.months,
      }).then((data) => ({ ...task, data }))
    )
  )

  const priceMap: TPriceMap = {}
  for (const result of results) {
    if (!priceMap[result.planId]) {
      priceMap[result.planId] = {}
    }
    priceMap[result.planId][result.months] = result.data
  }

  return priceMap
}

const Subscription: React.FC = () => {
  const navigate = useNavigate()
  const { message } = AntApp.useApp()

  const [paymentOpen, setPaymentOpen] = useState(false)
  const [pendingOrder, setPendingOrder] = useState<{
    planId: string
    months: number
  } | null>(null)
  const [successLoading, setSuccessLoading] = useState(true)

  const { accountSubscription, mutateAccountSubscriptionData, error: accountSubscriptionError } = useUser()
  const {
    data: plans,
    isLoading: loadingPlans,
    error: errorPlans,
  } = useSWR<TSubscriptionPlan[]>(
    GET_SUBSCRIPTION_PLANS_ENDPOINT,
    getSubscriptionPlans
  )
  const {
    data: priceMap,
    isLoading: isLoadingPriceMap,
    error: errorPriceMap,
    mutate: mutatePriceMap,
  } = useSWR<TPriceMap | null>(
    plans ? plans : null,
    (plans: TSubscriptionPlan[]) => fetchAllPrices(plans)
  )

  const handleSubscribe = useCallback(
    async (plan: TSubscriptionPlan, months: number) => {
      if (plan.planType === 'FREE') {
        navigate('/apps/center')
        return
      }

      if (plan.planType === 'PRIVATE') {
        const success = await copyToClipboard(KEFU_EMAIL)
        if (success) {
          message.info('已复制邮箱地址')
        } else {
          message.info('复制失败，请手动复制')
        }
        return
      }

      setPendingOrder({ planId: plan.planId, months })
      setPaymentOpen(true)
    },
    [navigate, message]
  )

  const handleSubscribeById = useCallback(
    (planId: string, months: number) => {
      const targetPlan = plans?.find((plan) => plan.planId === planId)
      if (!targetPlan) {
        message.error('套餐信息不存在，请刷新后重试')
        return
      }
      handleSubscribe(targetPlan, months)
    },
    [plans, message, handleSubscribe]
  )

  const isLoading = loadingPlans || isLoadingPriceMap
  const isError = errorPlans || errorPriceMap
  const hasAnyPlan = PLAN_RENDER_ORDER.some((planType) =>
    plans?.some((p) => p.planType === planType)
  )

  return (
    <Layout className="min-height-2xl h-screen bg-white">
      <Content className="bg-white p-4">
        <Button
          type="text"
          icon={<ArrowLeftOutlined style={{ fontSize: '20px' }} />}
          onClick={() =>
            window.history.state?.idx > 0
              ? navigate(-1)
              : navigate('/apps/center')
          }
          className="mb-4"
          size="large"
        ></Button>

        <div className="mx-auto max-w-7xl min-w-10 pt-4">
          <div className="mb-3 text-center">
            <h1 className="mb-4 bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-5xl font-bold text-transparent">
              选择适合您的套餐
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-gray-600">
              Good Grades Start With Powerful Data Insights
            </p>
          </div>

          <div className="mb-8 h-5 text-center">
            {accountSubscription ? (
              <p className="font-bold text-gray-600">
                {accountSubscription.subscriptionStatus === 'ACTIVE' ? (
                  <span>
                    您当前订阅的套餐为
                    <span className="text-blue-500">
                      {accountSubscription.planName}
                    </span>
                    {accountSubscription.subscriptionEndTime
                      ? `，到期时间 ${dayjs(accountSubscription.subscriptionEndTime).format('YYYY-MM-DD')}`
                      : ''}
                  </span>
                ) : (
                  <span className="text-red-500">
                    您订阅的套餐{accountSubscription.planName}
                    已过期，请重新订阅
                  </span>
                )}
              </p>
            ) : null}
          </div>

          {isError ? (
            <Empty
              description="获取套餐信息失败，请稍后重试"
              className="my-16"
            />
          ) : !isLoading && !hasAnyPlan ? (
            <Empty description="暂无可用套餐" className="my-16" />
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              {PLAN_RENDER_ORDER.map((planType) => {
                const plan =
                  plans?.find((p) => p.planType === planType) ?? null
                return (
                  <PlanCard
                    key={plan?.planId ?? planType}
                    loading={isLoading || !plan}
                    plan={plan}
                    priceByMonth={
                      plan ? priceMap?.[plan.planId] : undefined
                    }
                    onSubscribe={handleSubscribeById}
                  />
                )
              })}
            </div>
          )}
        </div>
      </Content>

      <PaymentModal
        open={paymentOpen}
        onCancel={() => {
          if (accountSubscriptionError || errorPriceMap) {
            window.location.reload()
            return
          }
          setPaymentOpen(false)
        }}
        onSuccess={async () => {
          message.success('支付成功')
          setSuccessLoading(true)
          mutatePriceMap()
          await mutateAccountSubscriptionData()
          setSuccessLoading(false)
        }}
        createOrder={() =>
          createOrder({
            payMethod: PAYMENT_METHOD.ALIPAY,
            planId: pendingOrder!.planId,
            subscribeMonth: pendingOrder!.months,
            payQrCodeWidth: 200,
          })
        }
        successContent={
          <div className="px-4 py-6">
            <PaymentSuccessHint />
            {accountSubscription && !successLoading && !accountSubscriptionError ? (
              <p className="mb-8 text-center text-base text-gray-800">
                您当前订阅的套餐为
                <span className="font-semibold text-blue-500">
                  {accountSubscription.planName}
                </span>
                {accountSubscription.subscriptionEndTime
                  ? `，到期时间 ${dayjs(accountSubscription.subscriptionEndTime).format('YYYY-MM-DD')}`
                  : ''}
              </p>
            ) : <Skeleton active paragraph={{ rows: 1, width: '100%' }} title={false} classNames={{root: 'mb-8'}} />}
          </div>
        }
      />
    </Layout>
  )
}

export default Subscription
