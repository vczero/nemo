import { useUser } from '@/contexts/UserContext'
import { Skeleton, Result, App } from 'antd'
import { Button } from 'antd'
import { useCallback } from 'react'
import { Navigate, useNavigate } from 'react-router'
import {
  SUBSCRIPTION_PERMISSION_GROUPS,
  type TPermission,
} from '@/constants/permission'
import type { TAccountSubscription } from '@/apis/types'

const Forbidden = ({
  mode,
  children,
  className,
  loading,
  error,
}: {
  mode: 'redirect' | 'render' | 'hide' | 'Alert'
  children?: React.ReactNode
  className?: string
  loading?: boolean
  error?: any
}) => {
  const navigate = useNavigate()
  const { modal } = App.useApp()

  if (loading && (mode === 'render' || mode === 'redirect')) {
    return <Skeleton active paragraph={{ rows: 5 }} />
  }

  if (error && (mode === 'render' || mode === 'redirect')) {
    return <Result status="500" title="获取用户信息失败，请稍后重试" subTitle={error.message} />
  }

  if (mode === 'redirect') {
    return <Navigate to="/subscription" />
  }

  if (mode === 'render') {
    return (
      <Result
        status="403"
        title="暂无权限"
        subTitle={
          <div>
            <p className="mb-2">您当前的套餐不支持此功能，请升级套餐</p>
            <Button type="primary" onClick={() => navigate('/subscription')}>
              去升级
            </Button>
          </div>
        }
      />
    )
  }

  if (mode === 'hide') {
    return null
  }

  if (mode === 'Alert') {
    const alert = (e: React.MouseEvent<HTMLSpanElement>) => {
      e?.stopPropagation()
      e?.preventDefault()
      modal.error({
        title: loading ? '加载中...' : error ? '获取用户信息失败，请稍后重试' : '暂无权限',
        content: loading ? '加载中...' : error ? error.message : '您当前的套餐不支持此功能，请升级套餐',
        onOk: () => loading || error ? undefined : navigate('/subscription'),
        onCancel: () => {},
        okText: loading || error ? '确定' : '去升级套餐',
        closable: true,
        okButtonProps: {
          type: 'primary',
        },
      })

      return false
    }

    return (
      <div
        onClickCapture={alert}
        onDoubleClickCapture={alert}
        onDragStartCapture={alert}
        onDropCapture={alert}
        onContextMenuCapture={alert}
        className={`${className || ''} relative`}
      >
        {children}
        <div
          className="absolute inset-0 z-10"
        />
      </div>
    )
  }
}

const getPermissionList = (plan: string) => {
  const defaultPermissionList = SUBSCRIPTION_PERMISSION_GROUPS.FREE
  if (plan && plan.toUpperCase) {
    return (
      SUBSCRIPTION_PERMISSION_GROUPS[
        plan.toUpperCase() as keyof typeof SUBSCRIPTION_PERMISSION_GROUPS
      ] ?? defaultPermissionList
    )
  }
  return defaultPermissionList
}

export const checkPermission = (
  permissionKey: TPermission | TPermission[],
  accountSubscription: TAccountSubscription | undefined
) => {
  const permissionList = getPermissionList(
    accountSubscription?.subscriptionStatus === 'ACTIVE' ? accountSubscription?.planType : 'FREE'
  )

  if (permissionList.length === 0) {
    return false
  }

  if (Array.isArray(permissionKey)) {
    if (permissionKey.every((item) => permissionList.includes(item))) {
      return true
    }
  } else if (typeof permissionKey === 'string') {
    if (permissionList.includes(permissionKey as TPermission)) {
      return true
    }
  }

  return false
}

export const usePermission = (permission: TPermission | TPermission[]) => {
  const { modal } = App.useApp()
  const navigate = useNavigate()
  const { isAccountSubscriptionLoading, accountSubscription } = useUser()

  const has = checkPermission(permission, accountSubscription)
  const alert = useCallback(() => {
    modal.error({
      title: '暂无权限',
      content: '您当前的套餐不支持此功能，请升级套餐',
      onOk: () => navigate('/subscription'),
      onCancel: () => {},
      okText: '去升级套餐',
      closable: true,
      okButtonProps: {
        type: 'primary',
      },
    })
    return false
  }, [navigate, modal])

  const guard = useCallback(() => {
    if (!has) {
      return alert()
    }
    return true
  }, [has, alert])

  return {
    hasPermission: has,
    guard,
    alert,
    loading: isAccountSubscriptionLoading,
  }
}

export default function Permission({
  children,
  permission,
  mode,
  className,
}: {
  children: React.ReactNode
  permission: TPermission | TPermission[]
  mode: 'redirect' | 'render' | 'hide' | 'Alert'
  className?: string
}) {
  const { isAccountSubscriptionLoading, accountSubscription, error, loading } =
    useUser()
  const _loading = isAccountSubscriptionLoading || loading

  const hasPermission = checkPermission(permission, accountSubscription)

  if (!hasPermission) {
    return <Forbidden mode={mode} children={children} className={className} loading={_loading} error={error} />
  }

  return children
}
