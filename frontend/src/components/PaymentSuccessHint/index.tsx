import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { getSafeFromPath } from '@/utils/utils'

interface PaymentSuccessHintProps {
  /** 没有 from 参数时的默认跳转路径，默认 /apps/center */
  defaultPath?: string
  /** 没有 from 参数时的链接文案，默认 "回到首页" */
  defaultLabel?: string
}

const PaymentSuccessHint: React.FC<PaymentSuccessHintProps> = ({
  defaultPath = '/apps/center',
  defaultLabel = '回到首页',
}) => {
  const [searchParams] = useSearchParams()
  const fromPath = useMemo(
    () => getSafeFromPath(searchParams.get('from')),
    [searchParams]
  )

  return (
    <div className="mt-8 mb-16 text-center">
      <h4 className="mb-4 text-lg font-bold">🎉🎉🎉 购买成功 🎉🎉🎉</h4>
      <p>
        点击
        {fromPath ? (
          <Link to={fromPath}>此处</Link>
        ) : (
          <Link to={defaultPath}>此处</Link>
        )}
        {fromPath ? '回到上一页' : defaultLabel}
        ，或到
        <Link to="/orders">我的订单</Link>
        查看支付记录
      </p>
    </div>
  )
}

export default PaymentSuccessHint
