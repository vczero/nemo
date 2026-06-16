import { useState, useRef } from 'react'
import {
  FilePdfOutlined,
  // FilePptOutlined,
  FileImageOutlined,
  FundProjectionScreenOutlined,
  BulbOutlined,
} from '@ant-design/icons'
import { App, Breadcrumb, Button, Space } from 'antd'
import {
  useEditorStore,
  selectChartDefinition,
  selectChartWidth,
  selectChartHeight,
  ChartType,
} from '@/chart'
import { dataURLtoFile, downloadFile } from '@/utils/utils'
import { convertSvgToPdf } from '@/apis'
import ChartInterpretPanel from './ChartInterpretPanel'

export default function ChartView({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  const chartViewRef = useRef<HTMLDivElement>(null)
  const chartWidth = useEditorStore(selectChartWidth)
  const chartHeight = useEditorStore(selectChartHeight)
  const chartDef = useEditorStore(selectChartDefinition)
  const exportChartImage = useEditorStore((s) => s.exportChartImage)
  const mode = useEditorStore((s) => s.mode)
  const [exportingType, setExportingType] = useState<string | null>(null)
  const [showInterpret, setShowInterpret] = useState(false)
  const { message } = App.useApp()

  const chartName = chartDef?.name ?? '图表'
  const chartType = chartDef?.type ?? 'chart'

  const handleExportFile = async (type: 'svg' | 'png' | 'pdf') => {
    setExportingType(type)
    try {
      if (type === 'pdf') {
        const base64 = await exportChartImage('svg')
        const file = dataURLtoFile(base64, `${chartType}.svg`)
        const response = await convertSvgToPdf(file!)
        if (response && response.byteLength > 0) {
          downloadFile(`${chartType}.pdf`, response)
        } else {
          throw new Error('导出 PDF 格式失败, 请尝试使用其他格式')
        }
        return
      }
      const base64 = await exportChartImage(type)
      downloadFile(`${chartType}.${type}`, base64)
    } catch (error) {
      message.error((error as Error).message)
    } finally {
      setExportingType(null)
    }
  }

  const breadcrumbItems = [
    {
      title: (
        <Button type="link" href="/apps/charts">
          数据可视化
        </Button>
      ),
    },
    { title: chartName },
  ]

  return (
    <div ref={chartViewRef}  className="relative flex h-full w-full flex-col overflow-auto">
      <div className="sticky top-0 z-10 flex h-[45px] shrink-0 items-center border-b border-gray-200 bg-white px-4 text-lg font-bold">
        <FundProjectionScreenOutlined className="mr-2" />
        <Breadcrumb items={breadcrumbItems} />
        <div className="flex-1" />
        <Space>
          {mode === 'remote' && (
            <Button
              type={'primary'}
              icon={<BulbOutlined />}
              onClick={() => setShowInterpret(true)}
            >
              数据解读
            </Button>
          )}
          <Button
            onClick={() => handleExportFile('svg')}
            loading={exportingType === 'svg'}
            icon={<FileImageOutlined />}
          >
            导出 SVG
          </Button>
          <Button
            onClick={() => handleExportFile('png')}
            loading={exportingType === 'png'}
            icon={<FileImageOutlined />}
          >
            导出 PNG
          </Button>
          {
            chartType !== ChartType.WORDCLOUD && (
              <Button
                onClick={() => handleExportFile('pdf')}
                loading={exportingType === 'pdf'}
                icon={<FilePdfOutlined />}
              >
                导出 PDF
              </Button>
            )
          }
        </Space>
      </div>
      <div className="flex flex-1 items-center justify-center bg-gray-100">
        <div
          className="bg-white"
          style={{
            userSelect: 'none',
            width: `${chartWidth || 640}px`,
            height: `${chartHeight || 480}px`,
          }}
          ref={containerRef}
        />
      </div>
      <ChartInterpretPanel
        open={showInterpret}
        onClose={() => setShowInterpret(false)}
        getContainer={chartViewRef.current!}
      />
    </div>
  )
}
