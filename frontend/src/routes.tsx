import { createBrowserRouter, Outlet } from 'react-router'
import { buildRoutes, type RouteConfig } from './utils/router'
import ErrorBoundary from '@/components/ErrorBoundary'
import NavigationProgress from '@/components/NavigationProgress'

const RootLayout = () => (
  <>
    <NavigationProgress />
    <Outlet />
  </>
)

const routeConfig: RouteConfig[] = [
  {
    ErrorBoundary: ErrorBoundary,
    Component: RootLayout,
    children: [
      {
        path: '/',
        lazy: () => import('@/routes/Landing'),
      },
      {
        path: '/signin',
        lazy: () => import('@/routes/Signin'),
      },
      {
        path: '/signup',
        lazy: () => import('@/routes/Signin'),
      },
      {
        path: '/reset-password',
        lazy: () => import('@/routes/Signin'),
      },
      {
        path: '/my-charts/edit',
        lazy: () => import('@/routes/ChartEditor'),
      },
      {
        path: '/subscription',
        lazy: () => import('@/routes/Subscription'),
      },
      {
        path: '/topup',
        lazy: () => import('@/routes/TopUp'),
      },
      {
        path: '/payment-success',
        lazy: () => import('@/routes/PaymentSuccess'),
      },
      {
        path: '/sharedata',
        lazy: () => import('@/routes/ShareData'),
      },
      {
        lazy: () => import('@/components/AppCenterLayout'),
        middlewares: [
          // 管理员登录验证中间件
          // () => import('@/middlewares/AdminAuthMiddleware'),
        ],
        children: [
          {
            path: '/profile',
            lazy: () => import('@/routes/Profile'),
          },
          {
            path: '/my-charts',
            lazy: () => import('@/routes/MyCharts'),
          },
          {
            path: '/messages',
            lazy: () => import('@/routes/Messages'),
          },
          {
            path: '/benefits',
            lazy: () => import('@/routes/Benefits'),
          },
          {
            path: '/tasks',
            lazy: () => import('@/routes/Tasks'),
          },
          {
            path: '/orders',
            lazy: () => import('@/routes/Orders'),
          },
          {
            path: '/invoicing',
            lazy: () => import('@/routes/Invoicing'),
          },
          {
            path: '/invoice-history',
            lazy: () => import('@/routes/InvoiceHistory'),
          },
          {
            path: '/apps/center',
            lazy: () => import('@/routes/AppCenter'),
              },
          {
            path: '/apps/charts',
            lazy: () => import('@/routes/ChartList'),
          },
          {
            path: '/apps/task',
            lazy: () => import('@/routes/Task'),
              },
          {
            path: '/apps/storytelling',
            lazy: () => import('@/routes/Storytelling'),
          },
          {
            path: '/apps/storytelling/edit',
            lazy: () => import('@/routes/Storytelling/Edit'),
          },
        ],
      },
    ],
  },
]

export const routes = buildRoutes(routeConfig)

export const router = createBrowserRouter(routes)
