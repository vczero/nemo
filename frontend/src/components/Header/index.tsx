import { useState, useEffect } from 'react'
import { Dropdown, Badge, Skeleton, Menu, Button, Avatar, Divider } from 'antd'
import {
  DownOutlined,
  HomeOutlined,
  BarChartOutlined,
  CloudSyncOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { NavLink, useLocation, useNavigate } from 'react-router'
import { LOGOUT_ENDPOINT } from '@/apis'
import { fetcher } from '@/utils/fetcher'

import logo from '@/assets/ywllogo.png'
import { useUser } from '@/contexts/UserContext'
import { useSysConfig } from '@/hooks/useSysConfig'

const NAV_ITEMS = [
  { key: '/apps/center', icon: <HomeOutlined />, label: '首页' },
  { key: '/my-charts', icon: <BarChartOutlined />, label: '我的图表' },
  { key: '/tasks', icon: <CloudSyncOutlined />, label: '我的计算任务' },
]

export default function Header() {
  const { user, loading: isUserLoading, unreadMessages } = useUser()
  const sysConfig = useSysConfig()
  const extraMenus = sysConfig?.viewConfig?.menus ?? []
  const [isLoading, setIsLoading] = useState(false)

  const location = useLocation()
  const navigate = useNavigate()
  const [currentKey, setCurrentKey] = useState(location.pathname)

  useEffect(() => {
    const path = location.pathname
    if (path.startsWith('/apps')) setCurrentKey('/apps/center')
    else if (path.startsWith('/my-charts')) setCurrentKey('/my-charts')
    else if (path.startsWith('/tasks')) setCurrentKey('/tasks')
    else setCurrentKey(path)
  }, [location])

  const handleLogout = async () => {
    try {
      if (isLoading) return
      setIsLoading(true)
      await fetcher(LOGOUT_ENDPOINT, { method: 'POST' })
      setIsLoading(false)
      window.location.href = '/signin'
    } catch (error) {
      setIsLoading(false)
      console.error(error)
    }
  }

  // 用户下拉菜单项
  const userMenuItems = [
    { key: 'profile', label: <NavLink to="/profile">用户信息</NavLink> },
    { key: 'benefits', label: <NavLink to="/benefits">带新福利</NavLink> },
    {
      key: 'subscription',
      label: <NavLink to="/subscription">充值订阅</NavLink>,
    },
    { key: 'topup', label: <NavLink to="/topup">加购流量包</NavLink> },
    { key: 'orders', label: <NavLink to="/orders">我的订单</NavLink> },
    { type: 'divider' },
    { key: 'invoicing', label: <NavLink to="/invoicing">发票开具</NavLink> },
    {
      key: 'invoice-history',
      label: <NavLink to="/invoice-history">开票记录</NavLink>,
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      danger: true, // 危险操作标红
      onClick: handleLogout,
    },
  ]

  return (
    <div className="flex h-full w-full items-center justify-between backdrop-blur-md">
      <div
        className="flex h-full shrink-0 cursor-pointer items-center gap-2 py-2"
        onClick={() => navigate('/')}
      >
        <img
          src={logo}
          alt="Nemo"
          className="h-full w-[47px] object-contain"
        />
        <div className="flex flex-col">
          <h1 className="text-xl font-bold">Nemo数据分析</h1>
          <p className="text-sm text-gray-500">数据挖掘与可视化智能体</p>
        </div>
      </div>

      <div className="ml-[10px] flex-1 px-2 max-sm:hidden">
        {(!isUserLoading || extraMenus.length > 0) && (
          <Menu
            mode="horizontal"
            selectedKeys={[currentKey]}
            items={[
              ...NAV_ITEMS.map((item) => ({
                key: item.key,
                label: user ? (
                  <NavLink to={item.key}>{item.label}</NavLink>
                ) : (
                  <NavLink to="/signin">{item.label}</NavLink>
                ),
              })),
              ...extraMenus.map((menu, idx) => ({
                key: `external:${idx}`,
                label: (
                  <a href={menu.link} target="_blank" rel="noopener noreferrer">
                    {menu.name}
                  </a>
                ),
              })),
            ]}
          />
        )}
      </div>

      <div className="flex shrink-0 items-center gap-4">
        {isUserLoading ? (
          <div className="flex items-center gap-4 leading-1">
            <Skeleton.Avatar active size="default" />
            <Skeleton.Input active size="small" />
          </div>
        ) : user ? (
          <>
            <NavLink
              to="/messages"
              className="flex items-center text-gray-500 transition-colors hover:text-blue-600"
            >
              <Badge count={unreadMessages || 0} size="small" offset={[2, -2]}>
                <Button
                  type="text"
                  shape="circle"
                  icon={<BellOutlined style={{ fontSize: '18px' }} />}
                />
              </Badge>
            </NavLink>
            <Divider orientation="vertical" className="mx-0 h-6" />
            <Dropdown
              menu={{ items: userMenuItems as any }}
              placement="bottomRight"
              arrow
            >
              <div className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-gray-50">
                <Avatar
                  src={user?.avatarUrl}
                  icon={<UserOutlined />}
                  className="bg-blue-100 text-blue-600"
                />
                <div className="flex flex-col text-sm leading-tight max-sm:hidden">
                  <span className="max-w-[100px] truncate font-medium text-gray-700">
                    {user?.nickname || '用户'}
                  </span>
                </div>
                <DownOutlined className="text-xs text-gray-400" />
              </div>
            </Dropdown>
          </>
        ) : (
          <>
            <Button type="primary" onClick={() => navigate('/signin')}>
              登录
            </Button>
            <Button type="primary" onClick={() => navigate('/signup')}>
              注册
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
