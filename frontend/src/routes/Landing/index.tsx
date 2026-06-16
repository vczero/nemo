import { useEffect } from 'react'
import { Divider, Layout } from 'antd'
import { useSearchParams } from 'react-router'
import Header from '@/components/Header'
import AllApps from '@/components/AllApps'
import { appList } from '@/constants/apps'
import { saveInviteCode } from '@/utils/utils'
import { useSysConfig } from '@/hooks/useSysConfig'
import qrcodeWx from '@/assets/qrcode_wx.jpg'
import Image from '@/components/Image'

const { Header: AntHeader, Content, Footer } = Layout

const userLogos = Object.values(
  import.meta.glob('@/assets/users/*.png', { eager: true, import: 'default' })
) as string[]

export default function Landing() {
  const [searchParams] = useSearchParams()
  const sysConfig = useSysConfig()
  const banner = sysConfig?.viewConfig?.banner

  useEffect(() => {
    const inviteCode =
      searchParams.get('inviteCode') || searchParams.get('invite_code')
    if (inviteCode) {
      saveInviteCode(inviteCode)
    }
  }, [searchParams])

  const bannerImg = banner?.imageUrl ? (
    <img
      src={banner.imageUrl}
      alt="banner"
      className="h-auto w-full rounded-sm object-cover"
    />
  ) : null

  return (
    <Layout className="relative min-h-screen bg-gray-50">
      <AntHeader className="sticky top-0 z-10 w-full border-b border-gray-300 bg-white">
        <Header />
      </AntHeader>
      <Content className="mx-auto h-full w-full max-w-7xl min-w-sm px-6 py-6">
        {bannerImg && (
          <div className="mb-6">
            {banner?.link ? (
              <a
                href={banner.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {bannerImg}
              </a>
            ) : null}
          </div>
        )}
        <AllApps apps={appList} />

        
      </Content>
      <Footer className="w-full bg-gray-50">
        <div className="text-center text-sm text-gray-400">
          Copyright © 2026{' '}
        </div>
        <div className="text-center text-sm text-gray-400">
          Nemo开源团队 <Divider orientation="vertical" />{' '}
          让数据绽放美丽
        </div>
      </Footer>
    </Layout>
  )
}
