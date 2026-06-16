import AppGrid from '@/components/AllApps'
import { appList } from '@/constants/apps'

import ContentWrapper from '@/components/ContentWrapper'
import { AppstoreOutlined } from '@ant-design/icons'

export default function AppCenter() {
  return (
    <ContentWrapper title="应用中心" icon={<AppstoreOutlined />} description="选择一个工具开始您的数据之旅" withSpace={false}>
      <AppGrid apps={appList} />
    </ContentWrapper>
  )
}
