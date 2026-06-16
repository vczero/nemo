import { Button, Result } from 'antd'
import {
  DownloadOutlined,
  EditOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import { useCallback, useRef } from 'react'
import { exportImage } from '@/utils/echarts'
import * as echarts from 'echarts'

interface ReportChartCardProps {
  title: string
  icon?: React.ReactNode
  chartId?: string | null
  /** Ref callback to bind the chart container */
  containerRef: (el: HTMLDivElement | null) => void
  width?: number | string
  height?: number | string
  maxWidth?: number | string
  loading?: boolean
  error?: string
}

export default function ReportChartCard({
  title,
  icon,
  chartId,
  containerRef,
  maxWidth,
  height = 360,
  loading = false,
  error,
}: ReportChartCardProps) {
  const navigate = useNavigate()
  const containerElRef = useRef<HTMLDivElement | null>(null)

  const handleRef = useCallback(
    (el: HTMLDivElement | null) => {
      containerElRef.current = el
      containerRef(el)
    },
    [containerRef],
  )

  const handleDownload = useCallback(async () => {
    const container = containerElRef.current
    if (!container) return

    const instance = echarts.getInstanceByDom(container)
    if (!instance) return

    try {
      const dataUrl = await exportImage(instance, 'png', 3)
      const link = document.createElement('a')
      link.download = `${title}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Download chart image failed:', err)
    }
  }, [title])

  const handleEdit = useCallback(() => {
    if (chartId) {
      navigate(`/my-charts/edit?id=${chartId}`)
    }
  }, [chartId, navigate])

  return (
    <div className="rounded-sm border border-gray-200 bg-white">
      <div className="mb-3 flex items-center bg-gray-100 justify-between border-b border-gray-200 p-2">
        <h3 className="text-sm font-semibold">
          {icon && <span className="mr-1">{icon}</span>}
          {title}
        </h3>
        <Button
          size="small"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
          disabled={loading || !!error}
        >
          下载图片
        </Button>
      </div>

      {error ? (
        <div
          className="flex items-center justify-center"
          style={{ height: height }}
        >
          <Result
            status="warning"
            title="图表加载失败"
            subTitle={error}
          />
        </div>
      ) : (
      <div className='w-full flex items-center justify-center' style={{ height: height }}>
          <div
            ref={handleRef}
            style={{ height: height, width: '100%', maxWidth: maxWidth, margin: '0 auto' }}
          />
        </div>
      )}

      {chartId && (
        <div className="p-2 flex justify-end">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={handleEdit}
          >
            编辑
          </Button>
        </div>
      )}
    </div>
  )
}
