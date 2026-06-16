import { Layout, type MenuProps, Menu } from 'antd'
import { Link, useLocation, Outlet } from 'react-router'
import Header from '@/components/Header'
import { useEffect, useState } from 'react'

import {
  AppstoreOutlined,
  GiftOutlined,
  ControlOutlined,
  FileTextOutlined,
  HistoryOutlined,
  PayCircleOutlined,
  UnorderedListOutlined,
  UserOutlined,
  FundProjectionScreenOutlined,
  WalletOutlined,
} from '@ant-design/icons'

import { appList } from '@/constants/apps'

const { Header: AntHeader, Sider, Content } = Layout

const items: MenuProps['items'] = [
  {
    key: '/apps',
    icon: <AppstoreOutlined />,
    label: '应用中心',
    children: [
      { key: '/apps/center', label: <Link to="/apps/center">所有应用</Link> },
      ...appList.map((app) => ({
        key: app.path,
        label: <Link to={app.path}>{app.title}</Link>,
      })),
    ],
  },
  {
    key: '/my-charts',
    icon: <FundProjectionScreenOutlined />,
    label: <Link to="/my-charts">我的图表</Link>,
  },
  {
    key: '/tasks',
    icon: <ControlOutlined />,
    label: <Link to="/tasks">计算任务</Link>,
  },
  {
    key: '/profile',
    icon: <UserOutlined />,
    label: <Link to="/profile">用户信息</Link>,
  },
  {
    key: '/benefits',
    icon: <GiftOutlined />,
    label: <Link to="/benefits">带新福利</Link>,
  },
  {
    key: '/subscription',
    icon: <PayCircleOutlined />,
    label: <Link to="/subscription">充值订阅</Link>,
  },
  {
    key: '/topup',
    icon: <WalletOutlined />,
    label: <Link to="/topup">加购流量包</Link>,
  },
  {
    key: '/orders',
    icon: <UnorderedListOutlined />,
    label: <Link to="/orders">我的订单</Link>,
  },
  {
    key: '/invoicing',
    icon: <FileTextOutlined />,
    label: <Link to="/invoicing">发票开具</Link>,
  },
  {
    key: '/invoice-history',
    icon: <HistoryOutlined />,
    label: <Link to="/invoice-history">发票记录</Link>,
  },
]

const menuStyles = {
  root: {
    paddingBottom: '32px',
    borderRight: 'none',
  },
  item: {
    marginLeft: 0,
    marginRight: 0,
    borderRadius: 0,
    width: '100%',
  },
  itemTitle: {
    marginLeft: 0,
    marginRight: 0,
    borderRadius: 0,
    width: '100%',
  },
  subMenu: {
    item: {
      marginLeft: 0,
      marginRight: 0,
      borderRadius: 0,
      width: '100%',
    },
  },
}

export default function ProfileLayout() {
  const location = useLocation()
  const [openKeys, setOpenKeys] = useState<string[]>(['/apps'])
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])

  useEffect(() => {
    const pathname = location.pathname
    const search = new URLSearchParams(location.search)
    const taskTypeParam = search.get('taskType')

    if (taskTypeParam) {
    // 对于 /apps/task?taskType=xxx 路由，用 pathname+taskType 作为匹配 key
      setSelectedKeys([`${pathname}?taskType=${taskTypeParam}`])
    } else {
      if (pathname === '/apps/storytelling/edit') {
        setSelectedKeys(['/apps/storytelling'])
      } else {
        setSelectedKeys([pathname])
      }
    }

    if (pathname.startsWith('/apps')) {
      if (!openKeys.includes('/apps')) {
        setOpenKeys([...openKeys, '/apps'])
      }
    }
  }, [location.pathname, location.search])

  const onOpenChange: MenuProps['onOpenChange'] = (keys) => {
    setOpenKeys(keys as string[])
  }

  return (
    <Layout className="relative h-screen w-screen overflow-hidden bg-gray-50">
      <AntHeader className="sticky top-0 z-10 w-full border-b border-gray-200 bg-white">
        <Header></Header>
      </AntHeader>
      <Layout>
        <Sider
          width="280px"
          theme="light"
          breakpoint="xl"
          collapsedWidth="50px"
          className="inset-inline-0 scrollbar-thin sticky top-0 h-screen overflow-y-auto border-r border-gray-200 bg-white shadow-sm"
        >
          <Menu
            mode="inline"
            selectedKeys={selectedKeys}
            openKeys={openKeys}
            onOpenChange={onOpenChange}
            items={items}
            styles={menuStyles}
          />
        </Sider>
        <Content className="h-full w-full overflow-auto bg-gray-50">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
