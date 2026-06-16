import { useEffect, useMemo, useState } from 'react'
import { Layout, Result } from 'antd'
import {  useSearchParams } from 'react-router'
import { ChartCategory, ChartPurpose, ChartType, getAllChartDefinitions } from '@/chart'
import { useDebounce } from 'react-use'
import Sidebar from './components/sidebar/index.tsx'
import { ChartCard } from '@/components/ChartCard/index.tsx'

const { Sider, Content } = Layout

function getImageUrl(fileName: string) {
  return new URL(`/src/assets/chart_imgs/${fileName}`, import.meta.url).href;
}

export default function ChartHome() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState<ChartCategory | 'all'>((searchParams.get('c') as ChartCategory) || 'all')
  const [selectedPurpose, setSelectedPurpose] = useState<ChartPurpose | 'all'>((searchParams.get('p') as ChartPurpose) || 'all')
  const [keywords, setKeywords] = useState<string>(searchParams.get('k') || '')


  const [, cancel] = useDebounce(() => {
    setSearchParams({ c: selectedCategory, p: selectedPurpose, k: keywords })
  }, 400, [selectedCategory, selectedPurpose, keywords])

  useEffect(() => {
    return () => cancel()
  }, [])

  const filteredCharts = useMemo(() => {
    return Object.entries(getAllChartDefinitions()).filter(([, chart]) => {
      const categoryMatch =
        selectedCategory === 'all' || chart.category.includes(selectedCategory)
      const purposeMatch =
        selectedPurpose === 'all' || chart.purpose.includes(selectedPurpose)

      const keywordsLower = keywords.toLowerCase()
      const keywordsMatch =
        !keywords ||
        chart.name.toLowerCase().includes(keywordsLower) ||
        chart.enName.toLowerCase().includes(keywordsLower) ||
        chart.description.toLowerCase().includes(keywordsLower)

      return categoryMatch && purposeMatch && keywordsMatch
    })
  }, [selectedCategory, selectedPurpose, keywords])

  return (
    <Layout className="relative h-full w-full min-w-[990px] overflow-hidden">
      <Sider
        width="256px"
        theme="light"
        className="inset-inline-0 scrollbar-thin sticky top-0 h-full overflow-y-auto border-r border-gray-200 bg-white shadow-sm"
      >
        <Sidebar
          selectedCategory={selectedCategory}
          onSelectedCategoryChange={(val) => setSelectedCategory(val as ChartCategory | 'all')}
          selectedPurpose={selectedPurpose}
          onSelectedPurposeChange={(val) => setSelectedPurpose(val as ChartPurpose | 'all')}
          keywords={keywords}
          onKeywordsChange={(val) => setKeywords(val)}
        />
      </Sider>
      <Content className="h-full w-full overflow-auto bg-gray-50 p-4">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5">
          {filteredCharts.map(([key, chart]) => (
            <ChartCard
              key={key}
              link={`/my-charts/edit?id=${chart?.demos[0]?.chartId}`}
              title={chart.name}
              subtitle={chart.enName}
              image={chart.type === ChartType.MAP ? getImageUrl('map.png') : getImageUrl(`${chart.type}.svg`)}
            />
          ))}

          {
            filteredCharts.length === 0 && (
              <div className="col-span-full">
                <Result status="404" title="未找到图表" subTitle="请更换搜索条件" />
              </div>
            )
          }
        </div>
      </Content>
    </Layout>
  )
}
