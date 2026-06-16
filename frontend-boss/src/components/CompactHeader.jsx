import React from 'react'
import { Breadcrumb, Space, Typography } from 'antd'
import { HomeOutlined } from '@ant-design/icons'
import { useLocation, Link } from 'react-router-dom'

const { Text } = Typography

export const CompactBreadcrumb = ({ extra }) => {
  const location = useLocation()

  const breadcrumbItems = [
    {
      title: <HomeOutlined style={{ fontSize: 12 }} />,
    },
  ]

  const pathMap = {
    '/users': { title: '用户管理' },
    '/subscription-plans': { title: '订阅管理', parent: null },
    '/products': { title: '产品管理', parent: '/subscription-plans' },
    '/invitation-codes': { title: '邀请码管理' },
    '/notifications': { title: '系统通知' },
    '/agreements': { title: '协议管理' },
    '/payment-config': { title: '支付配置' },
  }

  const pageInfo = pathMap[location.pathname]

  if (pageInfo) {
    if (pageInfo.parent) {
      const parentInfo = pathMap[pageInfo.parent]
      if (parentInfo) {
        breadcrumbItems.push({
          title: <Link to={pageInfo.parent}>{parentInfo.title}</Link>,
        })
      }
    }
    breadcrumbItems.push({
      title: pageInfo.title,
    })
  }

  return (
    <div className="page-header">
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <Breadcrumb
          items={breadcrumbItems}
          style={{ fontSize: 13, color: '#a0c0e0', flex: 1 }}
          separator="/"
        />
        {extra && (
          <Space size="small">
            {extra}
          </Space>
        )}
      </div>
    </div>
  )
}

export const PageActionBar = ({ children }) => (
  <div className="action-bar" style={{ padding: '8px 16px' }}>
    <Space size="small" style={{ width: '100%', justifyContent: 'space-between' }}>
      {children}
    </Space>
  </div>
)

export const CompactTitle = ({ title, extra }) => (
  <div className="page-header" style={{ padding: '10px 16px', marginBottom: 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
      <Text strong style={{ fontSize: 15, color: '#e0f0ff' }}>
        {title}
      </Text>
      {extra && (
        <Space size="small">
          {extra}
        </Space>
      )}
    </div>
  </div>
)
