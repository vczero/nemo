import React, { type ReactNode, useState, useEffect } from 'react'
import { Card, Typography, Tag, theme, Spin } from 'antd'
import { useNavigate } from 'react-router'
import { useUser } from '@/contexts/UserContext'

const { Title, Text } = Typography
const { useToken } = theme

export interface TAppTag {
  label: string
  color?: string
}

export interface TAppItem {
  id: string | number
  title: string
  description: string
  icon: ReactNode // 可以是图片 URL 或 Icon 组件
  path: string // 跳转路由路径
  tags?: TAppTag[] // 选填：右上角的标签
}

export interface TAppGridProps {
  apps: TAppItem[]
}

const AppGrid: React.FC<TAppGridProps> = ({ apps }) => {
  const navigate = useNavigate()
  const { user, loading: isUserLoading } = useUser()
  const { token } = useToken()
  const [pendingPath, setPendingPath] = useState<string | null>(null)

  // 处理点击跳转
  const handleAppClick = (path: string) => {
    if (isUserLoading) {
      setPendingPath(path)
      return
    }
    if (user) {
      navigate(path)
    } else {
      navigate('/signin')
    }
  }

  useEffect(() => {
    if (!isUserLoading && pendingPath) {
      if (user) {
        navigate(pendingPath)
      } else {
        navigate('/signin')
      }
      setPendingPath(null)
    }
  }, [isUserLoading, pendingPath, user, navigate])

  return (
    <div className="w-full">
      <Spin spinning={!!pendingPath}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <Card
              key={app.id}
              hoverable
              className="h-full rounded-none border-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              styles={{ body: { padding: '16px' } }}
              onClick={() => handleAppClick(app.path)}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-2xl"
                  style={{ color: token.colorPrimary }}
                >
                  {typeof app.icon === 'string' ? (
                    <img
                      src={app.icon}
                      alt={app.title}
                      className="h-8 w-8 object-contain"
                    />
                  ) : (
                    app.icon
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <Title level={5} className="m-0 mb-1 text-gray-800">
                      {app.title}
                    </Title>
                    {app.tags && app.tags.length > 0 && (
                      <div className="flex gap-1">
                        {app.tags.map((tag, idx) => (
                          <Tag
                            key={idx}
                            color={tag.color || 'blue'}
                            //  bordered={false}
                            className="mr-0 origin-right scale-90 rounded-full"
                          >
                            {tag.label}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>
                  <Text
                    type="secondary"
                    className="line-clamp-2 text-sm leading-relaxed"
                  >
                    {app.description}
                  </Text>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Spin>
    </div>
  )
}

export default AppGrid
