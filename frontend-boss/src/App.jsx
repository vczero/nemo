import React, { useState, createContext, useContext, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu, Dropdown, Avatar, message, Button, ConfigProvider, theme } from 'antd'
import { UserOutlined, GiftOutlined, LogoutOutlined, BellOutlined, FileTextOutlined, ShopOutlined, MenuFoldOutlined, MenuUnfoldOutlined, SettingOutlined, OrderedListOutlined, TeamOutlined, MoonOutlined, SunOutlined, ApiOutlined, CloudServerOutlined, ProfileOutlined } from '@ant-design/icons'
import Login from './pages/Login'
import UserManagement from './pages/user/UserManagement'
import BossUserRelationManagement from './pages/user/BossUserRelationManagement'
import UserNotificationManagement from './pages/user/UserNotificationManagement'
import InvitationCodeManagement from './pages/InvitationCodeManagement'
import NotificationManagement from './pages/NotificationManagement'
import AgreementManagement from './pages/AgreementManagement'
import PlanManagement from './pages/subscription/PlanManagement'
import ProductManagement from './pages/subscription/ProductManagement'
import ComputeEndpointManagement from './pages/compute/ComputeEndpointManagement'
import ComputeTaskManagement from './pages/compute/ComputeTaskManagement'
import LlmLogManagement from './pages/llmLog/LlmLogManagement'
import TokenUsageRecordManagement from './pages/tokenUsage/TokenUsageRecordManagement'
import PaymentConfigManagement from './pages/paymentConfig/PaymentConfigManagement'
import OrderManagement from './pages/order/OrderManagement'
import InvoiceManagement from './pages/invoice/InvoiceManagement'
import ChannelOrderManagement from './pages/channelOrder/ChannelOrderManagement'
import ChannelNameConfig from './pages/channelConfig/ChannelNameConfig'
import ViewConfig from './pages/viewConfig/ViewConfig'
import { logout } from './services/user'
import NautilusIcon from './components/NautilusIcon'
import './styles/NautilusLayoutOptimized.css'

// Theme context
const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
})

const { Header, Content, Sider } = Layout

const MainLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const [collapsed, setCollapsed] = useState(false)
  const { isDark, toggleTheme } = useContext(ThemeContext)

  if (!userStr) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = async () => {
    try {
      await logout()
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      message.success('注销成功')
      navigate('/login')
    } catch (error) {
      message.error('注销失败')
    }
  }

  const toggleCollapsed = () => {
    setCollapsed(!collapsed)
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '注销',
      onClick: handleLogout,
    },
  ]

  const menuItems = [
    {
      key: 'transaction',
      icon: <OrderedListOutlined />,
      label: '交易管理',
      children: [
        { key: '/orders', icon: <OrderedListOutlined />, label: <Link to="/orders">订单管理</Link> },
        { key: '/channel-orders', icon: <ShopOutlined />, label: <Link to="/channel-orders">渠道订单</Link> },
        { key: '/invoices', icon: <FileTextOutlined />, label: <Link to="/invoices">开票管理</Link> },
      ],
    },
    {
      key: 'user-channel',
      icon: <TeamOutlined />,
      label: '用户渠道',
      children: [
        { key: '/users', icon: <UserOutlined />, label: <Link to="/users">用户管理</Link> },
        { key: '/invitation-codes', icon: <GiftOutlined />, label: <Link to="/invitation-codes">邀请码管理</Link> },
        { key: '/boss-users', icon: <TeamOutlined />, label: <Link to="/boss-users">系统用户</Link> },
        { key: '/user-notifications', icon: <BellOutlined />, label: <Link to="/user-notifications">用户通知</Link> },
      ],
    },
    {
      key: 'product',
      icon: <ShopOutlined />,
      label: '产品订阅',
      children: [
        { key: '/subscription-plans', icon: <ShopOutlined />, label: <Link to="/subscription-plans">套餐管理</Link> },
        { key: '/products', icon: <ShopOutlined />, label: <Link to="/products">产品管理</Link> },
      ],
    },
    {
      key: 'compute',
      icon: <CloudServerOutlined />,
      label: '计算服务',
      children: [
        { key: '/compute-endpoints', icon: <CloudServerOutlined />, label: <Link to="/compute-endpoints">计算服务</Link> },
        { key: '/compute-tasks', icon: <ProfileOutlined />, label: <Link to="/compute-tasks">计算任务</Link> },
        { key: '/llm-logs', icon: <ApiOutlined />, label: <Link to="/llm-logs">LLM日志</Link> },
        { key: '/token-usage-records', icon: <OrderedListOutlined />, label: <Link to="/token-usage-records">Token消耗</Link> },
      ],
    },
    {
      key: 'operations',
      icon: <SettingOutlined />,
      label: '系统运营',
      children: [
        { key: '/channel-names', icon: <ShopOutlined />, label: <Link to="/channel-names">渠道配置</Link> },
        { key: '/notifications', icon: <BellOutlined />, label: <Link to="/notifications">系统通知</Link> },
        { key: '/agreements', icon: <FileTextOutlined />, label: <Link to="/agreements">协议管理</Link> },
        { key: '/payment-config', icon: <SettingOutlined />, label: <Link to="/payment-config">支付配置</Link> },
        { key: '/view-config', icon: <SettingOutlined />, label: <Link to="/view-config">视图配置</Link> },
      ],
    },
  ]

  const getPageInfo = (pathname) => {
    const pages = {
      '/orders': { title: '订单管理', icon: <OrderedListOutlined /> },
      '/channel-orders': { title: '渠道订单', icon: <ShopOutlined /> },
      '/channel-names': { title: '渠道配置', icon: <ShopOutlined /> },
      '/invoices': { title: '开票管理', icon: <FileTextOutlined /> },
      '/users': { title: '用户管理', icon: <UserOutlined /> },
      '/invitation-codes': { title: '邀请码管理', icon: <GiftOutlined /> },
      '/subscription-plans': { title: '套餐管理', icon: <ShopOutlined /> },
      '/products': { title: '产品管理', icon: <ShopOutlined /> },
      '/notifications': { title: '系统通知', icon: <BellOutlined /> },
      '/agreements': { title: '协议管理', icon: <FileTextOutlined /> },
      '/payment-config': { title: '支付配置', icon: <SettingOutlined /> },
      '/compute-endpoints': { title: '计算服务', icon: <CloudServerOutlined /> },
      '/compute-tasks': { title: '计算任务', icon: <ProfileOutlined /> },
      '/llm-logs': { title: 'LLM日志', icon: <ApiOutlined /> },
      '/token-usage-records': { title: 'Token消耗记录', icon: <OrderedListOutlined /> },
      '/boss-users': { title: '系统用户管理', icon: <TeamOutlined /> },
      '/user-notifications': { title: '用户通知', icon: <BellOutlined /> },
      '/view-config': { title: '视图配置', icon: <SettingOutlined /> },
    }
    return pages[pathname] || { title: 'NemoCopilot', icon: <NautilusIcon size={24} /> }
  }

  const currentPageInfo = getPageInfo(location.pathname)

  return (
    <Layout className="nautilus-layout">
      <Sider
        className="nautilus-sider"
        width={220}
        collapsible
        collapsed={collapsed}
        onCollapse={toggleCollapsed}
        trigger={null}
      >
        <div className="nautilus-logo-container">
          <NautilusIcon size={collapsed ? 32 : 48} />
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="nautilus-menu"
          inlineCollapsed={collapsed}
          defaultOpenKeys={['transaction', 'user-channel', 'product', 'compute']}
          collapsible
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 64 : 220 }}>
        <Header className="nautilus-header">
          <div className="nautilus-header-decoration" />
          <div className="nautilus-header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleCollapsed}
              className="nautilus-collapse-btn"
            />
            <span style={{ fontSize: 20, marginRight: 10, display: 'flex', alignItems: 'center' }}>
              {currentPageInfo.icon}
            </span>
            <h2 className="nautilus-header-title">
              {currentPageInfo.title}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="theme-toggle-group">
              <span
                className={`theme-icon ${!isDark ? 'active' : ''}`}
                onClick={() => isDark && toggleTheme()}
                title="浅色模式"
              >
                <SunOutlined />
              </span>
              <span
                className={`theme-icon ${isDark ? 'active' : ''}`}
                onClick={() => !isDark && toggleTheme()}
                title="深色模式"
              >
                <MoonOutlined />
              </span>
            </div>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Avatar
                  className="nautilus-user-avatar"
                  size={28}
                >
                  {user?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
                <span className="nautilus-user-name">
                  {user?.username || user?.email || 'Admin'}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="nautilus-content">
          <Routes>
            <Route path="/users" element={<UserManagement />} />
            <Route path="/boss-users" element={<BossUserRelationManagement />} />
            <Route path="/user-notifications" element={<UserNotificationManagement />} />
            <Route path="/orders" element={<OrderManagement />} />
            <Route path="/channel-orders" element={<ChannelOrderManagement />} />
            <Route path="/channel-names" element={<ChannelNameConfig />} />
            <Route path="/invoices" element={<InvoiceManagement />} />
            <Route path="/subscription-plans" element={<PlanManagement />} />
            <Route path="/products" element={<ProductManagement />} />
            <Route path="/compute-endpoints" element={<ComputeEndpointManagement />} />
            <Route path="/compute-tasks" element={<ComputeTaskManagement />} />
            <Route path="/llm-logs" element={<LlmLogManagement />} />
            <Route path="/token-usage-records" element={<TokenUsageRecordManagement />} />
            <Route path="/invitation-codes" element={<InvitationCodeManagement />} />
            <Route path="/notifications" element={<NotificationManagement />} />
            <Route path="/agreements" element={<AgreementManagement />} />
            <Route path="/payment-config" element={<PaymentConfigManagement />} />
            <Route path="/view-config" element={<ViewConfig />} />
            <Route path="/" element={<Navigate to="/users" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

const App = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved === 'dark'
  })

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [isDark])

  const toggleTheme = () => {
    setIsDark(prev => {
      const newValue = !prev
      localStorage.setItem('theme', newValue ? 'dark' : 'light')
      return newValue
    })
  }

  const antTheme = isDark ? {
    algorithm: theme.darkAlgorithm,
    token: {
      colorPrimary: '#00d4ff',
      colorBgLayout: '#000a14',
      colorBgContainer: 'rgba(10, 30, 50, 0.8)',
      colorBgElevated: 'rgba(20, 40, 60, 0.9)',
      colorBgSpotlight: 'rgba(20, 40, 60, 0.95)',
      colorBorder: 'rgba(0, 150, 255, 0.2)',
      colorBorderSecondary: 'rgba(0, 150, 255, 0.15)',
      colorText: '#e0f0ff',
      colorTextSecondary: 'rgba(180, 210, 255, 0.8)',
      colorTextTertiary: 'rgba(150, 180, 220, 0.6)',
      colorTextQuaternary: 'rgba(120, 150, 200, 0.4)',
      colorFill: 'rgba(10, 30, 50, 0.4)',
      colorFillSecondary: 'rgba(10, 30, 50, 0.3)',
      colorFillTertiary: 'rgba(10, 30, 50, 0.2)',
      colorFillQuaternary: 'rgba(10, 30, 50, 0.1)',
    },
    components: {
      Table: {
        headerBg: 'rgba(10, 30, 50, 0.8)',
        headerColor: '#b0d0f0',
        headerSortActiveBg: 'rgba(10, 30, 50, 0.9)',
        headerSortHoverBg: 'rgba(10, 30, 50, 0.85)',
        rowHoverBg: 'rgba(0, 150, 255, 0.1)',
        borderColor: 'rgba(0, 150, 255, 0.15)',
        colorBgContainer: 'rgba(10, 30, 50, 0.4)',
        colorText: '#e0f0ff',
        colorTextSecondary: 'rgba(180, 210, 255, 0.8)',
      },
      Input: {
        colorBgContainer: 'rgba(10, 30, 50, 0.8)',
        colorBorder: 'rgba(0, 150, 255, 0.2)',
        activeBorderColor: 'rgba(0, 200, 255, 0.4)',
        hoverBorderColor: 'rgba(0, 200, 255, 0.3)',
        colorText: '#e0f0ff',
        colorPlaceholderText: 'rgba(180, 210, 255, 0.5)',
      },
      Select: {
        colorBgContainer: 'rgba(10, 30, 50, 0.8)',
        colorBgElevated: 'rgba(10, 30, 50, 0.95)',
        colorBorder: 'rgba(0, 150, 255, 0.2)',
        optionSelectedBg: 'rgba(0, 150, 255, 0.2)',
        colorText: '#e0f0ff',
        colorTextDescription: 'rgba(180, 210, 255, 0.8)',
        colorBgSpotlight: 'rgba(10, 30, 50, 0.95)',
      },
      Button: {
        defaultBg: 'rgba(10, 30, 50, 0.8)',
        defaultColor: '#e0f0ff',
        defaultBorderColor: 'rgba(0, 150, 255, 0.2)',
        defaultHoverBg: 'rgba(20, 40, 60, 0.9)',
        defaultHoverColor: '#00d4ff',
        defaultHoverBorderColor: 'rgba(0, 200, 255, 0.4)',
        primaryShadow: '0 4px 15px rgba(0, 150, 255, 0.3)',
        defaultShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      },
      Card: {
        colorBgContainer: 'rgba(10, 30, 50, 0.6)',
        colorBorderSecondary: 'rgba(0, 150, 255, 0.15)',
        colorText: '#e0f0ff',
      },
      Modal: {
        colorBgElevated: 'rgba(10, 30, 50, 0.95)',
        colorBgMask: 'rgba(0, 0, 0, 0.6)',
        colorText: '#e0f0ff',
        colorTextTitle: '#e0f0ff',
        colorTextDescription: 'rgba(180, 210, 255, 0.8)',
      },
      Menu: {
        darkItemBg: 'transparent',
        darkItemSelectedBg: 'linear-gradient(90deg, rgba(0, 150, 255, 0.2) 0%, rgba(0, 200, 255, 0.25) 100%)',
        darkItemHoverBg: 'rgba(0, 150, 255, 0.1)',
        darkItemColor: 'rgba(180, 210, 255, 0.8)',
        darkItemSelectedColor: '#ffffff',
        itemColor: 'rgba(180, 210, 255, 0.8)',
        itemSelectedColor: '#ffffff',
        itemHoverBg: 'rgba(0, 150, 255, 0.1)',
        itemSelectedBg: 'linear-gradient(90deg, rgba(0, 150, 255, 0.2) 0%, rgba(0, 200, 255, 0.25) 100%)',
      },
      Dropdown: {
        colorBgElevated: 'rgba(10, 30, 50, 0.95)',
        colorText: '#e0f0ff',
        colorTextDescription: 'rgba(180, 210, 255, 0.8)',
      },
      Tabs: {
        inkBarColor: '#00d4ff',
        itemActiveColor: '#00d4ff',
        itemSelectedColor: '#00d4ff',
        itemHoverColor: '#00d4ff',
        itemColor: 'rgba(180, 210, 255, 0.7)',
      },
      Form: {
        labelColor: '#e0f0ff',
        labelRequiredMarkColor: '#ff6b6b',
      },
      DatePicker: {
        colorBgContainer: 'rgba(10, 30, 50, 0.8)',
        colorBgElevated: 'rgba(10, 30, 50, 0.95)',
        colorBorder: 'rgba(0, 150, 255, 0.2)',
        colorText: '#e0f0ff',
        colorTextDescription: 'rgba(180, 210, 255, 0.8)',
        colorTextTertiary: 'rgba(150, 180, 220, 0.6)',
      },
      Pagination: {
        itemBg: 'rgba(10, 30, 50, 0.6)',
        itemActiveBg: 'rgba(0, 150, 255, 0.2)',
        colorText: '#e0f0ff',
        colorPrimary: '#00d4ff',
      },
      Steps: {
        colorPrimary: '#00d4ff',
        colorTextDescription: 'rgba(180, 210, 255, 0.8)',
      },
      Tree: {
        colorBgContainer: 'transparent',
        colorText: '#e0f0ff',
        nodeHoverBg: 'rgba(0, 150, 255, 0.1)',
        nodeSelectedBg: 'rgba(0, 150, 255, 0.2)',
      },
      Popover: {
        colorBgElevated: 'rgba(10, 30, 50, 0.95)',
        colorText: '#e0f0ff',
      },
      Tooltip: {
        colorBgSpotlight: 'rgba(10, 30, 50, 0.95)',
        colorText: '#e0f0ff',
      },
      Tag: {
        colorBgContainer: 'rgba(0, 150, 255, 0.1)',
        colorBorder: 'rgba(0, 150, 255, 0.3)',
        colorText: '#00d4ff',
      },
      Checkbox: {
        colorBgContainer: 'rgba(10, 30, 50, 0.8)',
        colorBorder: 'rgba(0, 150, 255, 0.3)',
        colorPrimary: '#00d4ff',
        colorText: '#e0f0ff',
      },
      Radio: {
        colorBgContainer: 'rgba(10, 30, 50, 0.8)',
        colorBorder: 'rgba(0, 150, 255, 0.3)',
        colorPrimary: '#00d4ff',
        colorText: '#e0f0ff',
      },
      Switch: {
        colorPrimary: '#00d4ff',
        colorBgContainer: 'rgba(10, 30, 50, 0.8)',
        colorBgSpotlight: 'rgba(0, 150, 255, 0.3)',
      },
      Slider: {
        colorPrimary: '#00d4ff',
        colorBgBase: 'rgba(10, 30, 50, 0.8)',
        trackBg: '#00d4ff',
        trackHoverBg: '#00d4ff',
        handleColor: '#00d4ff',
        handleActiveColor: '#00d4ff',
        railBg: 'rgba(10, 30, 50, 0.8)',
        railHoverBg: 'rgba(10, 30, 50, 0.9)',
      },
      Empty: {
        colorText: 'rgba(180, 210, 255, 0.6)',
        colorTextDisabled: 'rgba(150, 180, 220, 0.4)',
      },
      Skeleton: {
        color: 'linear-gradient(90deg, rgba(10, 30, 50, 0.8) 25%, rgba(20, 40, 60, 0.9) 50%, rgba(10, 30, 50, 0.8) 75%)',
        gradientFromColor: 'rgba(10, 30, 50, 0.8)',
        gradientToColor: 'rgba(20, 40, 60, 0.9)',
      },
    },
  } : {
    algorithm: theme.defaultAlgorithm,
    token: {
      colorPrimary: '#0066cc',
      colorBgLayout: '#f5f7fa',
      colorBgContainer: '#ffffff',
      colorBgElevated: '#ffffff',
      colorBorder: '#d9d9d9',
      colorBorderSecondary: '#e8e8e8',
      colorText: '#1a1a1a',
      colorTextSecondary: '#666666',
      colorTextTertiary: '#999999',
    },
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <ConfigProvider theme={antTheme}>
        <Router basename="/">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<MainLayout />} />
          </Routes>
        </Router>
      </ConfigProvider>
    </ThemeContext.Provider>
  )
}

export default App
