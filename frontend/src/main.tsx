import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router';
import { SWRConfig, type SWRConfiguration } from 'swr';
import { StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider, App } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

import './index.css'

import { router } from '@/routes';
import { UserProvider } from '@/contexts/UserContext';
import { MessageProvider } from '@/contexts/MessageContext';
import { fetcher } from '@/utils/fetcher';

dayjs.locale('zh-cn');

const THEME_CONFIG = {
  token: {
    borderRadius: 2,
  },
}

const swrConfig: SWRConfiguration = {
  fetcher: fetcher,
  refreshInterval: 0,
  revalidateOnFocus: false,
  // revalidateIfStale: false,
  // revalidateOnMount: false,
  shouldRetryOnError: false,
  loadingTimeout: 5000,
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SWRConfig value={swrConfig}>
    <StyleProvider layer>
      <ConfigProvider locale={zhCN} theme={THEME_CONFIG}>
        <App>
          <MessageProvider>
            <UserProvider>
              <RouterProvider router={router} />
            </UserProvider>
          </MessageProvider>
        </App>
      </ConfigProvider>
    </StyleProvider>
    </SWRConfig>
  </StrictMode>,
)
