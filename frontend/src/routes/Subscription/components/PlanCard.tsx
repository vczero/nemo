import React, { useMemo, useState } from 'react'
import { Button, Radio, Skeleton } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import type {
  TSubscriptionPlan,
  TCalculateSubscriptionAmountResponse,
} from '@/apis/types'
import { formatMoney } from '@/utils/utils'

const FEATURES_MAP: Record<TSubscriptionPlan['planType'], string[]> = {
  FREE: [
    '仅支持图表体验',
    '目前仅开放图表在线体验，数据上传、自定义计算与分析等功能暂未开放。',
  ],
  STANDARD: [
    '支持使用 40+ 在线可视化图表',
    '支持应用中心 8+ 计算任务',
    '支持使用计算任务 LLMs，含 10 万/月推理流量',
    // '支持研究报告 Storytelling 模块' // TODO: data agent
  ],
  PRIVATE: [
    '支持在线数据可视化',
    '支持调用数据解读',
    '支持应用中心计算任务',
    '支持使用 Data Agent',
    '支持研究报告 Storytelling 模块',
    '支持专家服务',
  ],
}

const getDefaultMonths = (plan: TSubscriptionPlan) =>
  plan.pricingRules[0]?.months ?? 12

const getDurationLabel = (months: number) => {
  if (months === 1) return '月'
  if (months === 3) return '季'
  if (months === 6) return '半年'
  if (months === 12) return '年'
  return `${months}月`
}

const getPeriodText = (months: number) => {
  if (months === 1) return '每月'
  if (months === 3) return '每季度'
  if (months === 6) return '每半年'
  if (months === 12) return '每年'
  return `每${months}个月`
}

interface TPlanCardViewModel {
  planId: string
  planType: TSubscriptionPlan['planType']
  planName: string
  planDescription: string
  features: string[]
  isRecommended: boolean
  isActive: boolean
  selectedMonths: number
  durationOptions: number[]
  buttonType: 'primary' | 'default' | 'link'
  buttonText: string
  price: {
    final: number
    discounted: number
    original: number
    discount: number
  }
  pointsHint?: {
    annualDeductedPoint: number
    pointsBalance: number
    deductedAmount: number
    deductibleAmount: number
  }
}

const buildPlanCardModel = (
  plan: TSubscriptionPlan,
  selectedMonths: number,
  calculatedPrice: TCalculateSubscriptionAmountResponse | undefined
): TPlanCardViewModel => {
  const pricing = calculatedPrice
    ? {
        original: calculatedPrice.originAmount,
        final: calculatedPrice.amount,
        discounted: calculatedPrice.discountedAmount,
        discount: calculatedPrice.discount,
      }
    : { original: 0, final: 0, discounted: 0, discount: 1 }

  return {
    planId: plan.planId,
    planType: plan.planType,
    planName: plan.planName,
    planDescription: plan.planDescription,
    features: FEATURES_MAP[plan.planType],
    isRecommended: !!plan.isRecommended || plan.planType === 'STANDARD',
    isActive: plan.isActive,
    selectedMonths,
    buttonType:
      plan.planType === 'PRIVATE'
        ? 'default'
        : plan.isRecommended
          ? 'primary'
          : 'default',
    buttonText:
      plan.planType === 'FREE'
        ? '立即体验'
        : plan.planType === 'PRIVATE'
          ? `点击复制客服邮箱咨询`
          : '立即订阅',
    durationOptions:
      plan.pricingRules.length > 0
        ? plan.pricingRules.map((item) => item.months)
        : [selectedMonths],
    price: pricing,
    pointsHint:
      plan.planType === 'STANDARD' && calculatedPrice
        ? {
            pointsBalance: calculatedPrice.pointsBalance,
            deductedAmount: calculatedPrice.pointDeductAmount,
            deductibleAmount: 120,
            annualDeductedPoint: calculatedPrice.annualDeductedPoint,
          }
        : undefined,
  }
}

interface PlanCardProps {
  loading: boolean
  plan: TSubscriptionPlan | null
  priceByMonth?: Record<number, TCalculateSubscriptionAmountResponse>
  onSubscribe: (planId: string, months: number) => void
}

const PlanCard: React.FC<PlanCardProps> = ({
  loading,
  plan,
  priceByMonth,
  onSubscribe,
}) => {
  const [selectedMonths, setSelectedMonths] = useState<number>(() =>
    plan ? getDefaultMonths(plan) : 0
  )

  const data = useMemo(
    () =>
      plan
        ? buildPlanCardModel(plan, selectedMonths, priceByMonth?.[selectedMonths])
        : null,
    [plan, selectedMonths, priceByMonth]
  )

  const isFree = data?.planType === 'FREE'
  const deductedPointAmount = Number(data?.pointsHint?.deductedAmount || 0)

  return (
    <div
      className={`relative rounded-lg transition-all duration-300 ${
        data?.isRecommended
          ? 'z-10 scale-100 border-2 border-blue-500 bg-linear-to-br from-blue-50 to-purple-50 shadow-2xl md:scale-105'
          : 'border border-gray-200 bg-white shadow-lg hover:shadow-xl'
      }`}
    >
      {data?.isRecommended && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
          <div className="rounded-full bg-linear-to-r from-blue-600 to-purple-600 px-6 py-1 text-sm font-semibold text-white shadow-lg">
            最受欢迎
          </div>
        </div>
      )}
      {loading || !data ? (
        <div className="min-h-[594px] p-8">
          <Skeleton active paragraph={{ rows: 7 }} />
        </div>
      ) : (
        <div className="p-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold lg:text-2xl">{data.planName}</h3>
            </div>
            {data.durationOptions.length > 1 && (
              <Radio.Group
                value={data.selectedMonths}
                onChange={(e) => setSelectedMonths(e.target.value)}
                size="small"
                buttonStyle="solid"
              >
                {data.durationOptions.map((months) => (
                  <Radio.Button key={months} value={months}>
                    {getDurationLabel(months)}
                  </Radio.Button>
                ))}
              </Radio.Group>
            )}
          </div>
          <p className="mb-4 text-sm text-gray-600 lg:text-base">
            {data.planDescription}
          </p>
          <div className="mb-2 min-h-[90px]">
            <div className="mb-2 flex items-end gap-2">
              <div className="flex flex-col gap-0">
                <span className="h-5">{isFree ? '' : '活动价'}</span>
                <span className="text-3xl font-bold lg:text-4xl xl:text-5xl">
                  ¥{formatMoney(data.price.discounted)}
                </span>
              </div>
              {data.price.discount < 1 && (
                <span className="text-base text-gray-400 line-through lg:text-lg xl:text-xl">
                  原价¥{formatMoney(data.price.original)}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {deductedPointAmount > 0 &&
                Number.isFinite(deductedPointAmount) && (
                  <span className="inline-block rounded-full bg-red-100 px-3 py-0.5 text-sm text-red-600">
                    积分抵扣 ¥
                    {formatMoney(data?.pointsHint?.deductedAmount || '')}
                  </span>
                )}
            </p>
            {
              isFree && (
                <p className="text-base text-gray-600">
                  永久免费
                </p>
              )
            }
            {data.selectedMonths > 1 &&
              data.price.final === data.price.discounted &&
              deductedPointAmount <= 0 &&
              !isFree && (
                <p className="text-base text-gray-600">
                  {getPeriodText(data.selectedMonths)} · 平均每月 ¥
                  {formatMoney(data.price.discounted / data.selectedMonths)}
                </p>
              )}
          </div>
          <Button
            type={data.buttonType}
            size="large"
            block
            disabled={!data.isActive}
            onClick={() => onSubscribe(data.planId, data.selectedMonths)}
            className={`-mt-[2px] mb-8 h-[48px] rounded-lg text-sm font-semibold lg:text-base ${
              data.isRecommended
                ? 'bg-linear-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                : ''
            }`}
          >
            {data.price.final !== data.price.discounted && (
              <span className="mr-2">
                实际支付 ¥{formatMoney(data.price.final)}
              </span>
            )}
            {data.buttonText}
          </Button>

          <div className="space-y-4">
            <div className="mb-3 text-xs font-semibold text-gray-900 lg:text-sm">
              包含功能：
            </div>
            {data.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-1">
                <CheckOutlined
                  className={`mt-0.5 shrink-0 ${
                    data.isRecommended ? 'text-blue-600' : 'text-green-600'
                  }`}
                />
                <span className="text-sm text-gray-700 lg:text-base">
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {data.pointsHint ? (
            <div className="mt-6 rounded-sm border border-green-200 bg-green-50 p-2">
              <p className="text-xs leading-7 text-green-600 lg:text-sm">
                当前积分：{data.pointsHint.pointsBalance}
                ，自动抵扣：¥{formatMoney(data.pointsHint.deductedAmount)}
                ，每年最高可抵扣：¥
                {formatMoney(data.pointsHint.deductibleAmount)}，今年已抵扣：¥
                {data.pointsHint.annualDeductedPoint}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default PlanCard
