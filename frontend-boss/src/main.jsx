import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import nautilusTheme from './theme/nautilusTheme'
import 'antd/dist/reset.css'

const importFonts = async () => {
  const link = document.createElement('link')
  link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Noto+Sans+SC:wght@300;400;700&display=swap'
  link.rel = 'stylesheet'
  document.head.appendChild(link)
}

importFonts()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN} theme={nautilusTheme}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
